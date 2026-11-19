// supabase/functions/resolve-bank-account/index.ts
// Secure server-side Paystack NUBAN bank account resolution proxy with per-user rate limiting

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
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

    let userId = 'anon'
    let supabaseClient = null

    if (supabaseUrl && (supabaseServiceKey || supabaseAnonKey)) {
      supabaseClient = createClient(
        supabaseUrl,
        supabaseServiceKey || supabaseAnonKey,
        authHeader ? { global: { headers: { Authorization: authHeader } } } : undefined
      )

      if (authHeader) {
        try {
          const { data: { user } } = await supabaseClient.auth.getUser()
          if (user?.id) {
            userId = user.id
          }
        } catch (err) {
          console.warn('[resolve-bank-account] Could not parse user from token:', err)
        }
      }
    }

    // Enforce rate limiting: max 10 bank resolution requests per hour per user via check_rate_limit
    if (supabaseClient) {
      try {
        const { data: isAllowed, error: rpcErr } = await supabaseClient.rpc('check_rate_limit', {
          p_bucket_key: `bank_resolve:${userId}`,
          p_max_requests: 10,
          p_window_seconds: 3600,
        })

        if (!rpcErr && isAllowed === false) {
          return new Response(
            JSON.stringify({
              success: false,
              message: 'Too many bank verification attempts. Please try again later.',
            }),
            {
              status: 429,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          )
        }
      } catch (rateLimitEx) {
        console.warn('[resolve-bank-account] Rate limiter check warning:', rateLimitEx)
      }
    }

    const body = await req.json().catch(() => ({}))
    const accountNumber = String(body?.accountNumber || '').trim().replace(/\D/g, '')
    const bankCode = String(body?.bankCode || '').trim()

    if (accountNumber.length !== 10) {
      return new Response(
        JSON.stringify({ success: false, message: 'Account number must be exactly 10 digits.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!bankCode) {
      return new Response(
        JSON.stringify({ success: false, message: 'Bank code is required.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY')?.trim() || ''
    if (!paystackSecretKey) {
      console.error('[resolve-bank-account] Missing PAYSTACK_SECRET_KEY in environment')
      return new Response(
        JSON.stringify({ success: false, message: 'Payment gateway configuration missing' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const paystackRes = await fetch(
      `https://api.paystack.co/bank/resolve?account_number=${encodeURIComponent(accountNumber)}&bank_code=${encodeURIComponent(bankCode)}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${paystackSecretKey}`,
          'Content-Type': 'application/json',
        },
      }
    )

    const data = await paystackRes.json()

    if (paystackRes.ok && data.status && data.data) {
      return new Response(
        JSON.stringify({
          success: true,
          account_name: data.data.account_name,
          account_number: data.data.account_number,
          bank_id: data.data.bank_id,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({
        success: false,
        message: data.message || 'Unable to verify account details with bank.',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err: unknown) {
    const error = err as Error
    console.error('[resolve-bank-account] Error:', error)
    return new Response(
      JSON.stringify({ success: false, message: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
