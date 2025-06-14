
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

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
      console.error("Server misconfiguration: Supabase environment variables are missing.");
      return new Response(JSON.stringify({ error: "Server misconfiguration" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    console.log("Chapa webhook received:", JSON.stringify(body, null, 2));

    const paymentData = body.data || body;

    const tx_ref = paymentData?.tx_ref;
    if (!tx_ref) {
        console.error("Webhook ignored: Missing tx_ref.");
        return new Response(JSON.stringify({ error: "Missing tx_ref" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }

    const payment_status = (paymentData?.status || "").toLowerCase();
    const amount = parseFloat(paymentData?.amount || "0");
    const meta = paymentData?.meta || {};
    const event_id = meta.event_id || (tx_ref && tx_ref.startsWith('tx_') ? tx_ref.split('_')[1] : null);
    
    console.log(`Processing webhook for tx_ref: ${tx_ref}`);

    if (!event_id) {
        console.error(`Webhook ignored: Could not determine event_id for tx_ref: ${tx_ref}`);
        return new Response(JSON.stringify({ error: "Missing event_id" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }

    let db_status = "pending";
    if (payment_status === "success") {
      db_status = "completed";
    } else if (payment_status === "failed" || payment_status === "cancelled") {
      db_status = "failed";
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: existingPurchase, error: findError } = await supabase
      .from("ticket_purchases")
      .select("id, payment_status")
      .eq("chapa_transaction_id", tx_ref)
      .maybeSingle();

    if (findError) {
      console.error(`DB error finding purchase for ${tx_ref}:`, findError.message);
      return new Response(JSON.stringify({ error: "Database query failed." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (existingPurchase) {
      if (existingPurchase.payment_status === 'completed' && db_status === 'completed') {
        console.log(`Purchase ${tx_ref} already completed. Ignoring webhook.`);
        return new Response(JSON.stringify({ ok: true, message: "Already processed" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const updatePayload: any = {
        payment_status: db_status,
        raw_chapa_data: body,
        updated_at: new Date().toISOString(),
      };
      
      if (amount > 0) {
        updatePayload.amount_paid = amount;
      }
      
      const { error: updateError } = await supabase
        .from("ticket_purchases")
        .update(updatePayload)
        .eq("id", existingPurchase.id);

      if (updateError) {
        console.error(`Error updating purchase ${tx_ref}:`, updateError.message);
        return new Response(JSON.stringify({ error: "Failed to update purchase" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      console.log(`Updated purchase ${tx_ref} to status: ${db_status}.`);
    } else {
      console.warn(`No pending purchase found for tx_ref: ${tx_ref}. This may indicate a race condition or an issue with initial purchase creation.`);
      if (db_status === 'completed') {
        console.log(`Creating fallback purchase for ${tx_ref} as it is successful.`);
        const tickets_quantity = parseInt(meta.tickets_quantity || "1") || 1;
        const newPurchase = {
          event_id,
          buyer_name: `${paymentData.first_name || ''} ${paymentData.last_name || ''}`.trim() || 'Unknown',
          buyer_email: paymentData.email || 'unknown@email.com',
          buyer_phone: paymentData.phone || null,
          tickets_quantity,
          amount_paid: amount,
          payment_status: db_status,
          payment_method: 'chapa',
          chapa_transaction_id: tx_ref,
          purchase_date: new Date().toISOString(),
          raw_chapa_data: body,
        };
        const { error: insertError } = await supabase.from('ticket_purchases').insert(newPurchase);
        if (insertError) {
          console.error(`Fallback insert failed for tx_ref ${tx_ref}:`, insertError.message);
        } else {
          console.log(`Successfully created fallback purchase for ${tx_ref}.`);
        }
      }
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    console.error("Unhandled webhook error:", err);
    return new Response(JSON.stringify({ error: err.message, detail: err.toString() }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
