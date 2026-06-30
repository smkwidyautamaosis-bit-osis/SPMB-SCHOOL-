-- Tambahkan kolom banner_url di tabel pengaturan_sistem
ALTER TABLE pengaturan_sistem ADD COLUMN banner_url TEXT;

-- Buat storage bucket untuk banners (public) jika belum ada
INSERT INTO storage.buckets (id, name, public)
VALUES ('banners', 'banners', true)
ON CONFLICT (id) DO NOTHING;

-- Policy untuk mengizinkan siapapun membaca banner
CREATE POLICY "Banners are publicly accessible."
  ON storage.objects FOR SELECT
  USING ( bucket_id = 'banners' );

-- Policy untuk mengizinkan admin mengupload/update/delete banner (sementara auth authenticated user)
CREATE POLICY "Authenticated users can upload banners."
  ON storage.objects FOR INSERT
  WITH CHECK ( bucket_id = 'banners' AND auth.role() = 'authenticated' );

CREATE POLICY "Authenticated users can update banners."
  ON storage.objects FOR UPDATE
  USING ( bucket_id = 'banners' AND auth.role() = 'authenticated' );

CREATE POLICY "Authenticated users can delete banners."
  ON storage.objects FOR DELETE
  USING ( bucket_id = 'banners' AND auth.role() = 'authenticated' );
