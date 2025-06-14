
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const CHAPA_SECRET_KEY = Deno.env.get("CHAPA_SECRET_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CHAPA_VERIFY_URL = 'https://api.chapa.co/v1/transaction/verify/';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting payment verification...');
    
    const { tx_ref } = await req.json();
    console.log('Verifying payment for tx_ref:', tx_ref);

    if (!tx_ref) {
      console.error('Missing tx_ref in request');
      return new Response(JSON.stringify({ error: "tx_ref is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!CHAPA_SECRET_KEY) {
      console.error('CHAPA_SECRET_KEY environment variable not set');
      return new Response(JSON.stringify({ error: "Payment service configuration error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify payment with Chapa using their documentation format
    console.log('Calling Chapa verify API...');
    const verifyResponse = await fetch(CHAPA_VERIFY_URL + tx_ref, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${CHAPA_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('Chapa API response status:', verifyResponse.status);
    
    if (!verifyResponse.ok) {
      const errorText = await verifyResponse.text();
      console.error('Chapa API error:', errorText);
      return new Response(
        JSON.stringify({ 
          error: `Chapa verification failed: ${verifyResponse.status}`,
          details: errorText 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    const chapaResult = await verifyResponse.json();
    console.log('Chapa verification result:', JSON.stringify(chapaResult, null, 2));

    // Check if verification was successful according to Chapa docs
    if (chapaResult.status !== 'success') {
      console.log('Chapa API returned non-success status:', chapaResult.status);
      return new Response(
        JSON.stringify({ 
          error: chapaResult.message || "Payment verification failed",
          chapa_status: chapaResult.status,
          chapa_data: chapaResult.data
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    const paymentData = chapaResult.data;
    console.log('Payment data from Chapa:', paymentData);

    // Connect to Supabase for ticket purchase creation
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Supabase configuration missing');
      return new Response(
        JSON.stringify({ error: 'Database configuration error' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Determine payment status based on Chapa response
    let payment_status = "pending";
    if (paymentData && paymentData.status) {
      const chapaStatus = paymentData.status.toLowerCase();
      console.log('Chapa payment status:', chapaStatus);
      
      if (chapaStatus === "success") {
        payment_status = "completed";
      } else if (chapaStatus === "failed") {
        payment_status = "failed";
      }
    }

    // Extract event_id and other metadata from tx_ref or meta
    let event_id = null;
    let tickets_quantity = 1;
    
    if (paymentData.meta) {
      event_id = paymentData.meta.event_id;
      tickets_quantity = parseInt(paymentData.meta.tickets_quantity) || 1;
    }

    // Look for existing ticket purchase with this tx_ref
    console.log('Looking for existing ticket purchase...');
    const { data: existingPurchase, error: findError } = await supabase
      .from("ticket_purchases")
      .select("*")
      .eq("chapa_transaction_id", tx_ref)
      .maybeSingle();

    if (findError) {
      console.error('Error finding ticket purchase:', findError);
      return new Response(
        JSON.stringify({ error: "Database error while finding purchase" }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    if (existingPurchase) {
      console.log('Found existing purchase, updating status...');
      // Update existing purchase
      const { error: updateError } = await supabase
        .from("ticket_purchases")
        .update({ 
          payment_status,
          updated_at: new Date().toISOString()
        })
        .eq("id", existingPurchase.id);

      if (updateError) {
        console.error('Error updating ticket purchase:', updateError);
        return new Response(
          JSON.stringify({ error: "Database error while updating purchase" }),
          { 
            status: 500, 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        );
      }
    } else if (payment_status === "completed" && event_id) {
      console.log('Creating new ticket purchase for successful payment...');
      
      // Create new ticket purchase for successful payment
      const newPurchase = {
        event_id: event_id,
        buyer_name: `${paymentData.first_name || ''} ${paymentData.last_name || ''}`.trim(),
        buyer_email: paymentData.email || '',
        buyer_phone: paymentData.phone || null,
        tickets_quantity: tickets_quantity,
        amount_paid: parseFloat(paymentData.amount) || 0,
        payment_status: "completed",
        chapa_transaction_id: tx_ref,
        purchase_date: new Date().toISOString(),
        checked_in: false
      };

      const { error: insertError } = await supabase
        .from("ticket_purchases")
        .insert([newPurchase]);

      if (insertError) {
        console.error('Error creating ticket purchase:', insertError);
        return new Response(
          JSON.stringify({ error: "Database error while creating purchase" }),
          { 
            status: 500, 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        );
      }

      console.log('Ticket purchase created successfully');
    }

    // Return verification result
    const result = {
      payment_status,
      chapa_status: paymentData?.status || 'unknown',
      amount: paymentData?.amount || 0,
      currency: paymentData?.currency || 'ETB',
      tx_ref: tx_ref,
      verified_at: new Date().toISOString(),
      buyer_info: {
        name: `${paymentData?.first_name || ''} ${paymentData?.last_name || ''}`.trim(),
        email: paymentData?.email || '',
        phone: paymentData?.phone || ''
      },
      event_id: event_id,
      tickets_quantity: tickets_quantity,
      raw_chapa_data: paymentData
    };

    console.log('Returning verification result:', result);

    return new Response(
      JSON.stringify(result),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error) {
    console.error('Payment verification error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Payment verification failed",
        details: error.toString()
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
