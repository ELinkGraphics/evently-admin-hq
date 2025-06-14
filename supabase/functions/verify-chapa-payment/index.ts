
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting payment status check...');
    const { tx_ref } = await req.json();

    if (!tx_ref) {
      console.error('Missing tx_ref in request');
      return new Response(JSON.stringify({ error: "tx_ref is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log('Checking payment status for tx_ref:', tx_ref);

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Supabase configuration missing');
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // This function NOW ONLY reads from the database.
    // The webhook is responsible for writing the payment status.
    const { data: purchase, error: dbError } = await supabase
      .from("ticket_purchases")
      .select("*")
      .eq("chapa_transaction_id", tx_ref)
      .maybeSingle();

    if (dbError) {
      console.error('Error fetching purchase status:', dbError);
      return new Response(
        JSON.stringify({ error: "Database error checking purchase status" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!purchase) {
      console.log(`No purchase found for tx_ref: ${tx_ref}. It might not be created yet.`);
      // The frontend should handle this state, perhaps by polling this endpoint.
      return new Response(
        JSON.stringify({ error: "Purchase not found. Please wait, payment may be processing." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found purchase for ${tx_ref} with status: ${purchase.payment_status}`);

    // Return the purchase data directly.
    // The frontend will interpret the payment_status.
    return new Response(
      JSON.stringify(purchase),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error('Payment status check error:', error);
    return new Response(
      JSON.stringify({
        error: error.message || "Payment status check failed",
        details: error.toString(),
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
