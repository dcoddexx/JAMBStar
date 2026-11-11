-- ==============================================================================
-- Migration: Add System Settings (Maintenance Mode) and Admin Permission Delegation
-- File: supabase/migrations/20261111_add_system_maintenance.sql
-- ==============================================================================

-- 1. Create public.system_settings Table
CREATE TABLE IF NOT EXISTS public.system_settings (
    id TEXT PRIMARY KEY DEFAULT 'global',
    is_maintenance BOOLEAN NOT NULL DEFAULT false,
    maintenance_message TEXT NOT NULL DEFAULT 'We are currently performing scheduled system updates to improve your JAMBStar CBT practice experience. Please check back shortly.',
    maintenance_auto_on_at TIMESTAMPTZ NULL,
    maintenance_auto_off_at TIMESTAMPTZ NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Upgrade existing table if already created
ALTER TABLE public.system_settings
    ADD COLUMN IF NOT EXISTS maintenance_auto_on_at TIMESTAMPTZ NULL,
    ADD COLUMN IF NOT EXISTS maintenance_auto_off_at TIMESTAMPTZ NULL;

-- Insert singleton global record if not present
INSERT INTO public.system_settings (id, is_maintenance, maintenance_message)
VALUES (
    'global',
    false,
    'We are currently performing scheduled system updates to improve your JAMBStar CBT practice experience. Please check back shortly.'
)
ON CONFLICT (id) DO NOTHING;

-- 2. Add can_manage_maintenance Column to public.profiles
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS can_manage_maintenance BOOLEAN NOT NULL DEFAULT false;

-- 3. Row Level Security (RLS) for public.system_settings
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Anyone (candidates, guests, admins) can view system settings to check maintenance status
DROP POLICY IF EXISTS "Anyone can view system settings" ON public.system_settings;
CREATE POLICY "Anyone can view system settings"
    ON public.system_settings
    FOR SELECT
    USING (true);

-- Authenticated admins can update system settings
DROP POLICY IF EXISTS "Admins can update system settings" ON public.system_settings;
CREATE POLICY "Admins can update system settings"
    ON public.system_settings
    FOR UPDATE
    TO authenticated
    USING (public.is_admin(auth.uid()))
    WITH CHECK (public.is_admin(auth.uid()));

-- Authenticated admins can insert/upsert system settings
DROP POLICY IF EXISTS "Admins can insert system settings" ON public.system_settings;
CREATE POLICY "Admins can insert system settings"
    ON public.system_settings
    FOR INSERT
    TO authenticated
    WITH CHECK (public.is_admin(auth.uid()));
