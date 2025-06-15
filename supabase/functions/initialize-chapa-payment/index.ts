
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

    const { 
      eventId, 
      firstName, 
      lastName, 
      email, 
      phone, 
      quantity, 
      customFields,
      eventName,
      eventDescription,
      eventBannerImage 
    } = await req.json()

    console.log('Initializing Chapa payment for:', { eventId, firstName, lastName, email, quantity })

    // Get event details
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single()

    if (eventError || !event) {
      throw new Error('Event not found')
    }

    const totalAmount = event.price * quantity
    const chapaTxRef = `event_${eventId}_${Date.now()}`

    // Create pending purchase record
    const { data: purchase, error: purchaseError } = await supabase
      .from('ticket_purchases')
      .insert([{
        event_id: eventId,
        first_name: firstName,
        last_name: lastName,
        buyer_email: email,
        buyer_phone: phone || null,
        tickets_quantity: quantity,
        amount_paid: totalAmount,
        custom_fields: customFields || {},
        chapa_tx_ref: chapaTxRef,
        payment_status: 'pending'
      }])
      .select()
      .single()

    if (purchaseError) {
      throw new Error('Failed to create purchase record')
    }

    // Initialize Chapa payment
    const chapaPublicKey = Deno.env.get('CHAPA_PUBLIC_KEY')
    if (!chapaPublicKey) {
      throw new Error('Chapa public key not configured')
    }

    const chapaPayload = {
      public_key: chapaPublicKey,
      tx_ref: chapaTxRef,
      amount: totalAmount,
      currency: 'ETB',
      email: email,
      first_name: firstName,
      last_name: lastName,
      phone_number: phone,
      title: eventName || event.name,
      description: eventDescription || event.description || `Tickets for ${event.name}`,
      logo: eventBannerImage || event.banner_image,
      callback_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/verify-chapa-payment`,
      return_url: `${req.headers.get('origin')}/event/${eventId}?payment=success&tx_ref=${chapaTxRef}`,
      meta: {
        event_id: eventId,
        purchase_id: purchase.id
      }
    }

    console.log('Chapa payload prepared:', chapaPayload)

    return new Response(
      JSON.stringify({
        success: true,
        chapaPayload,
        txRef: chapaTxRef,
        purchaseId: purchase.id
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Error initializing Chapa payment:', error)
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
