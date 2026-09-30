-- ==============================================================================
-- Migration: 023_avatars_storage_and_template.sql
-- Description: Adds profile_template column to profiles and provisions avatars storage
-- ==============================================================================

-- 1. Add profile_template column to profiles if not exists
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS profile_template TEXT DEFAULT 'modern';

-- Add check constraint for valid template themes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_profile_template_check'
  ) THEN
    ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_profile_template_check
    CHECK (profile_template IN ('modern', 'elegant', 'academic', 'minimal', 'creative'));
  END IF;
END $$;

-- 2. Create public storage bucket for avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 3. Storage RLS Policies for avatars bucket
-- Allow anyone (public) to view avatar images
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Public Avatars View Policy' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Public Avatars View Policy"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'avatars');
  END IF;
END $$;

-- Allow authenticated users to upload avatar images
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated Avatars Upload Policy' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Authenticated Avatars Upload Policy"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'avatars');
  END IF;
END $$;

-- Allow authenticated users to update their avatar images
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated Avatars Update Policy' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Authenticated Avatars Update Policy"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (bucket_id = 'avatars');
  END IF;
END $$;
