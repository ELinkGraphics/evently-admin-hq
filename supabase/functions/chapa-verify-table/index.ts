
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

  let txRefs: string[] = [];
  try {
    const body = await req.json();
    txRefs = body.tx_refs;
    if (!Array.isArray(txRefs) || !txRefs.length) {
      throw new Error("Missing or invalid tx_refs in body");
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: "Invalid JSON or tx_refs" }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': "application/json" },
    });
  }

  const CHAPA_SECRET_KEY = Deno.env.get('CHAPA_SECRET_KEY');
  if (!CHAPA_SECRET_KEY) {
    return new Response(JSON.stringify({ error: "CHAPA_SECRET_KEY not configured" }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': "application/json" },
    });
  }

  // For each tx_ref, fetch real-time status from Chapa
  const results = await Promise.all(
    txRefs.map(async (tx_ref: string) => {
      try {
        const res = await fetch(`https://api.chapa.co/v1/transaction/verify/${tx_ref}`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${CHAPA_SECRET_KEY}`,
            "Content-Type": "application/json",
          },
        });
        const json = await res.json();
        return {
          tx_ref,
          status: json.status,
          chapa_status: json.data?.status ?? null,
          chapa_data: json.data ?? null,
          error: res.ok ? null : (json.error || json.message || 'Unknown error'),
        };
      } catch (e: any) {
        return {
          tx_ref,
          status: 'error',
          chapa_status: null,
          chapa_data: null,
          error: e.message,
        };
      }
    })
  );

  return new Response(JSON.stringify({ results }), {
    headers: { ...corsHeaders, 'Content-Type': "application/json" },
    status: 200,
  });
});
