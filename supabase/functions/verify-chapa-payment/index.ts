
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

// Get secrets from env
const CHAPA_SECRET_KEY = Deno.env.get("CHAPA_SECRET_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Chapa API endpoint
const CHAPA_VERIFY_URL = 'https://api.chapa.co/v1/transaction/verify/';

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  try {
    const { tx_ref } = await req.json();

    if (!tx_ref) {
      return new Response(JSON.stringify({ error: "tx_ref is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Call Chapa to verify
    const verifyRes = await fetch(CHAPA_VERIFY_URL + tx_ref, {
      headers: {
        Authorization: `Bearer ${CHAPA_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
    });
    const raw = await verifyRes.json();
    if (!raw.status) {
      return new Response(
        JSON.stringify({ error: raw.message || "Payment verification failed" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const chapaData = raw.data;

    // Connect supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(
        JSON.stringify({ error: 'Supabase configuration missing' }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Find and update the corresponding ticket_purchase row (using tx_ref = chapa_transaction_id)
    const { data: ticket, error: findErr } = await supabase
      .from("ticket_purchases")
      .select("*")
      .eq("chapa_transaction_id", tx_ref)
      .maybeSingle();

    if (findErr || !ticket) {
      return new Response(
        JSON.stringify({ error: "Ticket purchase not found for tx_ref" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update payment status if successful
    let payment_status = "pending";
    if (chapaData && chapaData.status && chapaData.status.toLowerCase() === "success") {
      payment_status = "completed";
    } else if (chapaData && chapaData.status && chapaData.status.toLowerCase() === "failed") {
      payment_status = "failed";
    }
    // Optionally handle refund, cancelled, etc.

    const { error: updateErr } = await supabase
      .from("ticket_purchases")
      .update({ payment_status })
      .eq("id", ticket.id);

    // Return final status and data
    return new Response(
      JSON.stringify({
        payment_status,
        chapa_status: chapaData.status,
        amount: chapaData.amount,
        raw: chapaData,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
