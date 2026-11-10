-- ==============================================================================
-- Migration: Add Monetization, Payouts, Wallets, Referrals, and Admin Permissions
-- File: supabase/migrations/20261110_add_monetization_schema.sql
-- ==============================================================================

-- 1. Upgrade public.profiles with Monetization, Bank Details, and Permission Columns
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS is_pro BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS monetization_status TEXT NOT NULL DEFAULT 'none' CHECK (monetization_status IN ('none', 'invited', 'active', 'declined')),
    ADD COLUMN IF NOT EXISTS monetization_invited_at TIMESTAMPTZ NULL,
    ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE NULL,
    ADD COLUMN IF NOT EXISTS bank_name TEXT NULL,
    ADD COLUMN IF NOT EXISTS bank_code TEXT NULL,
    ADD COLUMN IF NOT EXISTS account_number TEXT NULL,
    ADD COLUMN IF NOT EXISTS account_name TEXT NULL,
    ADD COLUMN IF NOT EXISTS bank_details_updated_at TIMESTAMPTZ NULL,
    ADD COLUMN IF NOT EXISTS can_manage_monetization_invites BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS can_view_monetization BOOLEAN NOT NULL DEFAULT false;

-- Create Indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_profiles_monetization_status ON public.profiles(monetization_status);
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON public.profiles(referral_code);

-- 2. Backfill Existing Pro Users to is_pro = true & monetization_status = 'invited'
UPDATE public.profiles
SET is_pro = true
WHERE tier = 'pro' OR role = 'super_admin';

UPDATE public.profiles
SET monetization_status = 'invited',
    monetization_invited_at = timezone('utc'::text, now())
WHERE (is_pro = true OR tier = 'pro')
  AND (monetization_status IS NULL OR monetization_status = 'none');

-- 3. Upgrade public.support_tickets Category Constraint
ALTER TABLE public.support_tickets DROP CONSTRAINT IF EXISTS support_tickets_category_check;
ALTER TABLE public.support_tickets ADD CONSTRAINT support_tickets_category_check
CHECK (category IN (
    'Technical',
    'Payment',
    'Exam Inquiry',
    'General',
    'Question Bank Feedback',
    'Candidate Support',
    'Direct Message',
    'Monetization Re-invitation Request',
    'Other'
));

-- 4. Create public.wallets Table
CREATE TABLE IF NOT EXISTS public.wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    balance NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (balance >= 0),
    total_earned NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (total_earned >= 0),
    total_withdrawn NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (total_withdrawn >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON public.wallets(user_id);

-- 5. Create public.referrals Table
CREATE TABLE IF NOT EXISTS public.referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    referred_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    reward_amount NUMERIC(12, 2) NOT NULL DEFAULT 200.00 CHECK (reward_amount >= 0),
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON public.referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_id ON public.referrals(referred_id);

-- 6. Create public.payouts Table
CREATE TABLE IF NOT EXISTS public.payouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 1000.00),
    bank_name TEXT NOT NULL,
    bank_code TEXT NOT NULL,
    account_number TEXT NOT NULL,
    account_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'rejected')),
    reference TEXT UNIQUE,
    processed_at TIMESTAMPTZ,
    processed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_payouts_user_id ON public.payouts(user_id);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON public.payouts(status);
CREATE INDEX IF NOT EXISTS idx_payouts_created_at ON public.payouts(created_at DESC);

-- 7. Enable RLS on Wallets, Referrals, and Payouts
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;

-- Wallets RLS
DROP POLICY IF EXISTS "Users can view own wallet" ON public.wallets;
CREATE POLICY "Users can view own wallet"
    ON public.wallets
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Users can insert own wallet" ON public.wallets;
CREATE POLICY "Users can insert own wallet"
    ON public.wallets
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Users and admins can update wallets" ON public.wallets;
CREATE POLICY "Users and admins can update wallets"
    ON public.wallets
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id OR public.is_admin(auth.uid()))
    WITH CHECK (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- Referrals RLS
DROP POLICY IF EXISTS "Users can view own referrals as referrer" ON public.referrals;
CREATE POLICY "Users can view own referrals as referrer"
    ON public.referrals
    FOR SELECT
    TO authenticated
    USING (auth.uid() = referrer_id OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "System and users can insert referrals" ON public.referrals;
CREATE POLICY "System and users can insert referrals"
    ON public.referrals
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = referred_id OR auth.uid() = referrer_id OR public.is_admin(auth.uid()));

-- Payouts RLS
DROP POLICY IF EXISTS "Users can view own payouts" ON public.payouts;
CREATE POLICY "Users can view own payouts"
    ON public.payouts
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Users can insert own payout requests" ON public.payouts;
CREATE POLICY "Users can insert own payout requests"
    ON public.payouts
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can update payouts" ON public.payouts;
CREATE POLICY "Admins can update payouts"
    ON public.payouts
    FOR UPDATE
    TO authenticated
    USING (public.is_admin(auth.uid()))
    WITH CHECK (public.is_admin(auth.uid()));
