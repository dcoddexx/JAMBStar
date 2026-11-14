// supabase/functions/resolve-bank-account/index.ts
// Secure server-side Paystack NUBAN bank account resolution proxy

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
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

    const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY') || ''
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
