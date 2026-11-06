-- ==============================================================================
-- Migration: Add Topics and Topic Association to Questions
-- File: supabase/migrations/20261105_add_topics_schema.sql
-- ==============================================================================

-- 1. Create public.topics Table
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

-- 2. Create public.subtopics Table (Optional for granular depth)
CREATE TABLE IF NOT EXISTS public.subtopics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic_id UUID NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_topic_subtopic_name UNIQUE (topic_id, name)
);

COMMENT ON TABLE public.subtopics IS 'Granular subtopics categorized under a parent syllabus topic.';

-- 3. Upgrade public.questions Table
ALTER TABLE public.questions 
    ADD COLUMN IF NOT EXISTS topic_id UUID REFERENCES public.topics(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS subtopic_id UUID REFERENCES public.subtopics(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS difficulty_level TEXT CHECK (difficulty_level IN ('easy', 'medium', 'hard')) DEFAULT 'medium';

COMMENT ON COLUMN public.questions.topic_id IS 'Foreign key linking the question to its primary syllabus topic.';
COMMENT ON COLUMN public.questions.difficulty_level IS 'Calculated or assigned question difficulty rating.';

-- 4. Create Performance Indexes
CREATE INDEX IF NOT EXISTS idx_topics_subject_id ON public.topics(subject_id);
CREATE INDEX IF NOT EXISTS idx_topics_name ON public.topics(name);
CREATE INDEX IF NOT EXISTS idx_questions_topic_id ON public.questions(topic_id);
CREATE INDEX IF NOT EXISTS idx_questions_exam_year ON public.questions(exam_year);
CREATE INDEX IF NOT EXISTS idx_questions_subject_topic ON public.questions(subject_id, topic_id);

-- 5. Row-Level Security (RLS) for Topics and Subtopics
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subtopics ENABLE ROW LEVEL SECURITY;

-- Allow public read access to all topics
DROP POLICY IF EXISTS "Allow public read access to topics" ON public.topics;
CREATE POLICY "Allow public read access to topics"
    ON public.topics FOR SELECT
    TO authenticated, anon
    USING (true);

-- Allow authenticated admins to insert, update, and delete topics
DROP POLICY IF EXISTS "Allow admins to manage topics" ON public.topics;
CREATE POLICY "Allow admins to manage topics"
    ON public.topics FOR ALL
    TO authenticated
    USING (public.is_admin(auth.uid()))
    WITH CHECK (public.is_admin(auth.uid()));

-- RLS for subtopics
DROP POLICY IF EXISTS "Allow public read access to subtopics" ON public.subtopics;
CREATE POLICY "Allow public read access to subtopics"
    ON public.subtopics FOR SELECT
    TO authenticated, anon
    USING (true);

DROP POLICY IF EXISTS "Allow admins to manage subtopics" ON public.subtopics;
CREATE POLICY "Allow admins to manage subtopics"
    ON public.subtopics FOR ALL
    TO authenticated
    USING (public.is_admin(auth.uid()))
    WITH CHECK (public.is_admin(auth.uid()));

-- 6. Helper Function: Upsert Topic by Subject and Name
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
