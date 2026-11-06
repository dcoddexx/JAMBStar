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
    role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin', 'super_admin')),
    can_post_notices BOOLEAN NOT NULL DEFAULT true,
    can_manage_users BOOLEAN NOT NULL DEFAULT true,
    can_manage_questions BOOLEAN NOT NULL DEFAULT true,
    can_manage_pro BOOLEAN NOT NULL DEFAULT false,
    last_read_notices TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Ensure gender, tier, admin permissions, and last_read_notices columns exist if upgrading an existing schema
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female'));
UPDATE public.profiles SET gender = 'male' WHERE gender IS NULL;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'free' CHECK (tier IN ('free', 'pro'));
UPDATE public.profiles SET tier = 'free' WHERE tier IS NULL;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS can_post_notices BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS can_manage_users BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS can_manage_questions BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS can_manage_pro BOOLEAN NOT NULL DEFAULT false;
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
    category TEXT NOT NULL CHECK (category IN ('Technical', 'Payment', 'Exam Inquiry', 'General', 'Question Bank Feedback', 'Candidate Support', 'Direct Message', 'Other')),
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

-- ==============================================================================
-- 6. AUTOMATED PROFILE CREATION ON SIGNUP
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, avatar_url, track, gender, tier, role)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'full_name', 'Student Candidate'),
        new.raw_user_meta_data->>'avatar_url',
        COALESCE(new.raw_user_meta_data->>'track', 'Science'),
        COALESCE(new.raw_user_meta_data->>'gender', 'male'),
        COALESCE(new.raw_user_meta_data->>'tier', 'free'),
        COALESCE(new.raw_user_meta_data->>'role', 'student')
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to execute automatically upon user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

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

