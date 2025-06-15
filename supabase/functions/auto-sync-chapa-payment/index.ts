
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
  }

  const CHAPA_SECRET_KEY = Deno.env.get('CHAPA_SECRET_KEY');
  if (!CHAPA_SECRET_KEY) {
    return new Response(
      JSON.stringify({ error: "CHAPA_SECRET_KEY not configured" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': "application/json" } }
    );
  }

  // Set up Supabase client
  // @ts-ignore (Supabase Deno env imports)
  const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2.50.0");
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Find pending purchases with a chapa_tx_ref
  const { data: pending, error } = await supabase
    .from("ticket_purchases")
    .select("*")
    .eq("payment_status", "pending")
    .not("chapa_tx_ref", "is", null)
    .order("created_at", { ascending: false });

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': "application/json" } }
    );
  }

  if (!pending || pending.length === 0) {
    return new Response(
      JSON.stringify({ results: [], message: "No pending Chapa purchases to verify" }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': "application/json" } }
    );
  }

  const results = [];
  // For each pending payment, verify with Chapa API and update if needed
  for (const purchase of pending) {
    let result = {
      tx_ref: purchase.chapa_tx_ref,
      id: purchase.id,
      updated: false,
      chapa_status: null,
      error: null as string | null,
    };

    try {
      const chapaRes = await fetch(`https://api.chapa.co/v1/transaction/verify/${purchase.chapa_tx_ref}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${CHAPA_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      });
      const json = await chapaRes.json();

      result.chapa_status = json.data?.status || null;
      if (json.status === "success" && json.data?.status === "success") {
        // Update purchase to completed
        const { error: updateError } = await supabase
          .from("ticket_purchases")
          .update({
            payment_status: "completed",
            chapa_transaction_id: json.data.reference || json.data.id,
            raw_chapa_data: json.data
          })
          .eq("id", purchase.id);
        if (updateError) {
          result.error = `DB update error: ${updateError.message}`;
        } else {
          result.updated = true;
        }
      } else if (json.data?.status === "failed") {
        // Optionally: set status to failed
        await supabase
          .from("ticket_purchases")
          .update({
            payment_status: "failed",
            raw_chapa_data: json.data
          })
          .eq("id", purchase.id);
        // Not marking as error, just info.
      }
    } catch (e: any) {
      result.error = e.message;
    }
    results.push(result);
  }

  return new Response(
    JSON.stringify({ results }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': "application/json" } }
  );
});
