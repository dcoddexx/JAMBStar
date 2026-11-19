-- ==============================================================================
-- Migration: Preventive Security, Immutable Audit Logging, Login Activity,
--            Bank Change Payout Cooldown, and API Rate Limiting
-- File: supabase/migrations/20261120_security_audit_and_rate_limits.sql
-- ==============================================================================

-- ==============================================================================
-- 1. IMMUTABLE SYSTEM-WIDE AUDIT LOG TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.system_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL,
    actor_email TEXT NULL,
    actor_role TEXT NULL,
    action TEXT NOT NULL,
    target_table TEXT NOT NULL,
    target_id TEXT NULL,
    target_label TEXT NULL,
    old_data JSONB NULL,
    new_data JSONB NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_system_audit_logs_created_at ON public.system_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_audit_logs_actor_id ON public.system_audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_system_audit_logs_action ON public.system_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_system_audit_logs_target_id ON public.system_audit_logs(target_id);

ALTER TABLE public.system_audit_logs ENABLE ROW LEVEL SECURITY;

-- Admins and Super Admins can query system audit logs.
-- Client INSERT, UPDATE, and DELETE policies are completely omitted to ensure absolute immutability.
DROP POLICY IF EXISTS "Admins can view system audit logs" ON public.system_audit_logs;
CREATE POLICY "Admins can view system audit logs"
    ON public.system_audit_logs
    FOR SELECT
    TO authenticated
    USING (public.is_admin(auth.uid()));


-- ==============================================================================
-- 2. PROFILE SENSITIVE CHANGES AUDIT TRIGGERS & BANK COOLDOWN TIMESTAMP
-- ==============================================================================

-- 2.1 Ensure bank_updated_at exists on profiles
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS bank_updated_at TIMESTAMPTZ NULL;

-- Backfill from bank_details_updated_at if available
UPDATE public.profiles
SET bank_updated_at = bank_details_updated_at
WHERE bank_updated_at IS NULL AND bank_details_updated_at IS NOT NULL;

-- 2.2 BEFORE UPDATE trigger to update bank_updated_at timestamp whenever bank details change
CREATE OR REPLACE FUNCTION public.track_profile_bank_update_time()
RETURNS TRIGGER AS $$
BEGIN
    IF (OLD.bank_name IS DISTINCT FROM NEW.bank_name) OR
       (OLD.bank_code IS DISTINCT FROM NEW.bank_code) OR
       (OLD.account_number IS DISTINCT FROM NEW.account_number) OR
       (OLD.account_name IS DISTINCT FROM NEW.account_name) THEN
        NEW.bank_updated_at := timezone('utc'::text, now());
        NEW.bank_details_updated_at := timezone('utc'::text, now());
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_track_profile_bank_update_time ON public.profiles;
CREATE TRIGGER trg_track_profile_bank_update_time
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.track_profile_bank_update_time();

-- 2.3 AFTER UPDATE trigger on profiles for comprehensive system audit logging
CREATE OR REPLACE FUNCTION public.audit_profiles_sensitive_changes()
RETURNS TRIGGER AS $$
DECLARE
    v_actor_id UUID := auth.uid();
    v_actor_email TEXT := NULL;
    v_actor_role TEXT := 'system';
    v_target_label TEXT;
    v_masked_acc TEXT;
