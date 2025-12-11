-- Create storage bucket for generated images
INSERT INTO storage.buckets (id, name, public)
VALUES ('generated-images', 'generated-images', true);

-- Create table for tracking user-generated images
CREATE TABLE user_generated_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  public_url TEXT NOT NULL,
  prompt_text TEXT,
  feature TEXT,
  format TEXT,
  aspect_ratio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB
);

-- Create indexes for better performance
CREATE INDEX idx_user_generated_images_user_id ON user_generated_images(user_id);
CREATE INDEX idx_user_generated_images_created_at ON user_generated_images(created_at DESC);
CREATE INDEX idx_user_generated_images_feature ON user_generated_images(feature);

-- Enable Row Level Security
ALTER TABLE user_generated_images ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view own images" ON user_generated_images
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own images" ON user_generated_images
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own images" ON user_generated_images
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own images" ON user_generated_images
  FOR DELETE USING (auth.uid() = user_id);

-- Create policy for public access to storage bucket (for viewing images)
CREATE POLICY "Public read access for generated images" ON storage.objects
  FOR SELECT USING (bucket_id = 'generated-images');

-- Create policy for authenticated users to upload to their folder
CREATE POLICY "Users can upload to their folder" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'generated-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Create policy for users to delete their own images
CREATE POLICY "Users can delete their own images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'generated-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Create policy for users to update their own images
CREATE POLICY "Users can update their own images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'generated-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );