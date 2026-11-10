-- Private storage bucket for CRM contact attachments.
-- Object paths are <auth.uid()>/<contact_id>/<timestamp>-<filename>; each user can only touch their own folder.

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('crm-attachments', 'crm-attachments', false, 26214400)
ON CONFLICT (id) DO UPDATE SET public = false, file_size_limit = EXCLUDED.file_size_limit;

DROP POLICY IF EXISTS "crm_attachments_insert_own" ON storage.objects;
DROP POLICY IF EXISTS "crm_attachments_select_own" ON storage.objects;
DROP POLICY IF EXISTS "crm_attachments_update_own" ON storage.objects;
DROP POLICY IF EXISTS "crm_attachments_delete_own" ON storage.objects;

CREATE POLICY "crm_attachments_insert_own" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'crm-attachments' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "crm_attachments_select_own" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'crm-attachments' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "crm_attachments_update_own" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'crm-attachments' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'crm-attachments' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "crm_attachments_delete_own" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'crm-attachments' AND (storage.foldername(name))[1] = auth.uid()::text);
