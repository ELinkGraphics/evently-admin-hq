
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
    console.log('Verifying Chapa payment:', { tx_ref, status })

    // Verify payment with Chapa API
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
    console.log('Chapa verification response:', verificationData)

    // Update purchase record based on verification
    if (verificationData.status === 'success' && verificationData.data.status === 'success') {
      const { error: updateError } = await supabase
        .from('ticket_purchases')
        .update({
          payment_status: 'completed',
          chapa_transaction_id: verificationData.data.reference,
          raw_chapa_data: verificationData.data
        })
        .eq('chapa_tx_ref', tx_ref)

      if (updateError) {
        throw new Error('Failed to update purchase record')
      }

      console.log('Payment verified and purchase updated successfully')
    } else {
      const { error: updateError } = await supabase
        .from('ticket_purchases')
        .update({
          payment_status: 'failed',
          raw_chapa_data: verificationData.data
        })
        .eq('chapa_tx_ref', tx_ref)

      if (updateError) {
        console.error('Failed to update failed purchase record:', updateError)
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        verified: verificationData.status === 'success' && verificationData.data.status === 'success'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Error verifying Chapa payment:', error)
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