BEGIN
    -- Resolve actor information
    IF v_actor_id IS NOT NULL THEN
        SELECT email INTO v_actor_email FROM auth.users WHERE id = v_actor_id;
        SELECT role INTO v_actor_role FROM public.profiles WHERE id = v_actor_id;
    END IF;

    v_target_label := COALESCE(NEW.full_name, NEW.id::text);

    -- 1. Audit role changes
    IF OLD.role IS DISTINCT FROM NEW.role THEN
        INSERT INTO public.system_audit_logs (
            actor_id, actor_email, actor_role, action, target_table, target_id, target_label,
            old_data, new_data, metadata
        ) VALUES (
            v_actor_id, v_actor_email, v_actor_role, 'ADMIN_ROLE_CHANGED', 'profiles', NEW.id::text, v_target_label,
            jsonb_build_object('role', OLD.role),
            jsonb_build_object('role', NEW.role),
            jsonb_build_object('candidate_email', v_actor_email)
        );
    END IF;

    -- 2. Audit granular admin permissions changes
    IF (OLD.can_manage_pro IS DISTINCT FROM NEW.can_manage_pro) OR
       (OLD.can_manage_monetization_invites IS DISTINCT FROM NEW.can_manage_monetization_invites) OR
       (OLD.can_view_monetization IS DISTINCT FROM NEW.can_view_monetization) OR
       (OLD.can_manage_maintenance IS DISTINCT FROM NEW.can_manage_maintenance) OR
       (OLD.can_manage_users IS DISTINCT FROM NEW.can_manage_users) OR
       (OLD.can_manage_questions IS DISTINCT FROM NEW.can_manage_questions) OR
       (OLD.can_post_notices IS DISTINCT FROM NEW.can_post_notices) THEN
        INSERT INTO public.system_audit_logs (
            actor_id, actor_email, actor_role, action, target_table, target_id, target_label,
            old_data, new_data, metadata
        ) VALUES (
            v_actor_id, v_actor_email, v_actor_role, 'ADMIN_PERMISSIONS_CHANGED', 'profiles', NEW.id::text, v_target_label,
            jsonb_build_object(
                'can_manage_pro', OLD.can_manage_pro,
                'can_manage_monetization_invites', OLD.can_manage_monetization_invites,
                'can_view_monetization', OLD.can_view_monetization,
                'can_manage_maintenance', OLD.can_manage_maintenance,
                'can_manage_users', OLD.can_manage_users,
                'can_manage_questions', OLD.can_manage_questions,
                'can_post_notices', OLD.can_post_notices
            ),
            jsonb_build_object(
                'can_manage_pro', NEW.can_manage_pro,
                'can_manage_monetization_invites', NEW.can_manage_monetization_invites,
                'can_view_monetization', NEW.can_view_monetization,
                'can_manage_maintenance', NEW.can_manage_maintenance,
                'can_manage_users', NEW.can_manage_users,
                'can_manage_questions', NEW.can_manage_questions,
                'can_post_notices', NEW.can_post_notices
            ),
            '{}'::jsonb
        );
    END IF;

    -- 3. Audit Pro Tier and Access Changes
    IF (OLD.tier IS DISTINCT FROM NEW.tier) OR (OLD.is_pro IS DISTINCT FROM NEW.is_pro) THEN
        INSERT INTO public.system_audit_logs (
            actor_id, actor_email, actor_role, action, target_table, target_id, target_label,
            old_data, new_data, metadata
        ) VALUES (
            v_actor_id, v_actor_email, v_actor_role, 'PRO_TIER_CHANGED', 'profiles', NEW.id::text, v_target_label,
            jsonb_build_object('tier', OLD.tier, 'is_pro', OLD.is_pro),
            jsonb_build_object('tier', NEW.tier, 'is_pro', NEW.is_pro),
            '{}'::jsonb
        );
    END IF;

    -- 4. Audit Payout Bank Details Changes (Masked account number in target_label)
    IF (OLD.bank_name IS DISTINCT FROM NEW.bank_name) OR
       (OLD.bank_code IS DISTINCT FROM NEW.bank_code) OR
       (OLD.account_number IS DISTINCT FROM NEW.account_number) OR
       (OLD.account_name IS DISTINCT FROM NEW.account_name) THEN
        v_masked_acc := CASE
            WHEN NEW.account_number IS NOT NULL AND LENGTH(NEW.account_number) >= 4
            THEN '****' || RIGHT(NEW.account_number, 4)
            ELSE 'none'
        END;

        INSERT INTO public.system_audit_logs (
            actor_id, actor_email, actor_role, action, target_table, target_id, target_label,
            old_data, new_data, metadata
        ) VALUES (
            v_actor_id, v_actor_email, v_actor_role, 'BANK_DETAILS_UPDATED', 'profiles', NEW.id::text,
            v_target_label || ' (' || COALESCE(NEW.bank_name, 'No Bank') || ' ' || v_masked_acc || ')',
            jsonb_build_object(
                'bank_name', OLD.bank_name,
                'bank_code', OLD.bank_code,
                'account_number', OLD.account_number,
                'account_name', OLD.account_name
            ),
            jsonb_build_object(
                'bank_name', NEW.bank_name,
                'bank_code', NEW.bank_code,
                'account_number', NEW.account_number,
                'account_name', NEW.account_name
            ),
            jsonb_build_object('masked_account', v_masked_acc)
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_audit_profiles_sensitive_changes ON public.profiles;
CREATE TRIGGER trg_audit_profiles_sensitive_changes
    AFTER UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.audit_profiles_sensitive_changes();


-- ==============================================================================
-- 3. AUDIT TRIGGERS FOR SYSTEM SETTINGS & QUESTIONS
-- ==============================================================================

-- 3.1 Audit System Settings Changes
CREATE OR REPLACE FUNCTION public.audit_system_settings_changes()
RETURNS TRIGGER AS $$
DECLARE
    v_actor_id UUID := auth.uid();
    v_actor_email TEXT := NULL;
    v_actor_role TEXT := 'system';
BEGIN
    IF v_actor_id IS NOT NULL THEN
        SELECT email INTO v_actor_email FROM auth.users WHERE id = v_actor_id;
        SELECT role INTO v_actor_role FROM public.profiles WHERE id = v_actor_id;
    END IF;

    INSERT INTO public.system_audit_logs (
        actor_id, actor_email, actor_role, action, target_table, target_id, target_label,
        old_data, new_data, metadata
    ) VALUES (
        v_actor_id, v_actor_email, v_actor_role, 'SYSTEM_SETTING_UPDATED', 'system_settings',
        COALESCE(NEW.id::text, OLD.id::text),
        'System Maintenance & General Settings',
        CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE to_jsonb(OLD) END,
        CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE to_jsonb(NEW) END,
        jsonb_build_object('operation', TG_OP)
    );

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_audit_system_settings_changes ON public.system_settings;
CREATE TRIGGER trg_audit_system_settings_changes
    AFTER INSERT OR UPDATE OR DELETE ON public.system_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.audit_system_settings_changes();


-- 3.2 Audit Question Bank Changes
CREATE OR REPLACE FUNCTION public.audit_questions_changes()
RETURNS TRIGGER AS $$
DECLARE
    v_actor_id UUID := auth.uid();
    v_actor_email TEXT := NULL;
    v_actor_role TEXT := 'system';
    v_action TEXT;
    v_summary TEXT;
BEGIN
    IF v_actor_id IS NOT NULL THEN
        SELECT email INTO v_actor_email FROM auth.users WHERE id = v_actor_id;
        SELECT role INTO v_actor_role FROM public.profiles WHERE id = v_actor_id;
    END IF;

    IF TG_OP = 'INSERT' THEN
        v_action := 'QUESTION_CREATED';
        v_summary := COALESCE(NEW.year::text, '') || ' Q: ' || SUBSTRING(COALESCE(NEW.question, '') FROM 1 FOR 50);
    ELSIF TG_OP = 'UPDATE' THEN
        v_action := 'QUESTION_UPDATED';
        v_summary := COALESCE(NEW.year::text, '') || ' Q: ' || SUBSTRING(COALESCE(NEW.question, '') FROM 1 FOR 50);
    ELSE
        v_action := 'QUESTION_DELETED';
        v_summary := COALESCE(OLD.year::text, '') || ' Q: ' || SUBSTRING(COALESCE(OLD.question, '') FROM 1 FOR 50);
    END IF;

    INSERT INTO public.system_audit_logs (
        actor_id, actor_email, actor_role, action, target_table, target_id, target_label,
        old_data, new_data, metadata
    ) VALUES (
        v_actor_id, v_actor_email, v_actor_role, v_action, 'questions',
        COALESCE(NEW.id::text, OLD.id::text),
        v_summary,
        CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE to_jsonb(OLD) END,
        CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE to_jsonb(NEW) END,
        jsonb_build_object('operation', TG_OP)
    );

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_audit_questions_changes ON public.questions;
CREATE TRIGGER trg_audit_questions_changes
    AFTER INSERT OR UPDATE OR DELETE ON public.questions
    FOR EACH ROW
    EXECUTE FUNCTION public.audit_questions_changes();


-- ==============================================================================
-- 4. 48-HOUR BANK CHANGE WITHDRAWAL COOLDOWN ENFORCEMENT
-- ==============================================================================
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

    -- 48-Hour Bank Beneficiary Change Cooldown (Anti-Account-Takeover Protection)
    IF v_prof.bank_updated_at IS NOT NULL AND v_prof.bank_updated_at > timezone('utc'::text, now()) - interval '48 hours' THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'For your security, withdrawals are paused for 48 hours after updating your bank account details.'
        );
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


