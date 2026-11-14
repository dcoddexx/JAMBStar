// src/services/monetization.ts
// Service handling Nigerian Bank Directory, Paystack Account Resolution via Edge Function,
// Referral Code Generation with Collision Retry, and Bank Details Cooldown Management for JAMBStar

import { supabase } from '../lib/supabase'

export interface NigerianBank {
  name: string
  code: string
}

export const NIGERIAN_BANKS: NigerianBank[] = [
  { name: 'Access Bank', code: '044' },
  { name: 'Access Bank (Diamond)', code: '063' },
  { name: 'Carbon', code: '565' },
  { name: 'Citibank Nigeria', code: '023' },
  { name: 'Dot Microfinance Bank', code: '50130' },
  { name: 'Ecobank Nigeria', code: '050' },
  { name: 'Fairmoney Microfinance Bank', code: '51318' },
  { name: 'Fidelity Bank', code: '070' },
  { name: 'First Bank of Nigeria', code: '011' },
  { name: 'First City Monument Bank (FCMB)', code: '214' },
  { name: 'Guaranty Trust Bank (GTBank)', code: '058' },
  { name: 'Heritage Bank', code: '030' },
  { name: 'Jaiz Bank', code: '301' },
  { name: 'Keystone Bank', code: '082' },
  { name: 'Kuda Bank', code: '50211' },
  { name: 'Moniepoint MFB', code: '50515' },
  { name: 'OPay Digital Services', code: '999992' },
  { name: 'Optimus Bank', code: '107' },
  { name: 'PalmPay', code: '999991' },
  { name: 'Polaris Bank', code: '076' },
  { name: 'Providus Bank', code: '101' },
  { name: 'Rubies MFB', code: '125' },
  { name: 'Stanbic IBTC Bank', code: '221' },
  { name: 'Standard Chartered Bank', code: '068' },
  { name: 'Sterling Bank', code: '232' },
  { name: 'Taj Bank', code: '302' },
  { name: 'Titan Trust Bank', code: '102' },
  { name: 'Union Bank of Nigeria', code: '032' },
  { name: 'United Bank For Africa (UBA)', code: '033' },
  { name: 'Unity Bank', code: '215' },
  { name: 'VFD Microfinance Bank', code: '566' },
  { name: 'Wema Bank', code: '035' },
  { name: 'Zenith Bank', code: '057' }
]

export interface ResolveAccountResponse {
  success: boolean
  account_name?: string
  account_number?: string
  bank_id?: number
  message?: string
}

/**
 * Resolves a 10-digit Nigerian bank account number securely via the resolve-bank-account Edge Function.
 */
export async function resolvePaystackAccount(
  accountNumber: string,
  bankCode: string
): Promise<ResolveAccountResponse> {
  const cleanNumber = accountNumber.trim().replace(/\D/g, '')
  if (cleanNumber.length !== 10) {
    return {
      success: false,
      message: 'Account number must be exactly 10 digits.'
    }
  }

  if (!bankCode) {
    return {
      success: false,
      message: 'Please select a valid bank.'
    }
  }

  try {
    const { data, error } = await supabase.functions.invoke('resolve-bank-account', {
      body: { accountNumber: cleanNumber, bankCode }
    })

    if (!error && data) {
      return data as ResolveAccountResponse
    }

    if (error) {
      console.warn('[resolvePaystackAccount] Edge function warning:', error.message)
    }

    return {
      success: false,
      message: data?.message || error?.message || 'Unable to verify account details. Please double-check the account number and bank.'
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Network error verifying account with Paystack.'
    }
  }
}

/**
 * Generates an affiliate referral code candidate format: JAMB-FIRSTNAME-XXXX
 */
export function generateReferralCode(fullName?: string | null): string {
  let firstName = 'STAR'
  if (fullName && fullName.trim().length > 0) {
    const parts = fullName.trim().split(/\s+/)
    if (parts[0]) {
      const sanitized = parts[0].replace(/[^a-zA-Z]/g, '').toUpperCase()
      if (sanitized.length >= 2) {
        firstName = sanitized.slice(0, 8)
      }
    }
  }

  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let suffix = ''
  for (let i = 0; i < 4; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length))
  }

  return `JAMB-${firstName}-${suffix}`
}

/**
 * Generates a guaranteed unique affiliate referral code with a collision retry loop against Supabase.
 */
export async function generateUniqueReferralCode(fullName?: string | null): Promise<string> {
  const maxAttempts = 5
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const candidateCode = generateReferralCode(fullName)
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('referral_code', candidateCode)
      .maybeSingle()

    if (!error && !data) {
      return candidateCode
    }
  }
  // Fallback with timestamp suffix to guarantee uniqueness if retries fail
  const fallbackSuffix = Date.now().toString(36).slice(-4).toUpperCase()
  return generateReferralCode(fullName).slice(0, -4) + fallbackSuffix
}

export interface BankCooldownStatus {
  canEdit: boolean
  daysRemaining: number
  unlockDate: string | null
}

/**
 * Evaluates whether bank details can be edited based on a 7-day cooldown.
 */
export function checkBankDetailsCooldown(updatedAt?: string | null): BankCooldownStatus {
  if (!updatedAt) {
    return {
      canEdit: true,
      daysRemaining: 0,
      unlockDate: null
    }
  }

  const updatedTime = new Date(updatedAt).getTime()
  if (isNaN(updatedTime)) {
    return {
      canEdit: true,
      daysRemaining: 0,
      unlockDate: null
    }
  }

  const cooldownPeriodMs = 7 * 24 * 60 * 60 * 1000 // 7 days
  const unlockTime = updatedTime + cooldownPeriodMs
  const now = Date.now()

  if (now >= unlockTime) {
    return {
      canEdit: true,
      daysRemaining: 0,
      unlockDate: null
    }
  }

  const remainingMs = unlockTime - now
  const daysRemaining = Math.ceil(remainingMs / (24 * 60 * 60 * 1000))
  const unlockDate = new Date(unlockTime).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })

  return {
    canEdit: false,
    daysRemaining,
    unlockDate
  }
}
