
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const CHAPA_SECRET_KEY = Deno.env.get("CHAPA_SECRET_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface CreateChapaPaymentRequest {
  event_id: string;
  amount: number;
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  tx_ref: string;
  return_url: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: CreateChapaPaymentRequest = await req.json();

    // Construct Chapa request body
    const chapaPayload = {
      amount: body.amount,
      currency: "ETB",
      email: body.email,
      first_name: body.first_name,
      last_name: body.last_name,
      phone_number: body.phone_number,
      tx_ref: body.tx_ref,
      return_url: body.return_url,
      customization: {
        title: "Event Ticket Purchase",
        description: "Purchase for event " + body.event_id,
      },
    };

    // Make request to Chapa API
    const chapaRes = await fetch("https://api.chapa.co/v1/transaction/initialize", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${CHAPA_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(chapaPayload),
    });

    const chapaData = await chapaRes.json();

    if (!chapaRes.ok || !chapaData.status) {
      return new Response(
        JSON.stringify({ error: chapaData.message || "Failed to init Chapa payment" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Return Chapa checkout URL & txn reference
    return new Response(
      JSON.stringify({
        chapa_checkout_url: chapaData.data.checkout_url,
        chapa_tx_ref: chapaData.data.tx_ref,
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
