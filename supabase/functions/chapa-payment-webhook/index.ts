
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

// Chapa optionally sends an X-Chapa-Signature header for security;
// if you want, you can fetch the secret signature from Deno.env and implement verification.

// Minimal CORS headers for Chapa webhook.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, X-Chapa-Signature",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(JSON.stringify({ error: "Server misconfiguration. Try again soon." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const body = await req.json();
    console.log("Webhook received:", JSON.stringify(body, null, 2));

    // Chapa payload reference: https://developer.chapa.co/docs/webhooks/
    const paymentData = body;
    const tx_ref = paymentData?.tx_ref || paymentData?.data?.tx_ref;
    const event_id =
      paymentData?.meta?.event_id ||
      paymentData?.["meta[event_id]"] ||
      paymentData?.data?.meta?.event_id ||
      paymentData?.data?.["meta[event_id]"] ||
      (tx_ref && tx_ref.startsWith('tx_') ? tx_ref.split('_')[1] : null);
    const tickets_quantity =
      parseInt(
        paymentData?.meta?.tickets_quantity ||
          paymentData?.["meta[tickets_quantity]"] ||
          paymentData?.data?.meta?.tickets_quantity ||
          paymentData?.data?.["meta[tickets_quantity]"] ||
          "1"
      ) || 1;

    let buyer_first_name =
      paymentData?.first_name ||
      paymentData?.data?.first_name ||
      "";
    let buyer_last_name =
      paymentData?.last_name ||
      paymentData?.data?.last_name ||
      "";

    let buyer_name = `${buyer_first_name} ${buyer_last_name}`.trim();
    let buyer_email =
      paymentData?.email ||
      paymentData?.data?.email ||
      "";
    let buyer_phone =
      paymentData?.phone ||
      paymentData?.data?.phone ||
      null;

    let amount =
      parseFloat(paymentData?.amount || paymentData?.data?.amount || "0");
    let currency =
      paymentData?.currency ||
      paymentData?.data?.currency ||
      "ETB";
    let payment_method =
      paymentData?.method ||
      paymentData?.data?.method ||
      "chapa";

    let payment_status =
      (paymentData?.status || paymentData?.data?.status || "").toLowerCase();

    // Map Chapa status to app status
    let db_status = "pending";
    if (payment_status === "success") {
      db_status = "completed";
    } else if (payment_status === "failed") {
      db_status = "failed";
    }

    console.log("tx_ref:", tx_ref, "event_id:", event_id, "qty:", tickets_quantity, "email:", buyer_email);

    // Connect to Supabase
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Look for an existing purchase by chapa_transaction_id (tx_ref)
    const { data: existing, error: findError } = await supabase
      .from("ticket_purchases")
      .select("*")
      .eq("chapa_transaction_id", tx_ref)
      .maybeSingle();

    if (findError) {
      console.error("Error finding existing purchase:", findError);
      return new Response(
        JSON.stringify({ error: "Error checking for duplicate purchase.", details: findError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let dbResult = null;
    if (existing) {
      // Update with new data
      const updateData: any = {
        payment_status: db_status,
        payment_method,
        updated_at: new Date().toISOString(),
        buyer_name: buyer_name.length ? buyer_name : existing.buyer_name,
        buyer_email: buyer_email || existing.buyer_email,
        buyer_phone: buyer_phone || existing.buyer_phone,
        tickets_quantity: tickets_quantity || existing.tickets_quantity,
        amount_paid: amount || existing.amount_paid,
        chapa_transaction_id: tx_ref,
        chapa_checkout_url: null,
        raw_chapa_data: paymentData,
      };
      const { error: updateError } = await supabase
        .from("ticket_purchases")
        .update(updateData)
        .eq("id", existing.id);
      if (updateError) {
        console.error("Error updating purchase:", updateError);
        return new Response(JSON.stringify({ error: "Failed to update purchase.", details: updateError.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      dbResult = updateData;
      console.log("Updated existing purchase:", existing.id);
    } else if (db_status === "completed" && event_id) {
      // Insert new
      const newPurchase: any = {
        event_id,
        buyer_name: buyer_name || "Unknown",
        buyer_email,
        buyer_phone,
        tickets_quantity,
        amount_paid: amount,
        payment_status: db_status,
        payment_method,
        chapa_transaction_id: tx_ref,
        chapa_checkout_url: null,
        purchase_date: new Date().toISOString(),
        checked_in: false,
        check_in_time: null,
        raw_chapa_data: paymentData,
      };
      const { data: insertData, error: insertError } = await supabase
        .from("ticket_purchases")
        .insert([newPurchase])
        .select()
        .single();
      if (insertError) {
        console.error("Error inserting purchase:", insertError);
        return new Response(JSON.stringify({ error: "Failed to create purchase.", details: insertError.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      dbResult = insertData;
      console.log("Inserted new purchase:", insertData?.id);
    } else {
      let message = [];
      if (db_status !== "completed") message.push(`Payment not completed (status: ${db_status})`);
      if (!event_id) message.push("event_id missing");
      console.error("Purchase not saved:", message.join(", "));
      return new Response(
        JSON.stringify({
          error: "Purchase not saved",
          details: message.join(", "),
          chapa_data: paymentData
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        ok: true,
        tx_ref,
        status: db_status,
        chapa_status: payment_status,
        event_id,
        tickets_quantity,
        db: dbResult,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  } catch (err: any) {
    console.error("Webhook error:", err);
    return new Response(
      JSON.stringify({ error: err.message, detail: err.toString() }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
