-- CREATE BUCKET
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('file-transfers', 'file-transfers', TRUE, 104857600, ARRAY['*/*'])
ON CONFLICT (id) DO NOTHING;

-- POLICIES
DROP POLICY IF EXISTS "Authenticated users can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;
DROP POLICY IF EXISTS "Public can download files" ON storage.objects;

CREATE POLICY "Authenticated users can upload files"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'file-transfers');

CREATE POLICY "Users can update own files"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'file-transfers'
    AND auth.uid() = storage.foldername(name)[1]
  );

CREATE POLICY "Users can delete own files"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'file-transfers'
    AND auth.uid() = storage.foldername(name)[1]
  );

CREATE POLICY "Public can download files"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'file-transfers');
