-- 1. Add avatar_url to your profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 2. Create the "avatars" storage bucket and make it public
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Set up Storage Policies to allow users to upload and view images
-- Drop them first in case they exist to avoid errors
DROP POLICY IF EXISTS "Avatar Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Avatar Upload" ON storage.objects;
DROP POLICY IF EXISTS "Avatar Update" ON storage.objects;

-- Allow anyone to view the avatars
CREATE POLICY "Avatar Public Access" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'avatars');

-- Allow authenticated users to upload new avatars
CREATE POLICY "Avatar Upload" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'avatars');

-- Allow authenticated users to update their own avatars
CREATE POLICY "Avatar Update" 
ON storage.objects FOR UPDATE 
TO authenticated 
USING (bucket_id = 'avatars');
