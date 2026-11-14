-- ==============================================================================
-- JAMBStar CBT - PostgreSQL Database Schema for Supabase
-- ==============================================================================

-- 1. Enable Necessary Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. TABLES DEFINITIONS
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- Table: profiles
-- Linked to Supabase auth.users, tracks student profile, track, and admin roles
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    avatar_url TEXT,
    track TEXT NOT NULL CHECK (track IN ('Science', 'Arts', 'Commercial')),
    gender TEXT NOT NULL DEFAULT 'male' CHECK (gender IN ('male', 'female')),
    tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'pro')),
    is_pro BOOLEAN NOT NULL DEFAULT false,
    role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin', 'super_admin')),
    can_post_notices BOOLEAN NOT NULL DEFAULT true,
    can_manage_users BOOLEAN NOT NULL DEFAULT true,
    can_manage_questions BOOLEAN NOT NULL DEFAULT true,
    can_manage_pro BOOLEAN NOT NULL DEFAULT false,
    can_manage_monetization_invites BOOLEAN NOT NULL DEFAULT false,
    can_view_monetization BOOLEAN NOT NULL DEFAULT false,
    can_manage_maintenance BOOLEAN NOT NULL DEFAULT false,
    monetization_status TEXT NOT NULL DEFAULT 'none' CHECK (monetization_status IN ('none', 'invited', 'active', 'declined')),
    monetization_invited_at TIMESTAMPTZ,
    referral_code TEXT UNIQUE,
    referred_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    current_reward_rate NUMERIC(12, 2) NOT NULL DEFAULT 250.00 CHECK (current_reward_rate IN (250.00, 300.00, 400.00)),
    pending_tier_offer NUMERIC(12, 2) CHECK (pending_tier_offer IN (300.00, 400.00)),
    bank_name TEXT,
    bank_code TEXT,
    account_number TEXT,
    account_name TEXT,
    bank_details_updated_at TIMESTAMPTZ,
    last_read_notices TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Ensure gender, tier, admin permissions, and last_read_notices columns exist if upgrading an existing schema
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female'));
UPDATE public.profiles SET gender = 'male' WHERE gender IS NULL;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'free' CHECK (tier IN ('free', 'pro'));
UPDATE public.profiles SET tier = 'free' WHERE tier IS NULL;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_pro BOOLEAN NOT NULL DEFAULT false;
UPDATE public.profiles SET is_pro = true WHERE tier = 'pro';

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS can_post_notices BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS can_manage_users BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS can_manage_questions BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS can_manage_pro BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS can_manage_monetization_invites BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS can_view_monetization BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS can_manage_maintenance BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS monetization_status TEXT NOT NULL DEFAULT 'none' CHECK (monetization_status IN ('none', 'invited', 'active', 'declined'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS monetization_invited_at TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bank_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bank_code TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS account_number TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS account_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bank_details_updated_at TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_read_notices TIMESTAMPTZ;

COMMENT ON TABLE public.profiles IS 'Student and admin profiles linked to auth.users.';
COMMENT ON COLUMN public.profiles.track IS 'Student academic discipline: Science, Arts, or Commercial.';
COMMENT ON COLUMN public.profiles.gender IS 'Candidate gender: male or female.';
COMMENT ON COLUMN public.profiles.tier IS 'Candidate plan tier: free (standard JAMB mock) or pro (custom timer, 1-4 subjects, deep solutions).';
COMMENT ON COLUMN public.profiles.role IS 'User permission role: student, admin, or super_admin.';
COMMENT ON COLUMN public.profiles.can_post_notices IS 'Permission flag: whether admin can post/edit notices.';
COMMENT ON COLUMN public.profiles.can_manage_users IS 'Permission flag: whether admin can manage users.';
COMMENT ON COLUMN public.profiles.can_manage_questions IS 'Permission flag: whether admin can manage question bank.';
COMMENT ON COLUMN public.profiles.last_read_notices IS 'Timestamp when user last viewed announcements feed.';

-- ------------------------------------------------------------------------------
-- Table: subjects
-- Catalog of UTME subjects available for CBT practice
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    code VARCHAR(10) NOT NULL UNIQUE,
    description TEXT,
    icon TEXT,
    is_compulsory BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

COMMENT ON TABLE public.subjects IS 'Catalog of subjects tested in the JAMB UTME examination.';
COMMENT ON COLUMN public.subjects.is_compulsory IS 'True if compulsory for all candidates (e.g. Use of English).';

-- ------------------------------------------------------------------------------
-- Table: topics
-- Syllabus topics belonging to specific UTME subjects
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code VARCHAR(30),
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_subject_topic_name UNIQUE (subject_id, name)
);

COMMENT ON TABLE public.topics IS 'Syllabus topics belonging to specific UTME subjects.';
COMMENT ON COLUMN public.topics.name IS 'Clean topic title (e.g., Organic Chemistry, Mechanics, Oral Forms).';

-- ------------------------------------------------------------------------------
-- Table: subtopics (Optional granular depth)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.subtopics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic_id UUID NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_topic_subtopic_name UNIQUE (topic_id, name)
);

