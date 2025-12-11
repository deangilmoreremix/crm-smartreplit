/*
  # Setup Company Logos Storage

  1. Storage Setup
    - Create company-logos bucket
    - Set up RLS policies for secure access
    - Configure proper permissions

  2. Security
    - Enable RLS on storage
    - Allow authenticated users to upload
    - Public read access for logos
*/

-- Create the company-logos bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('company-logos', 'company-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy to allow authenticated users to upload company logos
CREATE POLICY "Authenticated users can upload company logos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'company-logos');

-- Policy to allow authenticated users to update their company logos
CREATE POLICY "Authenticated users can update company logos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'company-logos');

-- Policy to allow authenticated users to delete their company logos
CREATE POLICY "Authenticated users can delete company logos"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'company-logos');

-- Policy to allow public read access to company logos
CREATE POLICY "Public read access to company logos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'company-logos');

-- Create additional storage buckets for future use
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('profile-avatars', 'profile-avatars', true),
  ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- Set up policies for profile avatars (similar to company logos)
CREATE POLICY "Authenticated users can upload profile avatars"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'profile-avatars');

CREATE POLICY "Public read access to profile avatars"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'profile-avatars');

-- Set up policies for documents (private)
CREATE POLICY "Authenticated users can manage documents"
ON storage.objects
FOR ALL
TO authenticated
USING (bucket_id = 'documents');