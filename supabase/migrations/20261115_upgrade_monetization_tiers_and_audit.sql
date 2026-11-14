-- ==============================================================================
-- Migration: Upgrade Monetization Tiers, Audit Ledger, RLS Lockdown & Atomic RPCs
-- File: supabase/migrations/20261115_upgrade_monetization_tiers_and_audit.sql
-- ==============================================================================

-- 1. Schema Upgrades on public.profiles
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS referred_by UUID NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS current_reward_rate NUMERIC(12, 2) NOT NULL DEFAULT 250.00 CHECK (current_reward_rate IN (250.00, 300.00, 400.00)),
    ADD COLUMN IF NOT EXISTS pending_tier_offer NUMERIC(12, 2) NULL CHECK (pending_tier_offer IN (300.00, 400.00));

CREATE INDEX IF NOT EXISTS idx_profiles_referred_by ON public.profiles(referred_by);

-- 2. Schema Upgrades on public.referrals
ALTER TABLE public.referrals
    ALTER COLUMN reward_amount SET DEFAULT 250.00;

ALTER TABLE public.referrals
    ADD COLUMN IF NOT EXISTS payment_reference TEXT UNIQUE NULL;

-- 3. Schema Upgrades on public.payouts (Reduce minimum threshold to ₦500.00)
ALTER TABLE public.payouts
    DROP CONSTRAINT IF EXISTS payouts_amount_check;

ALTER TABLE public.payouts
    ADD CONSTRAINT payouts_amount_check CHECK (amount >= 500.00);

-- ==============================================================================
-- 4. NEW TABLES: Payments, Wallet Transactions, and Monetization Audit Logs
-- ==============================================================================

-- 4.1 public.payments (Verified Pro Subscription Payments)
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reference TEXT NOT NULL UNIQUE,
    amount NUMERIC(12, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'NGN',
    plan TEXT NOT NULL DEFAULT 'pro',
    status TEXT NOT NULL DEFAULT 'verified',
    gateway_response JSONB NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_reference ON public.payments(reference);

-- 4.2 public.wallet_transactions (Immutable Financial Audit Ledger)
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('commission_credit', 'withdrawal_debit', 'withdrawal_refund')),
    amount NUMERIC(12, 2) NOT NULL,
    balance_before NUMERIC(12, 2) NOT NULL,
    balance_after NUMERIC(12, 2) NOT NULL,
    reference TEXT NULL,
    description TEXT NOT NULL,
    metadata JSONB NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_wallet_tx_user_id ON public.wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_created_at ON public.wallet_transactions(created_at DESC);

-- 4.3 public.monetization_audit_logs (System & Admin Event Log)
CREATE TABLE IF NOT EXISTS public.monetization_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL,
    target_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_monetization_audit_target ON public.monetization_audit_logs(target_user_id);
CREATE INDEX IF NOT EXISTS idx_monetization_audit_created ON public.monetization_audit_logs(created_at DESC);

-- ==============================================================================
-- 5. RLS HARDENING: Lock Down Wallets, Referrals, and Profile Columns
-- ==============================================================================

-- Enable RLS on new tables
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monetization_audit_logs ENABLE ROW LEVEL SECURITY;

-- Payments RLS: Users can view own payments, Admins can view all, NO client INSERT/UPDATE
DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;
CREATE POLICY "Users can view own payments"
    ON public.payments
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- Wallet Transactions RLS: Users view own ledger, Admins view all, NO client mutation
DROP POLICY IF EXISTS "Users can view own wallet transactions" ON public.wallet_transactions;
CREATE POLICY "Users can view own wallet transactions"
    ON public.wallet_transactions
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- Monetization Audit Logs RLS: Users view own logs, Admins view all, NO client mutation
DROP POLICY IF EXISTS "Users can view own monetization audit logs" ON public.monetization_audit_logs;
CREATE POLICY "Users can view own monetization audit logs"
    ON public.monetization_audit_logs
    FOR SELECT
    TO authenticated
    USING (target_user_id = auth.uid() OR public.is_admin(auth.uid()));

-- Wallets RLS Lockdown: Drop dangerous user UPDATE policy
DROP POLICY IF EXISTS "Users and admins can update wallets" ON public.wallets;
DROP POLICY IF EXISTS "Admins can update wallets" ON public.wallets;
CREATE POLICY "Admins can update wallets"
    ON public.wallets
    FOR UPDATE
    TO authenticated
    USING (public.is_admin(auth.uid()))
    WITH CHECK (public.is_admin(auth.uid()));

