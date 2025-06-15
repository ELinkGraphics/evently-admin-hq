import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const chapaSecretKey = Deno.env.get('CHAPA_SECRET_KEY')
    if (!chapaSecretKey) {
      throw new Error('Chapa secret key not configured')
    }

    const { tx_ref, status } = await req.json()
    console.log('[verify-chapa] Incoming request data:', { tx_ref, status })

    // Double-check purchase record before verification
    const { data: purchase, error: purchaseError } = await supabase
      .from('ticket_purchases')
      .select('*')
      .eq('chapa_tx_ref', tx_ref)
      .maybeSingle()

    if (purchaseError) {
      throw new Error('Failed to fetch ticket purchase: ' + purchaseError.message)
    }
    if (!purchase) {
      console.error('[verify-chapa] No ticket purchase found for tx_ref:', tx_ref)
      return new Response(JSON.stringify({ success: false, error: "Purchase not found" }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Always verify with Chapa API to get the real payment status
    const verifyResponse = await fetch(`https://api.chapa.co/v1/transaction/verify/${tx_ref}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${chapaSecretKey}`,
        'Content-Type': 'application/json'
      }
    })

    if (!verifyResponse.ok) {
      throw new Error('Failed to verify payment with Chapa')
    }

    const verificationData = await verifyResponse.json()
    console.log('[verify-chapa] Chapa verification response:', verificationData)

    // If payment is verified as success, complete the ticket purchase/payment status
    if (verificationData.status === 'success' && verificationData.data?.status === 'success') {
      // Mark the payment as completed and store transaction and raw data
      const { error: updateError } = await supabase
        .from('ticket_purchases')
        .update({
          payment_status: 'completed',
          chapa_transaction_id: verificationData.data.reference || verificationData.data.id,
          raw_chapa_data: verificationData.data
        })
        .eq('chapa_tx_ref', tx_ref)

      if (updateError) {
        console.error('[verify-chapa] Failed to update purchase as completed:', updateError)
        throw new Error('Failed to update purchase record')
      }

      console.log('[verify-chapa] Payment verified and purchase updated to completed')

      return new Response(
        JSON.stringify({
          success: true,
          verified: true,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    } else {
      // Otherwise, mark as failed and log the data
      const { error: updateError } = await supabase
        .from('ticket_purchases')
        .update({
          payment_status: 'failed',
          raw_chapa_data: verificationData.data
        })
        .eq('chapa_tx_ref', tx_ref)

      if (updateError) {
        console.error('[verify-chapa] Failed to update failed purchase record:', updateError)
      }

      return new Response(
        JSON.stringify({
          success: false,
          verified: false,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

  } catch (error) {
    console.error('[verify-chapa] Error verifying Chapa payment:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