COMMENT ON TABLE public.subtopics IS 'Granular subtopics categorized under a parent syllabus topic.';

-- ------------------------------------------------------------------------------
-- Table: questions
-- Past and practice questions mapped to subjects with A-D options
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    topic_id UUID REFERENCES public.topics(id) ON DELETE SET NULL,
    subtopic_id UUID REFERENCES public.subtopics(id) ON DELETE SET NULL,
    question_text TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT NOT NULL,
    correct_option CHAR(1) NOT NULL CHECK (correct_option IN ('A', 'B', 'C', 'D')),
    explanation TEXT,
    exam_year INTEGER,
    image_url TEXT,
    difficulty_level TEXT CHECK (difficulty_level IN ('easy', 'medium', 'hard')) DEFAULT 'medium',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Ensure image_url, topic_id, and difficulty_level columns exist if upgrading an existing schema
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS topic_id UUID REFERENCES public.topics(id) ON DELETE SET NULL;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS subtopic_id UUID REFERENCES public.subtopics(id) ON DELETE SET NULL;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS difficulty_level TEXT CHECK (difficulty_level IN ('easy', 'medium', 'hard')) DEFAULT 'medium';

COMMENT ON TABLE public.questions IS 'Multiple choice questions with 4 options (A-D) and explanations.';
COMMENT ON COLUMN public.questions.correct_option IS 'Correct answer choice (A, B, C, or D).';
COMMENT ON COLUMN public.questions.image_url IS 'Optional URL or path to a diagram/figure for the question.';
COMMENT ON COLUMN public.questions.topic_id IS 'Foreign key linking the question to its primary syllabus topic.';
COMMENT ON COLUMN public.questions.difficulty_level IS 'Calculated or assigned question difficulty rating.';

-- ------------------------------------------------------------------------------
-- Table: quiz_results
-- Records scores and performance of candidates across subject mock quizzes
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.quiz_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    score INTEGER NOT NULL CHECK (score >= 0),
    total_questions INTEGER NOT NULL CHECK (total_questions > 0),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

COMMENT ON TABLE public.quiz_results IS 'Audit trail of user CBT quiz completions and scores.';

-- ------------------------------------------------------------------------------
-- Table: support_tickets
-- In-app support tickets submitted by candidates or guest visitors
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    guest_name TEXT,
    guest_email TEXT,
    subject TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('Technical', 'Payment', 'Exam Inquiry', 'General', 'Question Bank Feedback', 'Candidate Support', 'Direct Message', 'Monetization Re-invitation Request', 'Other')),
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Foreign key to profiles for PostgREST relational embedding
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_support_tickets_profile'
    ) THEN
        ALTER TABLE public.support_tickets
        ADD CONSTRAINT fk_support_tickets_profile
        FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
END $$;

COMMENT ON TABLE public.support_tickets IS 'In-app support tickets submitted by candidates and platform visitors.';

-- ------------------------------------------------------------------------------
-- Table: ticket_messages
-- Threaded conversation messages and admin replies for support tickets
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ticket_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    sender_name TEXT,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Ensure is_read column exists if upgrading an existing schema
ALTER TABLE public.ticket_messages ADD COLUMN IF NOT EXISTS is_read BOOLEAN NOT NULL DEFAULT false;
UPDATE public.ticket_messages SET is_read = false WHERE is_read IS NULL;

