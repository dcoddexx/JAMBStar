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
    role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin', 'super_admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

COMMENT ON TABLE public.profiles IS 'Student and admin profiles linked to auth.users.';
COMMENT ON COLUMN public.profiles.track IS 'Student academic discipline: Science, Arts, or Commercial.';
COMMENT ON COLUMN public.profiles.role IS 'User permission role: student, admin, or super_admin.';

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
-- Table: questions
-- Past and practice questions mapped to subjects with A-D options
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT NOT NULL,
    correct_option CHAR(1) NOT NULL CHECK (correct_option IN ('A', 'B', 'C', 'D')),
    explanation TEXT,
    exam_year INTEGER,
    image_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Ensure image_url column exists if upgrading an existing schema
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS image_url TEXT;

COMMENT ON TABLE public.questions IS 'Multiple choice questions with 4 options (A-D) and explanations.';
COMMENT ON COLUMN public.questions.correct_option IS 'Correct answer choice (A, B, C, or D).';
COMMENT ON COLUMN public.questions.image_url IS 'Optional URL or path to a diagram/figure for the question.';

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

-- ==============================================================================
-- 3. INDEXES FOR PERFORMANCE
-- ==============================================================================

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_questions_subject_id ON public.questions(subject_id);
CREATE INDEX IF NOT EXISTS idx_quiz_results_user_id ON public.quiz_results(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_results_subject_id ON public.quiz_results(subject_id);
CREATE INDEX IF NOT EXISTS idx_quiz_results_timestamp ON public.quiz_results(timestamp DESC);

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

-- ==============================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_results ENABLE ROW LEVEL SECURITY;

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

-- ==============================================================================
-- 6. AUTOMATED PROFILE CREATION ON SIGNUP
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, avatar_url, track, role)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'full_name', 'Student Candidate'),
        new.raw_user_meta_data->>'avatar_url',
        COALESCE(new.raw_user_meta_data->>'track', 'Science'),
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
