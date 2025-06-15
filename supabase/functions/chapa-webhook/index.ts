
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, chapa-signature',
};

// Chapa sends the webhook secret in the "chapa-signature" header
const CHAPA_WEBHOOK_SECRET = Deno.env.get("CHAPA_WEBHOOK_SECRET");

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Only allow POST
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", {
      status: 405,
      headers: corsHeaders,
    });
  }

  // Verify webhook secret/signature
  const chapaSignature = req.headers.get("chapa-signature");
  if (!CHAPA_WEBHOOK_SECRET) {
    console.error("[Webhook] CHAPA_WEBHOOK_SECRET is not configured.");
    return new Response("Webhook secret not configured", {
      status: 500,
      headers: corsHeaders,
    });
  }
  if (chapaSignature !== CHAPA_WEBHOOK_SECRET) {
    console.warn("[Webhook] Invalid webhook signature:", chapaSignature);
    return new Response("Forbidden", { status: 403, headers: corsHeaders });
  }

  // Parse the incoming JSON data
  let payload: any;
  try {
    payload = await req.json();
  } catch (err) {
    console.error("[Webhook] Failed to parse webhook payload:", err);
    return new Response("Bad Request", { status: 400, headers: corsHeaders });
  }

  console.log("[Webhook] Payload received:", JSON.stringify(payload));

  // Chapa sends payment change notifications - see Chapa docs
  // The event type and details are found in the parsed JSON
  try {
    const { event, data } = payload;

    // Only handle payment.success or payment.failed events as needed
    // Assume data.tx_ref or data.tx_ref contains the reference
    if (!data?.tx_ref) {
      return new Response("tx_ref missing", { status: 400, headers: corsHeaders });
    }

    // Set up Supabase client for DB operations
    // @ts-ignore (Supabase Deno env imports)
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2.50.0");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get purchase by chapa_tx_ref
    const { data: purchase, error } = await supabase
      .from("ticket_purchases")
      .select("*")
      .eq("chapa_tx_ref", data.tx_ref)
      .single();

    if (error || !purchase) {
      console.error("[Webhook] No purchase found for tx_ref:", data.tx_ref, error);
      return new Response("Purchase not found", { status: 404, headers: corsHeaders });
    }

    // Update payment status based on event/status
    let newStatus = purchase.payment_status;
    if (
      event === "payment.success" ||
      (data.status && data.status.toLowerCase() === "success")
    ) {
      newStatus = "completed";
    } else if (
      event === "payment.failed" ||
      (data.status && data.status.toLowerCase() === "failed")
    ) {
      newStatus = "failed";
    } // else, keep as is or add more as needed

    // Update the DB if something changed
    if (newStatus !== purchase.payment_status) {
      const { error: updateError } = await supabase
        .from("ticket_purchases")
        .update({
          payment_status: newStatus,
          chapa_transaction_id: data.reference || data.tx_ref,
          raw_chapa_data: data, // Optionally store the full raw payload
        })
        .eq("id", purchase.id);

      if (updateError) {
        console.error("[Webhook] Failed to update payment status:", updateError);
        return new Response("DB update error", { status: 500, headers: corsHeaders });
      }
      console.log("[Webhook] Payment status updated to", newStatus, "for", data.tx_ref);
    } else {
      console.log("[Webhook] No payment status change needed for", data.tx_ref);
    }

    // Respond to Chapa promptly
    return new Response("ok", { status: 200, headers: corsHeaders });
  } catch (err) {
    console.error("[Webhook] Handler error:", err);
    return new Response("Internal Server Error", { status: 500, headers: corsHeaders });
  }
});
