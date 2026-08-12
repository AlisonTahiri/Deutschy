-- Supabase SQL script to create the `audio` storage bucket and setup policies
-- You can run this in your Supabase project's SQL Editor

-- 1. Create the bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('audio', 'audio', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Allow public read access (so the app can play the audio)
CREATE POLICY "Public Access to Audio"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'audio');

-- 3. Allow service_role to insert/update files (for the upload script)
CREATE POLICY "Service Role Upload Access"
ON storage.objects FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'audio');

CREATE POLICY "Service Role Update Access"
ON storage.objects FOR UPDATE
TO service_role
WITH CHECK (bucket_id = 'audio');