-- Referrals RLS Lockdown: Drop dangerous user INSERT policy
DROP POLICY IF EXISTS "System and users can insert referrals" ON public.referrals;
DROP POLICY IF EXISTS "Users can view own referrals as referrer" ON public.referrals;
DROP POLICY IF EXISTS "Users can view own referrals" ON public.referrals;
CREATE POLICY "Users can view own referrals"
    ON public.referrals
    FOR SELECT
    TO authenticated
    USING (auth.uid() = referrer_id OR auth.uid() = referred_id OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage referrals" ON public.referrals;
CREATE POLICY "Admins can manage referrals"
    ON public.referrals
    FOR ALL
    TO authenticated
    USING (public.is_admin(auth.uid()))
    WITH CHECK (public.is_admin(auth.uid()));

-- 5.1 Trigger to Protect Profile Sensitive Columns from Direct Client Modification
CREATE OR REPLACE FUNCTION public.protect_profile_sensitive_columns()
RETURNS TRIGGER AS $$
BEGIN
    -- Allow trusted SECURITY DEFINER functions or server bypass
    IF current_setting('app.bypass_profile_protection', true) = 'on' THEN
        RETURN NEW;
    END IF;

    -- Block non-admin clients from modifying sensitive columns
    IF auth.uid() IS NOT NULL AND NOT public.is_admin(auth.uid()) THEN
        IF (NEW.tier IS DISTINCT FROM OLD.tier) OR
           (NEW.is_pro IS DISTINCT FROM OLD.is_pro) OR
           (NEW.role IS DISTINCT FROM OLD.role) OR
           (NEW.can_manage_pro IS DISTINCT FROM OLD.can_manage_pro) OR
           (NEW.can_manage_monetization_invites IS DISTINCT FROM OLD.can_manage_monetization_invites) OR
           (NEW.can_view_monetization IS DISTINCT FROM OLD.can_view_monetization) OR
           (NEW.can_manage_maintenance IS DISTINCT FROM OLD.can_manage_maintenance) OR
           (NEW.current_reward_rate IS DISTINCT FROM OLD.current_reward_rate) OR
           (NEW.pending_tier_offer IS DISTINCT FROM OLD.pending_tier_offer) OR
           (NEW.referred_by IS DISTINCT FROM OLD.referred_by) THEN
            RAISE EXCEPTION 'Unauthorized: Modification of protected profile columns is forbidden.';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_protect_profile_sensitive_columns ON public.profiles;
CREATE TRIGGER trg_protect_profile_sensitive_columns
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.protect_profile_sensitive_columns();

-- ==============================================================================
-- 6. DATABASE FUNCTIONS, TRIGGERS & ATOMIC SECURITY DEFINER RPCS
-- ==============================================================================

-- 6.1 Validate Referral Code (Exposes only first name of active affiliates)
CREATE OR REPLACE FUNCTION public.validate_referral_code(p_code TEXT)
RETURNS JSONB AS $$
DECLARE
    v_referrer RECORD;
    v_first_name TEXT;
BEGIN
    IF p_code IS NULL OR TRIM(p_code) = '' THEN
        RETURN jsonb_build_object('valid', false, 'referrer_name', null);
    END IF;

    SELECT full_name, monetization_status
    INTO v_referrer
    FROM public.profiles
    WHERE UPPER(referral_code) = UPPER(TRIM(p_code))
      AND monetization_status = 'active'
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('valid', false, 'referrer_name', null);
    END IF;

    v_first_name := split_part(COALESCE(TRIM(v_referrer.full_name), 'Candidate'), ' ', 1);
    IF v_first_name = '' THEN
        v_first_name := 'Candidate';
    END IF;

    RETURN jsonb_build_object('valid', true, 'referrer_name', v_first_name);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.validate_referral_code(TEXT) TO anon, authenticated, service_role;

-- 6.2 Update handle_new_user() Trigger on auth.users Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_raw_ref TEXT;
    v_referrer_id UUID := NULL;
BEGIN
    -- Bypass column protection during initial profile creation
    PERFORM set_config('app.bypass_profile_protection', 'on', true);

    v_raw_ref := TRIM(COALESCE(NEW.raw_user_meta_data->>'referral_code', ''));

    IF v_raw_ref <> '' THEN
        SELECT id INTO v_referrer_id
        FROM public.profiles
        WHERE UPPER(referral_code) = UPPER(v_raw_ref)
          AND monetization_status = 'active'
          AND id <> NEW.id
        LIMIT 1;
    END IF;

    INSERT INTO public.profiles (
        id, full_name, avatar_url, track, gender, tier, is_pro, role, referred_by
    ) VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'Student Candidate'),
        NEW.raw_user_meta_data->>'avatar_url',
        COALESCE(NEW.raw_user_meta_data->>'track', 'Science'),
        COALESCE(NEW.raw_user_meta_data->>'gender', 'male'),
        COALESCE(NEW.raw_user_meta_data->>'tier', 'free'),
        false,
        COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
        v_referrer_id
    );

    IF v_referrer_id IS NOT NULL THEN
        -- Record pending referral with reward_amount = 0.00 until Pro upgrade occurs
        INSERT INTO public.referrals (
            referrer_id, referred_id, reward_amount, status
        ) VALUES (
            v_referrer_id, NEW.id, 0.00, 'pending'
        ) ON CONFLICT (referred_id) DO NOTHING;

        -- Log audit event
        INSERT INTO public.monetization_audit_logs (
            actor_id, target_user_id, event_type, details
        ) VALUES (
            NEW.id,
            v_referrer_id,
            'REFERRAL_REGISTERED',
            jsonb_build_object(
                'referred_user_id', NEW.id,
                'referral_code', v_raw_ref
            )
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 6.3 Get Affiliates Referral List with Candidate Names and Pro Conversion Status
CREATE OR REPLACE FUNCTION public.get_my_referrals()
RETURNS TABLE (
    id UUID,
    referred_id UUID,
    candidate_name TEXT,
    reward_amount NUMERIC,
    status TEXT,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.id,
        r.referred_id,
        COALESCE(p.full_name, 'Candidate') AS candidate_name,
        r.reward_amount,
        r.status,
        r.created_at
    FROM public.referrals r
    JOIN public.profiles p ON p.id = r.referred_id
    WHERE r.referrer_id = auth.uid()
    ORDER BY r.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.get_my_referrals() TO authenticated, service_role;

-- 6.4 Atomic Processing of Verified Pro Subscription Payments & Commissions
CREATE OR REPLACE FUNCTION public.process_verified_pro_upgrade(
    p_user_id UUID,
    p_reference TEXT,
    p_amount NUMERIC,
    p_gateway_response JSONB DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_existing_payment RECORD;
    v_referrer_id UUID;
    v_referrer_prof RECORD;
    v_referrer_wallet RECORD;
    v_rate NUMERIC(12, 2);
    v_completed_count INT;
    v_new_pending_offer NUMERIC(12, 2);
    v_wallet_bal_before NUMERIC(12, 2);
    v_wallet_bal_after NUMERIC(12, 2);
BEGIN
    PERFORM set_config('app.bypass_profile_protection', 'on', true);

    -- 1. Idempotency Check: already verified and processed
    SELECT * INTO v_existing_payment FROM public.payments WHERE reference = p_reference;
    IF FOUND THEN
        RETURN jsonb_build_object('success', true, 'already_processed', true);
    END IF;

    -- 2. Insert verified payment transaction
    INSERT INTO public.payments (
        user_id, reference, amount, currency, plan, status, gateway_response
    ) VALUES (
        p_user_id, p_reference, COALESCE(p_amount, 1000.00), 'NGN', 'pro', 'verified', p_gateway_response
    );

    -- 3. Upgrade candidate profile to Pro & issue monetization invite
    UPDATE public.profiles
    SET tier = 'pro',
        is_pro = true,
        monetization_status = CASE 
            WHEN monetization_status IN ('none', NULL) THEN 'invited' 
            ELSE monetization_status 
        END,
        monetization_invited_at = CASE 
            WHEN monetization_status IN ('none', NULL) AND monetization_invited_at IS NULL THEN timezone('utc'::text, now()) 
            ELSE monetization_invited_at 
        END,
        updated_at = timezone('utc'::text, now())
    WHERE id = p_user_id
    RETURNING referred_by INTO v_referrer_id;

    -- 4. Check if candidate was referred by an active affiliate
    IF v_referrer_id IS NOT NULL THEN
        -- Check if candidate has not already generated a completed commission
        IF NOT EXISTS (
            SELECT 1 FROM public.referrals 
            WHERE referred_id = p_user_id AND status = 'completed'
        ) THEN
            -- Lock referrer profile & determine their reward tier
            SELECT * INTO v_referrer_prof 
            FROM public.profiles 
            WHERE id = v_referrer_id 
            FOR UPDATE;

            v_rate := COALESCE(v_referrer_prof.current_reward_rate, 250.00);

            -- Ensure referrer has a wallet initialized
            INSERT INTO public.wallets (user_id, balance, total_earned, total_withdrawn)
            VALUES (v_referrer_id, 0.00, 0.00, 0.00)
            ON CONFLICT (user_id) DO NOTHING;

            SELECT * INTO v_referrer_wallet 
            FROM public.wallets 
            WHERE user_id = v_referrer_id 
            FOR UPDATE;

            v_wallet_bal_before := v_referrer_wallet.balance;
            v_wallet_bal_after := v_wallet_bal_before + v_rate;

            -- Atomically credit referrer wallet
            UPDATE public.wallets
            SET balance = v_wallet_bal_after,
                total_earned = total_earned + v_rate,
                updated_at = timezone('utc'::text, now())
            WHERE user_id = v_referrer_id;

            -- Upsert referrals row to completed with payment reference
            INSERT INTO public.referrals (
                referrer_id, referred_id, reward_amount, status, payment_reference, created_at
            ) VALUES (
                v_referrer_id, p_user_id, v_rate, 'completed', p_reference, timezone('utc'::text, now())
            )
            ON CONFLICT (referred_id) DO UPDATE
            SET reward_amount = v_rate,
                status = 'completed',
                payment_reference = p_reference,
                created_at = timezone('utc'::text, now());

            -- Append immutable wallet ledger transaction
            INSERT INTO public.wallet_transactions (
                user_id, type, amount, balance_before, balance_after, reference, description, metadata
            ) VALUES (
                v_referrer_id,
                'commission_credit',
                v_rate,
                v_wallet_bal_before,
                v_wallet_bal_after,
                p_reference,
                'Commission credit for candidate Pro upgrade',
                jsonb_build_object('referred_user_id', p_user_id, 'rate', v_rate)
            );

            -- Append monetization audit log
            INSERT INTO public.monetization_audit_logs (
                actor_id, target_user_id, event_type, details
            ) VALUES (
                p_user_id,
                v_referrer_id,
                'COMMISSION_CREDITED',
                jsonb_build_object(
                    'referred_user_id', p_user_id,
                    'amount', v_rate,
                    'payment_reference', p_reference
                )
            );

            -- Count total completed referrals to check milestone tier unlock
            SELECT COUNT(*) INTO v_completed_count 
            FROM public.referrals 
            WHERE referrer_id = v_referrer_id AND status = 'completed';

            v_new_pending_offer := NULL;
            IF v_completed_count >= 10 AND v_rate < 400.00 AND (v_referrer_prof.pending_tier_offer IS DISTINCT FROM 400.00) THEN
                v_new_pending_offer := 400.00;
            ELSIF v_completed_count >= 5 AND v_rate < 300.00 AND (v_referrer_prof.pending_tier_offer IS DISTINCT FROM 300.00) THEN
                v_new_pending_offer := 300.00;
            END IF;

            IF v_new_pending_offer IS NOT NULL THEN
                UPDATE public.profiles
                SET pending_tier_offer = v_new_pending_offer,
                    updated_at = timezone('utc'::text, now())
                WHERE id = v_referrer_id;

                INSERT INTO public.monetization_audit_logs (
                    actor_id, target_user_id, event_type, details
                ) VALUES (
                    p_user_id,
                    v_referrer_id,
                    'TIER_OFFER_UNLOCKED',
                    jsonb_build_object('offer', v_new_pending_offer, 'completed_referrals', v_completed_count)
                );
            END IF;
        END IF;
    END IF;

    RETURN jsonb_build_object('success', true, 'already_processed', false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.process_verified_pro_upgrade(UUID, TEXT, NUMERIC, JSONB) TO authenticated, service_role;

-- 6.5 Accept Monetization Milestone Tier Offer
CREATE OR REPLACE FUNCTION public.accept_monetization_tier_offer()
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_offer NUMERIC(12, 2);
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    PERFORM set_config('app.bypass_profile_protection', 'on', true);

    SELECT pending_tier_offer INTO v_offer
    FROM public.profiles
    WHERE id = v_user_id;

    IF v_offer IS NULL OR v_offer NOT IN (300.00, 400.00) THEN
        RETURN jsonb_build_object('success', false, 'message', 'No active tier offer found.');
    END IF;

    UPDATE public.profiles
    SET current_reward_rate = v_offer,
        pending_tier_offer = NULL,
        updated_at = timezone('utc'::text, now())
    WHERE id = v_user_id;

    INSERT INTO public.monetization_audit_logs (
        actor_id, target_user_id, event_type, details
    ) VALUES (
        v_user_id,
        v_user_id,
        'TIER_OFFER_ACCEPTED',
        jsonb_build_object('new_rate', v_offer)
    );

    RETURN jsonb_build_object('success', true, 'new_rate', v_offer);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.accept_monetization_tier_offer() TO authenticated, service_role;

-- 6.6 Atomic Request Affiliate Payout
CREATE OR REPLACE FUNCTION public.request_affiliate_payout(p_amount NUMERIC)
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_prof RECORD;
    v_wallet RECORD;
    v_bal_before NUMERIC(12, 2);
    v_bal_after NUMERIC(12, 2);
    v_ref TEXT;
    v_payout_id UUID;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    IF p_amount IS NULL OR p_amount < 500.00 THEN
        RETURN jsonb_build_object('success', false, 'message', 'Minimum withdrawal amount is ₦500.00');
    END IF;

    -- Verify verified Nigerian bank details
    SELECT * INTO v_prof FROM public.profiles WHERE id = v_user_id;
    IF v_prof.bank_name IS NULL OR v_prof.bank_code IS NULL OR 
       v_prof.account_number IS NULL OR v_prof.account_name IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Verified Nigerian bank details are required.');
    END IF;

    -- Lock wallet row
    SELECT * INTO v_wallet FROM public.wallets WHERE user_id = v_user_id FOR UPDATE;
    IF NOT FOUND OR v_wallet.balance < p_amount THEN
        RETURN jsonb_build_object('success', false, 'message', 'Insufficient wallet balance.');
    END IF;

    v_bal_before := v_wallet.balance;
    v_bal_after := v_bal_before - p_amount;
    v_ref := 'PAYOUT_' || SUBSTRING(v_user_id::text, 1, 6) || '_' || (EXTRACT(EPOCH FROM now()) * 1000)::bigint;

    -- Deduct balance
    UPDATE public.wallets
    SET balance = v_bal_after,
        total_withdrawn = total_withdrawn + p_amount,
        updated_at = timezone('utc'::text, now())
    WHERE user_id = v_user_id;

    -- Insert payout record
    INSERT INTO public.payouts (
        user_id, amount, bank_name, bank_code, account_number, account_name, status, reference
    ) VALUES (
        v_user_id, p_amount, v_prof.bank_name, v_prof.bank_code, v_prof.account_number, v_prof.account_name, 'pending', v_ref
    ) RETURNING id INTO v_payout_id;

    -- Insert ledger entry
    INSERT INTO public.wallet_transactions (
        user_id, type, amount, balance_before, balance_after, reference, description, metadata
    ) VALUES (
        v_user_id,
        'withdrawal_debit',
        p_amount,
        v_bal_before,
        v_bal_after,
        v_ref,
        'Affiliate commission withdrawal request',
        jsonb_build_object('payout_id', v_payout_id, 'bank_name', v_prof.bank_name)
    );

    -- Insert audit log
    INSERT INTO public.monetization_audit_logs (
        actor_id, target_user_id, event_type, details
    ) VALUES (
        v_user_id,
        v_user_id,
        'WITHDRAWAL_REQUESTED',
        jsonb_build_object('payout_id', v_payout_id, 'amount', p_amount, 'reference', v_ref)
    );

    RETURN jsonb_build_object('success', true, 'payout_id', v_payout_id, 'new_balance', v_bal_after);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.request_affiliate_payout(NUMERIC) TO authenticated, service_role;

-- 6.7 Admin Process Payout (Approve or Reject & Refund)
CREATE OR REPLACE FUNCTION public.admin_process_payout(
    p_payout_id UUID,
    p_action TEXT,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_admin_id UUID := auth.uid();
    v_payout RECORD;
    v_wallet RECORD;
    v_bal_before NUMERIC(12, 2);
    v_bal_after NUMERIC(12, 2);
    v_now TIMESTAMPTZ := timezone('utc'::text, now());
BEGIN
    IF NOT public.is_admin(v_admin_id) THEN
        RAISE EXCEPTION 'Unauthorized: Only administrators can process payouts';
    END IF;

    IF p_action NOT IN ('approve', 'reject') THEN
        RETURN jsonb_build_object('success', false, 'message', 'Invalid action. Must be approve or reject.');
    END IF;

    SELECT * INTO v_payout FROM public.payouts WHERE id = p_payout_id AND status = 'pending' FOR UPDATE;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Payout record not found or already processed.');
    END IF;

    IF p_action = 'approve' THEN
        UPDATE public.payouts
        SET status = 'completed',
            processed_at = v_now,
            processed_by = v_admin_id,
            notes = p_notes,
            updated_at = v_now
        WHERE id = p_payout_id;

        INSERT INTO public.monetization_audit_logs (
            actor_id, target_user_id, event_type, details
        ) VALUES (
            v_admin_id,
            v_payout.user_id,
            'WITHDRAWAL_APPROVED',
            jsonb_build_object('payout_id', p_payout_id, 'amount', v_payout.amount, 'notes', p_notes)
        );

        RETURN jsonb_build_object('success', true, 'action', 'approved');

    ELSE -- reject & atomically refund
        UPDATE public.payouts
        SET status = 'rejected',
            processed_at = v_now,
            processed_by = v_admin_id,
            notes = COALESCE(p_notes, 'Rejected by admin'),
            updated_at = v_now
        WHERE id = p_payout_id;

        SELECT * INTO v_wallet FROM public.wallets WHERE user_id = v_payout.user_id FOR UPDATE;
        v_bal_before := COALESCE(v_wallet.balance, 0.00);
        v_bal_after := v_bal_before + v_payout.amount;

        UPDATE public.wallets
        SET balance = v_bal_after,
            total_withdrawn = GREATEST(0.00, total_withdrawn - v_payout.amount),
            updated_at = v_now
        WHERE user_id = v_payout.user_id;

        INSERT INTO public.wallet_transactions (
            user_id, type, amount, balance_before, balance_after, reference, description, metadata
        ) VALUES (
            v_payout.user_id,
            'withdrawal_refund',
            v_payout.amount,
            v_bal_before,
            v_bal_after,
            v_payout.reference,
            'Refund for rejected withdrawal: ' || COALESCE(p_notes, 'Rejected by admin'),
            jsonb_build_object('payout_id', p_payout_id, 'reason', p_notes)
        );

        INSERT INTO public.monetization_audit_logs (
            actor_id, target_user_id, event_type, details
        ) VALUES (
            v_admin_id,
            v_payout.user_id,
            'WITHDRAWAL_REJECTED',
            jsonb_build_object('payout_id', p_payout_id, 'amount', v_payout.amount, 'reason', p_notes)
        );

        RETURN jsonb_build_object('success', true, 'action', 'rejected', 'refunded_amount', v_payout.amount);
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.admin_process_payout(UUID, TEXT, TEXT) TO authenticated, service_role;

-- 6.8 Trigger to Log Affiliate Invite Accepted
CREATE OR REPLACE FUNCTION public.log_monetization_invite_accepted()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.monetization_status IS DISTINCT FROM 'active' AND NEW.monetization_status = 'active' THEN
        INSERT INTO public.monetization_audit_logs (
            actor_id, target_user_id, event_type, details
        ) VALUES (
            NEW.id,
            NEW.id,
            'INVITE_ACCEPTED',
            jsonb_build_object('referral_code', NEW.referral_code)
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_monetization_invite_accepted ON public.profiles;
CREATE TRIGGER on_monetization_invite_accepted
    AFTER UPDATE OF monetization_status ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.log_monetization_invite_accepted();
