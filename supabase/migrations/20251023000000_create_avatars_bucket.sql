-- Create storage bucket for user avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Create policy for public read access to avatars
CREATE POLICY IF NOT EXISTS "Public read access for avatars" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

-- Create policy for authenticated users to upload their avatar
CREATE POLICY IF NOT EXISTS "Users can upload their own avatar" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = split_part(name, '/', 1)
  );

-- Create policy for users to update their own avatar
CREATE POLICY IF NOT EXISTS "Users can update their own avatar" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = split_part(name, '/', 1)
  );

-- Create policy for users to delete their own avatar
CREATE POLICY IF NOT EXISTS "Users can delete their own avatar" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = split_part(name, '/', 1)
  );
