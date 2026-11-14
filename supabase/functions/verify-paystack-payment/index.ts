// supabase/functions/verify-paystack-payment/index.ts
// Secure server-side Paystack transaction verification and Pro tier upgrade

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY')?.trim() || ''

    if (!paystackSecretKey) {
      console.error('[verify-paystack-payment] Missing PAYSTACK_SECRET_KEY in environment')
      return new Response(JSON.stringify({ error: 'Server configuration error: payment processor key missing' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Authenticate calling user with anon key and user's Bearer JWT
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser()

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Invalid user session' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const body = await req.json().catch(() => ({}))
    const reference = body?.reference

    if (!reference || typeof reference !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing payment reference' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Verify transaction with official Paystack API
    const paystackRes = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${paystackSecretKey}`,
          'Content-Type': 'application/json',
        },
      }
    )

    const paystackData = await paystackRes.json()

    if (!paystackRes.ok || !paystackData.status || !paystackData.data) {
      return new Response(
        JSON.stringify({
          error: paystackData.message || 'Payment verification failed with Paystack',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const tx = paystackData.data

    if (tx.status !== 'success') {
      return new Response(
        JSON.stringify({ error: `Payment not completed. Transaction status: ${tx.status}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Confirm amount (minimum 100,000 kobo = ₦1,000) and currency (NGN)
    if (Number(tx.amount) < 100000 || tx.currency !== 'NGN') {
      return new Response(
        JSON.stringify({ error: 'Invalid transaction amount or currency. Expected ₦1,000 NGN.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Process Pro upgrade and commission atomically using privileged service role
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
    const { data: upgradeResult, error: upgradeError } = await supabaseAdmin.rpc(
      'process_verified_pro_upgrade',
      {
        p_user_id: user.id,
        p_reference: reference,
        p_amount: tx.amount / 100,
        p_gateway_response: tx,
      }
    )

    if (upgradeError) {
      console.error('[verify-paystack-payment] RPC error:', upgradeError)
      return new Response(
        JSON.stringify({ error: upgradeError.message || 'Failed to process Pro upgrade' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true, user_id: user.id, result: upgradeResult }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err: unknown) {
    const error = err as Error
    console.error('[verify-paystack-payment] Server error:', error)
    return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