COMMENT ON TABLE public.ticket_messages IS 'Threaded messages and replies on support tickets.';
COMMENT ON COLUMN public.ticket_messages.is_read IS 'True if message has been read by the recipient.';

-- ------------------------------------------------------------------------------
-- Table: notices
-- Global announcements and updates posted by administrators
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

COMMENT ON TABLE public.notices IS 'Global platform notices and announcements posted by administrators.';

-- ------------------------------------------------------------------------------
-- Table: wallets
-- Tracks candidate affiliate earnings and balances from Pro referrals
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    balance NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (balance >= 0),
    total_earned NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (total_earned >= 0),
    total_withdrawn NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (total_withdrawn >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

COMMENT ON TABLE public.wallets IS 'Affiliate wallet balances and earnings ledger.';

-- ------------------------------------------------------------------------------
-- Table: referrals
-- Records successful Pro tier candidate referrals credited to an affiliate
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    referred_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    reward_amount NUMERIC(12, 2) NOT NULL DEFAULT 250.00 CHECK (reward_amount >= 0),
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled')),
    payment_reference TEXT UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

COMMENT ON TABLE public.referrals IS 'Referral transactions rewarding ₦250–₦400 per Pro upgrade.';

-- ------------------------------------------------------------------------------
-- Table: payouts
-- Tracks affiliate withdrawal requests and bank settlement history
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 500.00),
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

COMMENT ON TABLE public.payouts IS 'Affiliate withdrawal requests and settlement records.';