-- ==============================================================================
-- 5. AUTHENTICATION & LOGIN ACTIVITY LOGS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.auth_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL,
    email_attempted TEXT NULL,
    event_type TEXT NOT NULL CHECK (event_type IN ('LOGIN_SUCCESS', 'LOGIN_FAILED', 'PASSWORD_RESET_REQUESTED', 'MFA_ENROLLED', 'MFA_VERIFIED', 'MFA_UNENROLLED', 'MFA_CHALLENGE_FAILED')),
    user_agent TEXT NULL,
    device_summary TEXT NULL,
    is_suspicious BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_auth_audit_logs_created_at ON public.auth_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_auth_audit_logs_user_id ON public.auth_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_audit_logs_email ON public.auth_audit_logs(email_attempted);
CREATE INDEX IF NOT EXISTS idx_auth_audit_logs_suspicious ON public.auth_audit_logs(is_suspicious) WHERE is_suspicious = true;

ALTER TABLE public.auth_audit_logs ENABLE ROW LEVEL SECURITY;

-- Users can view their own login activity; Admins can view all records.
DROP POLICY IF EXISTS "Users can view own auth audit logs" ON public.auth_audit_logs;
CREATE POLICY "Users can view own auth audit logs"
    ON public.auth_audit_logs
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- RPC to record authentication activity safely from client/Edge Functions
CREATE OR REPLACE FUNCTION public.log_auth_event(
    p_event_type TEXT,
    p_email TEXT DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_device TEXT := 'Web Browser';
    v_is_suspicious BOOLEAN := false;
    v_recent_failed_count INT := 0;
    v_clean_email TEXT := LOWER(TRIM(COALESCE(p_email, '')));
BEGIN
    -- Resolve user_id if not authenticated in context but email matches an existing registered user
    IF v_user_id IS NULL AND v_clean_email <> '' THEN
        SELECT id INTO v_user_id FROM auth.users WHERE LOWER(email) = v_clean_email LIMIT 1;
    END IF;

    -- Human-friendly device summary parsing from user agent
    IF p_user_agent IS NOT NULL THEN
        IF p_user_agent ILIKE '%iPhone%' OR p_user_agent ILIKE '%iPad%' THEN
            v_device := 'iOS Device';
        ELSIF p_user_agent ILIKE '%Android%' THEN
            v_device := 'Android Mobile';
        ELSIF p_user_agent ILIKE '%Windows%' THEN
            v_device := 'Windows PC';
        ELSIF p_user_agent ILIKE '%Macintosh%' OR p_user_agent ILIKE '%Mac OS%' THEN
            v_device := 'Mac Desktop';
        ELSIF p_user_agent ILIKE '%Linux%' THEN
            v_device := 'Linux Workstation';
        END IF;

        IF p_user_agent ILIKE '%Chrome%' AND p_user_agent NOT ILIKE '%Edg%' THEN
            v_device := v_device || ' • Chrome';
        ELSIF p_user_agent ILIKE '%Firefox%' THEN
            v_device := v_device || ' • Firefox';
        ELSIF p_user_agent ILIKE '%Safari%' AND p_user_agent NOT ILIKE '%Chrome%' THEN
            v_device := v_device || ' • Safari';
        ELSIF p_user_agent ILIKE '%Edg%' THEN
            v_device := v_device || ' • Edge';
        END IF;
    END IF;

    -- Anomaly detection: Flag as suspicious if >= 5 failed attempts occurred in past 15 minutes
    IF p_event_type = 'LOGIN_FAILED' AND v_clean_email <> '' THEN
        SELECT COUNT(*) INTO v_recent_failed_count
        FROM public.auth_audit_logs
        WHERE LOWER(email_attempted) = v_clean_email
          AND event_type = 'LOGIN_FAILED'
          AND created_at >= (timezone('utc'::text, now()) - interval '15 minutes');

        IF v_recent_failed_count >= 4 THEN -- This attempt is the 5th+
            v_is_suspicious := true;
        END IF;
    END IF;

    INSERT INTO public.auth_audit_logs (
        user_id, email_attempted, event_type, user_agent, device_summary, is_suspicious
    ) VALUES (
        v_user_id,
        NULLIF(v_clean_email, ''),
        p_event_type,
        SUBSTRING(p_user_agent FROM 1 FOR 500),
        v_device,
        v_is_suspicious
    );

    RETURN jsonb_build_object('success', true, 'is_suspicious', v_is_suspicious);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.log_auth_event(TEXT, TEXT, TEXT) TO anon, authenticated, service_role;


-- ==============================================================================
-- 6. ATOMIC DATABASE RATE LIMITER & REFERRAL CODE LOOKUP PROTECTION
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.api_rate_limits (
    bucket_key TEXT PRIMARY KEY,
    window_start TIMESTAMPTZ NOT NULL,
    request_count INT NOT NULL DEFAULT 1
);

ALTER TABLE public.api_rate_limits ENABLE ROW LEVEL SECURITY;
-- No client policies: completely encapsulated within check_rate_limit SECURITY DEFINER function

CREATE OR REPLACE FUNCTION public.check_rate_limit(
    p_bucket_key TEXT,
    p_max_requests INT,
    p_window_seconds INT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_now TIMESTAMPTZ := timezone('utc'::text, now());
    v_count INT;
BEGIN
    IF p_bucket_key IS NULL OR p_bucket_key = '' OR p_max_requests <= 0 OR p_window_seconds <= 0 THEN
        RETURN true;
    END IF;

    INSERT INTO public.api_rate_limits (bucket_key, window_start, request_count)
    VALUES (p_bucket_key, v_now, 1)
    ON CONFLICT (bucket_key) DO UPDATE
    SET
        request_count = CASE
            WHEN public.api_rate_limits.window_start + (p_window_seconds || ' seconds')::interval < EXCLUDED.window_start
            THEN 1
            ELSE public.api_rate_limits.request_count + 1
        END,
        window_start = CASE
            WHEN public.api_rate_limits.window_start + (p_window_seconds || ' seconds')::interval < EXCLUDED.window_start
            THEN EXCLUDED.window_start
            ELSE public.api_rate_limits.window_start
        END
    RETURNING request_count INTO v_count;

    IF v_count > p_max_requests THEN
        RETURN false;
    END IF;

    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.check_rate_limit(TEXT, INT, INT) TO anon, authenticated, service_role;

-- Enforce rate limiting inside validate_referral_code (max 20 lookups per minute per caller)
CREATE OR REPLACE FUNCTION public.validate_referral_code(p_code TEXT)
RETURNS JSONB AS $$
DECLARE
    v_caller_id TEXT := COALESCE(auth.uid()::text, 'anon');
    v_rate_allowed BOOLEAN;
    v_referrer RECORD;
    v_first_name TEXT;
BEGIN
    -- Rate limit: 20 checks per minute per caller
    v_rate_allowed := public.check_rate_limit('validate_ref:' || v_caller_id, 20, 60);
    IF NOT v_rate_allowed THEN
        RETURN jsonb_build_object(
            'valid', false,
            'referrer_name', null,
            'error', 'Too many referral code lookups. Please wait a moment.'
        );
    END IF;

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

    v_first_name := split_part(TRIM(COALESCE(v_referrer.full_name, 'Candidate')), ' ', 1);
    RETURN jsonb_build_object(
        'valid', true,
        'referrer_name', v_first_name
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.validate_referral_code(TEXT) TO anon, authenticated, service_role;
