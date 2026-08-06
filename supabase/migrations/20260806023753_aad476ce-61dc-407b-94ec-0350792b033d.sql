CREATE POLICY "Members can upload own chat media"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'chat-media' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Members can view chat media"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'chat-media');

CREATE POLICY "Members can delete own chat media"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'chat-media' AND (storage.foldername(name))[1] = auth.uid()::text);