-- ------------------------------------------------------------------------------
-- 2.10 system_settings
-- System-wide runtime flags and scheduled maintenance parameters
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.system_settings (
    id TEXT PRIMARY KEY DEFAULT 'global',
    is_maintenance BOOLEAN NOT NULL DEFAULT false,
    maintenance_message TEXT NOT NULL DEFAULT 'We are currently performing scheduled system updates to improve your JAMBStar CBT practice experience. Please check back shortly.',
    maintenance_auto_on_at TIMESTAMPTZ,
    maintenance_auto_off_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

INSERT INTO public.system_settings (id, is_maintenance, maintenance_message)
VALUES (
    'global',
    false,
    'We are currently performing scheduled system updates to improve your JAMBStar CBT practice experience. Please check back shortly.'
)
ON CONFLICT (id) DO NOTHING;

COMMENT ON TABLE public.system_settings IS 'Global application state including maintenance mode toggles and auto-off timers.';

-- ------------------------------------------------------------------------------
-- 2.11 payments
-- Verified JAMBStar Pro lifetime subscription transactions
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reference TEXT NOT NULL UNIQUE,
    amount NUMERIC(12, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'NGN',
    plan TEXT NOT NULL DEFAULT 'pro',
    status TEXT NOT NULL DEFAULT 'verified',
    gateway_response JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

COMMENT ON TABLE public.payments IS 'Verified Paystack subscription payments for Pro accounts.';

-- ------------------------------------------------------------------------------
-- 2.12 wallet_transactions
-- Immutable financial audit ledger for affiliate commission movements
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('commission_credit', 'withdrawal_debit', 'withdrawal_refund')),
    amount NUMERIC(12, 2) NOT NULL,
    balance_before NUMERIC(12, 2) NOT NULL,
    balance_after NUMERIC(12, 2) NOT NULL,
    reference TEXT,
    description TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

COMMENT ON TABLE public.wallet_transactions IS 'Immutable financial audit ledger for affiliate credits, withdrawals, and refunds.';

-- ------------------------------------------------------------------------------
-- 2.13 monetization_audit_logs
-- System-wide administrative and affiliate event audit log
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.monetization_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    target_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

COMMENT ON TABLE public.monetization_audit_logs IS 'System and administrator activity audit logs for the affiliate and monetization pipeline.';

-- ==============================================================================
-- 3. INDEXES FOR PERFORMANCE
-- ==============================================================================

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_subjects_name ON public.subjects(name);
CREATE INDEX IF NOT EXISTS idx_topics_subject_id ON public.topics(subject_id);
CREATE INDEX IF NOT EXISTS idx_topics_name ON public.topics(name);
CREATE INDEX IF NOT EXISTS idx_questions_subject_id ON public.questions(subject_id);
CREATE INDEX IF NOT EXISTS idx_questions_topic_id ON public.questions(topic_id);
CREATE INDEX IF NOT EXISTS idx_questions_exam_year ON public.questions(exam_year);
CREATE INDEX IF NOT EXISTS idx_questions_subject_topic ON public.questions(subject_id, topic_id);
CREATE INDEX IF NOT EXISTS idx_quiz_results_user_id ON public.quiz_results(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_results_subject_id ON public.quiz_results(subject_id);
CREATE INDEX IF NOT EXISTS idx_quiz_results_timestamp ON public.quiz_results(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON public.support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON public.support_tickets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket_id ON public.ticket_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_created_at ON public.ticket_messages(created_at ASC);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_is_read ON public.ticket_messages(is_read);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_sender_id ON public.ticket_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_notices_created_at ON public.notices(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_referred_by ON public.profiles(referred_by);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_reference ON public.payments(reference);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_user_id ON public.wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_created_at ON public.wallet_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_monetization_audit_target ON public.monetization_audit_logs(target_user_id);
CREATE INDEX IF NOT EXISTS idx_monetization_audit_created ON public.monetization_audit_logs(created_at DESC);

-- ==============================================================================
-- 4. HELPER FUNCTIONS FOR SECURITY & ROLE CHECKING
-- ==============================================================================

-- Security definer function to avoid RLS recursion when reading profiles
DROP FUNCTION IF EXISTS public.is_admin();
DROP FUNCTION IF EXISTS public.is_admin(UUID);

CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = COALESCE(user_id, auth.uid())
          AND role IN ('admin', 'super_admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

COMMENT ON FUNCTION public.is_admin(UUID) IS 'Returns true if the specified user (or auth.uid()) has an admin or super_admin role. Runs as SECURITY DEFINER to bypass RLS recursion on public.profiles.';

-- Helper Function: Get or Create Topic by Subject and Name
CREATE OR REPLACE FUNCTION public.get_or_create_topic(
    p_subject_id UUID,
    p_topic_name TEXT
)
RETURNS UUID AS $$
DECLARE
    v_topic_id UUID;
    v_clean_name TEXT;
BEGIN
    v_clean_name := trim(p_topic_name);
    IF v_clean_name IS NULL OR v_clean_name = '' THEN
        RETURN NULL;
    END IF;

    -- Check if topic already exists for this subject (case-insensitive)
    SELECT id INTO v_topic_id
    FROM public.topics
    WHERE subject_id = p_subject_id
      AND LOWER(name) = LOWER(v_clean_name)
    LIMIT 1;

    -- If not found, insert new topic
    IF v_topic_id IS NULL THEN
        INSERT INTO public.topics (subject_id, name)
        VALUES (p_subject_id, v_clean_name)
        ON CONFLICT (subject_id, name) DO UPDATE
            SET updated_at = timezone('utc'::text, now())
        RETURNING id INTO v_topic_id;
    END IF;

    RETURN v_topic_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_or_create_topic(UUID, TEXT) IS 'Returns existing topic_id or inserts a new topic on-the-fly for a given subject.';

-- ==============================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- RLS: profiles
-- Users can read, insert, and update their own profile data; admins can view all; super_admins can manage all
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
    ON public.profiles
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" 
    ON public.profiles 
    FOR SELECT 
    TO authenticated
    USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
    ON public.profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users and admins can update profiles" ON public.profiles;
CREATE POLICY "Users and admins can update profiles"
    ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id OR public.is_admin(auth.uid()))
    WITH CHECK (auth.uid() = id OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Super admins can delete profiles" ON public.profiles;
CREATE POLICY "Super admins can delete profiles"
    ON public.profiles
    FOR DELETE
    TO authenticated
    USING (public.is_admin(auth.uid()));

-- ------------------------------------------------------------------------------
-- RLS: subjects
-- Public read access; strictly admin & super_admin for INSERT, UPDATE, DELETE
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow public read access to subjects" ON public.subjects;
CREATE POLICY "Allow public read access to subjects"
    ON public.subjects
    FOR SELECT
    TO authenticated, anon
    USING (true);

DROP POLICY IF EXISTS "Allow admins to insert subjects" ON public.subjects;
CREATE POLICY "Allow admins to insert subjects"
    ON public.subjects
    FOR INSERT
    TO authenticated
    WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Allow admins to update subjects" ON public.subjects;
CREATE POLICY "Allow admins to update subjects"
    ON public.subjects
    FOR UPDATE
    TO authenticated
    USING (public.is_admin(auth.uid()))
    WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Allow admins to delete subjects" ON public.subjects;
CREATE POLICY "Allow admins to delete subjects"
    ON public.subjects
    FOR DELETE
    TO authenticated
    USING (public.is_admin(auth.uid()));

-- ------------------------------------------------------------------------------
-- RLS: topics
-- Public read access; strictly admin & super_admin for INSERT, UPDATE, DELETE
-- ------------------------------------------------------------------------------
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to topics" ON public.topics;
CREATE POLICY "Allow public read access to topics"
    ON public.topics
    FOR SELECT
    TO authenticated, anon
    USING (true);

DROP POLICY IF EXISTS "Allow admins to manage topics" ON public.topics;
CREATE POLICY "Allow admins to manage topics"
    ON public.topics
    FOR ALL
    TO authenticated
    USING (public.is_admin(auth.uid()))
    WITH CHECK (public.is_admin(auth.uid()));

-- ------------------------------------------------------------------------------
-- RLS: subtopics
-- ------------------------------------------------------------------------------
ALTER TABLE public.subtopics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to subtopics" ON public.subtopics;
CREATE POLICY "Allow public read access to subtopics"
    ON public.subtopics
    FOR SELECT
    TO authenticated, anon
    USING (true);

DROP POLICY IF EXISTS "Allow admins to manage subtopics" ON public.subtopics;
CREATE POLICY "Allow admins to manage subtopics"
    ON public.subtopics
    FOR ALL
    TO authenticated
    USING (public.is_admin(auth.uid()))
    WITH CHECK (public.is_admin(auth.uid()));

-- ------------------------------------------------------------------------------
-- RLS: questions
-- Public read access; strictly admin & super_admin for INSERT, UPDATE, DELETE
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow read access to all questions" ON public.questions;
DROP POLICY IF EXISTS "Allow read access to questions for authenticated users" ON public.questions;
DROP POLICY IF EXISTS "Allow public read access to questions" ON public.questions;
CREATE POLICY "Allow public read access to questions"
    ON public.questions
    FOR SELECT
    TO authenticated, anon
    USING (true);

DROP POLICY IF EXISTS "Allow admins to insert questions" ON public.questions;
CREATE POLICY "Allow admins to insert questions"
    ON public.questions
    FOR INSERT
    TO authenticated
    WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Allow admins to update questions" ON public.questions;
CREATE POLICY "Allow admins to update questions"
    ON public.questions
    FOR UPDATE
    TO authenticated
    USING (public.is_admin(auth.uid()))
    WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Allow admins to delete questions" ON public.questions;
CREATE POLICY "Allow admins to delete questions"
    ON public.questions
    FOR DELETE
    TO authenticated
    USING (public.is_admin(auth.uid()));

-- ------------------------------------------------------------------------------
-- RLS: quiz_results
-- Students can only view and insert their own results
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own quiz results" ON public.quiz_results;
CREATE POLICY "Users can view own quiz results"
    ON public.quiz_results
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own quiz results" ON public.quiz_results;
CREATE POLICY "Users can insert own quiz results"
    ON public.quiz_results
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- RLS: support_tickets
-- Candidates view/insert/update own tickets; Admins (is_admin()) can manage all
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Candidates and admins can view support tickets" ON public.support_tickets;
CREATE POLICY "Candidates and admins can view support tickets"
    ON public.support_tickets
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Anyone can insert support tickets" ON public.support_tickets;
CREATE POLICY "Anyone can insert support tickets"
    ON public.support_tickets
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (auth.uid() IS NULL OR auth.uid() = user_id OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Candidates and admins can update support tickets" ON public.support_tickets;
CREATE POLICY "Candidates and admins can update support tickets"
    ON public.support_tickets
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id OR public.is_admin(auth.uid()))
    WITH CHECK (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- ------------------------------------------------------------------------------
-- RLS: ticket_messages
-- Candidates view/insert messages on their own tickets; Admins can reply to all
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view messages for own tickets or as admin" ON public.ticket_messages;
CREATE POLICY "Users can view messages for own tickets or as admin"
    ON public.ticket_messages
    FOR SELECT
    TO authenticated
    USING (
        public.is_admin(auth.uid())
        OR EXISTS (
            SELECT 1 FROM public.support_tickets
            WHERE id = ticket_messages.ticket_id
              AND user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users and admins can insert ticket messages" ON public.ticket_messages;
CREATE POLICY "Users and admins can insert ticket messages"
    ON public.ticket_messages
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (
        public.is_admin(auth.uid())
        OR EXISTS (
            SELECT 1 FROM public.support_tickets
            WHERE id = ticket_messages.ticket_id
              AND (user_id = auth.uid() OR user_id IS NULL)
        )
    );

DROP POLICY IF EXISTS "Users and admins can update ticket messages" ON public.ticket_messages;
CREATE POLICY "Users and admins can update ticket messages"
    ON public.ticket_messages
    FOR UPDATE
    TO authenticated
    USING (
        public.is_admin(auth.uid())
        OR EXISTS (
            SELECT 1 FROM public.support_tickets
            WHERE id = ticket_messages.ticket_id
              AND user_id = auth.uid()
        )
    )
    WITH CHECK (
        public.is_admin(auth.uid())
        OR EXISTS (
            SELECT 1 FROM public.support_tickets
            WHERE id = ticket_messages.ticket_id
              AND user_id = auth.uid()
        )
    );

-- ------------------------------------------------------------------------------
-- RLS: notices
-- Authenticated users can view; Admins can insert, update, and delete
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated users can view notices" ON public.notices;
CREATE POLICY "Authenticated users can view notices"
    ON public.notices
    FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Admins can insert notices" ON public.notices;
CREATE POLICY "Admins can insert notices"
    ON public.notices
    FOR INSERT
    TO authenticated
    WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update notices" ON public.notices;
CREATE POLICY "Admins can update notices"
    ON public.notices
    FOR UPDATE
    TO authenticated
    USING (public.is_admin(auth.uid()))
    WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can delete notices" ON public.notices;
CREATE POLICY "Admins can delete notices"
    ON public.notices
    FOR DELETE
    TO authenticated
    USING (public.is_admin(auth.uid()));

-- ------------------------------------------------------------------------------
-- RLS: wallets
-- ------------------------------------------------------------------------------
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

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
DROP POLICY IF EXISTS "Admins can update wallets" ON public.wallets;
CREATE POLICY "Admins can update wallets"
    ON public.wallets
    FOR UPDATE
    TO authenticated
    USING (public.is_admin(auth.uid()))
    WITH CHECK (public.is_admin(auth.uid()));

-- ------------------------------------------------------------------------------
-- RLS: referrals
-- ------------------------------------------------------------------------------
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own referrals as referrer" ON public.referrals;
DROP POLICY IF EXISTS "Users can view own referrals" ON public.referrals;
CREATE POLICY "Users can view own referrals"
    ON public.referrals
    FOR SELECT
    TO authenticated
    USING (auth.uid() = referrer_id OR auth.uid() = referred_id OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "System and users can insert referrals" ON public.referrals;
DROP POLICY IF EXISTS "Admins can manage referrals" ON public.referrals;
CREATE POLICY "Admins can manage referrals"
    ON public.referrals
    FOR ALL
    TO authenticated
    USING (public.is_admin(auth.uid()))
    WITH CHECK (public.is_admin(auth.uid()));

-- ------------------------------------------------------------------------------
-- RLS: payments, wallet_transactions, monetization_audit_logs
-- ------------------------------------------------------------------------------
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monetization_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;
CREATE POLICY "Users can view own payments"
    ON public.payments
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Users can view own wallet transactions" ON public.wallet_transactions;
CREATE POLICY "Users can view own wallet transactions"
    ON public.wallet_transactions
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Users can view own monetization audit logs" ON public.monetization_audit_logs;
CREATE POLICY "Users can view own monetization audit logs"
    ON public.monetization_audit_logs
    FOR SELECT
    TO authenticated
    USING (target_user_id = auth.uid() OR public.is_admin(auth.uid()));

-- ------------------------------------------------------------------------------
-- RLS: payouts
-- ------------------------------------------------------------------------------
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;

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

-- ------------------------------------------------------------------------------
-- RLS: system_settings
-- ------------------------------------------------------------------------------
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view system settings" ON public.system_settings;
CREATE POLICY "Anyone can view system settings"
    ON public.system_settings
    FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Admins can update system settings" ON public.system_settings;
CREATE POLICY "Admins can update system settings"
    ON public.system_settings
    FOR UPDATE
    TO authenticated
    USING (public.is_admin(auth.uid()))
    WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can insert system settings" ON public.system_settings;
CREATE POLICY "Admins can insert system settings"
    ON public.system_settings
    FOR INSERT
    TO authenticated
    WITH CHECK (public.is_admin(auth.uid()));

-- ==============================================================================
-- 6. AUTOMATED PROFILE CREATION, INTEGRITY TRIGGERS & ATOMIC MONETIZATION RPCS
-- ==============================================================================

-- 6.1 Trigger to Protect Profile Sensitive Columns from Direct Client Modification
CREATE OR REPLACE FUNCTION public.protect_profile_sensitive_columns()
RETURNS TRIGGER AS $$
BEGIN
    IF current_setting('app.bypass_profile_protection', true) = 'on' THEN
        RETURN NEW;
    END IF;

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

-- 6.2 Validate Referral Code (Exposes only first name of active affiliates)
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

-- 6.3 Update handle_new_user() Trigger on auth.users Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_raw_ref TEXT;
    v_referrer_id UUID := NULL;
BEGIN
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
        INSERT INTO public.referrals (
            referrer_id, referred_id, reward_amount, status
        ) VALUES (
            v_referrer_id, NEW.id, 0.00, 'pending'
        ) ON CONFLICT (referred_id) DO NOTHING;

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

-- Trigger to execute automatically upon user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6.4 Get Affiliates Referral List with Candidate Names and Pro Conversion Status
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

-- 6.5 Atomic Processing of Verified Pro Subscription Payments & Commissions
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

    SELECT * INTO v_existing_payment FROM public.payments WHERE reference = p_reference;
    IF FOUND THEN
        RETURN jsonb_build_object('success', true, 'already_processed', true);
    END IF;

    INSERT INTO public.payments (
        user_id, reference, amount, currency, plan, status, gateway_response
    ) VALUES (
        p_user_id, p_reference, COALESCE(p_amount, 1000.00), 'NGN', 'pro', 'verified', p_gateway_response
    );

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

    IF v_referrer_id IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1 FROM public.referrals 
            WHERE referred_id = p_user_id AND status = 'completed'
        ) THEN
            SELECT * INTO v_referrer_prof 
            FROM public.profiles 
            WHERE id = v_referrer_id 
            FOR UPDATE;

            v_rate := COALESCE(v_referrer_prof.current_reward_rate, 250.00);

            INSERT INTO public.wallets (user_id, balance, total_earned, total_withdrawn)
            VALUES (v_referrer_id, 0.00, 0.00, 0.00)
            ON CONFLICT (user_id) DO NOTHING;

            SELECT * INTO v_referrer_wallet 
            FROM public.wallets 
            WHERE user_id = v_referrer_id 
            FOR UPDATE;

            v_wallet_bal_before := v_referrer_wallet.balance;
            v_wallet_bal_after := v_wallet_bal_before + v_rate;

            UPDATE public.wallets
            SET balance = v_wallet_bal_after,
                total_earned = total_earned + v_rate,
                updated_at = timezone('utc'::text, now())
            WHERE user_id = v_referrer_id;

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

-- 6.6 Accept Monetization Milestone Tier Offer
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

-- 6.7 Atomic Request Affiliate Payout
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

    SELECT * INTO v_prof FROM public.profiles WHERE id = v_user_id;
    IF v_prof.bank_name IS NULL OR v_prof.bank_code IS NULL OR 
       v_prof.account_number IS NULL OR v_prof.account_name IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Verified Nigerian bank details are required.');
    END IF;

    SELECT * INTO v_wallet FROM public.wallets WHERE user_id = v_user_id FOR UPDATE;
    IF NOT FOUND OR v_wallet.balance < p_amount THEN
        RETURN jsonb_build_object('success', false, 'message', 'Insufficient wallet balance.');
    END IF;

    v_bal_before := v_wallet.balance;
    v_bal_after := v_bal_before - p_amount;
    v_ref := 'PAYOUT_' || SUBSTRING(v_user_id::text, 1, 6) || '_' || (EXTRACT(EPOCH FROM now()) * 1000)::bigint;

    UPDATE public.wallets
    SET balance = v_bal_after,
        total_withdrawn = total_withdrawn + p_amount,
        updated_at = timezone('utc'::text, now())
    WHERE user_id = v_user_id;

    INSERT INTO public.payouts (
        user_id, amount, bank_name, bank_code, account_number, account_name, status, reference
    ) VALUES (
        v_user_id, p_amount, v_prof.bank_name, v_prof.bank_code, v_prof.account_number, v_prof.account_name, 'pending', v_ref
    ) RETURNING id INTO v_payout_id;

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

-- 6.8 Admin Process Payout (Approve or Reject & Refund)
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

    ELSE
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

-- 6.9 Trigger to Log Affiliate Invite Accepted
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

-- ==============================================================================
-- 7. INITIAL SEED DATA (CORE JAMB UTME SUBJECTS)
-- ==============================================================================

INSERT INTO public.subjects (name, code, description, icon, is_compulsory)
VALUES
    ('Use of English', 'ENG', 'Compulsory English test covering comprehension, lexis, and structure.', '📖', true),
    ('Mathematics', 'MTH', 'Algebra, calculus, geometry, trigonometry, and statistics.', '📐', false),
    ('Physics', 'PHY', 'Mechanics, heat, light, sound, electricity, and modern physics.', '⚡', false),
    ('Chemistry', 'CHM', 'Physical, inorganic, and organic chemistry principles.', '🧪', false),
    ('Biology', 'BIO', 'Cell biology, physiology, genetics, ecology, and anatomy.', '🔬', false),
    ('Economics', 'ECO', 'Microeconomics, macroeconomics, public finance, and trade.', '📈', false),
    ('Government', 'GOV', 'Political systems, Nigerian constitution, and public administration.', '🏛️', false),
    ('Literature in English', 'LIT', 'Drama, prose, poetry, and literary appreciation.', '📚', false),
    ('Commerce', 'COM', 'Trade, business finance, marketing, and warehousing.', '💼', false),
    ('Principles of Accounts', 'ACC', 'Bookkeeping, balance sheets, and financial statements.', '🧾', false),
    ('Agricultural Science', 'AGR', 'Crop production, soil science, forestry, and animal husbandry.', '🌱', false),
    ('Christian Religious Knowledge', 'CRK', 'Old Testament, New Testament, and Christian ethics.', '🕊️', false)
ON CONFLICT (name) DO NOTHING;

-- ==============================================================================
-- 8. STORAGE BUCKET: avatars
-- Public bucket for candidate and staff profile pictures
-- ==============================================================================

-- Create avatars storage bucket if it doesn't already exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for avatars bucket
DROP POLICY IF EXISTS "Public avatars can be viewed by anyone" ON storage.objects;
CREATE POLICY "Public avatars can be viewed by anyone"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
CREATE POLICY "Authenticated users can upload avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects;
CREATE POLICY "Users can update their own avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users can delete their own avatars" ON storage.objects;
CREATE POLICY "Users can delete their own avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars');

