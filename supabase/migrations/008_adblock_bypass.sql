-- Buat tabel hero_images (pengganti banners yang diblokir AdBlocker)
CREATE TABLE IF NOT EXISTS hero_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Jika tabel banners (dari migrasi 007) sempat dibuat, pindahkan datanya lalu hapus
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'banners') THEN
    INSERT INTO hero_images (id, url, created_at)
    SELECT id, url, created_at FROM banners;
    DROP TABLE banners;
  END IF;
END $$;

-- Buka akses SELECT untuk publik
CREATE POLICY "hero_images viewable by everyone."
  ON hero_images FOR SELECT USING ( true );

-- Batasi akses INSERT, UPDATE, DELETE hanya untuk role authenticated
CREATE POLICY "hero_images inserted by authenticated."
  ON hero_images FOR INSERT WITH CHECK ( auth.role() = 'authenticated' );

CREATE POLICY "hero_images updated by authenticated."
  ON hero_images FOR UPDATE USING ( auth.role() = 'authenticated' );

CREATE POLICY "hero_images deleted by authenticated."
  ON hero_images FOR DELETE USING ( auth.role() = 'authenticated' );

ALTER TABLE hero_images ENABLE ROW LEVEL SECURITY;

-- Buat storage bucket baru (karena bucket banners juga rentan diblokir)
INSERT INTO storage.buckets (id, name, public)
VALUES ('hero_images', 'hero_images', true)
ON CONFLICT (id) DO NOTHING;

-- Policy untuk bucket hero_images
CREATE POLICY "hero_images storage publicly accessible."
  ON storage.objects FOR SELECT
  USING ( bucket_id = 'hero_images' );

CREATE POLICY "Authenticated users can upload hero_images storage."
  ON storage.objects FOR INSERT
  WITH CHECK ( bucket_id = 'hero_images' AND auth.role() = 'authenticated' );

CREATE POLICY "Authenticated users can update hero_images storage."
  ON storage.objects FOR UPDATE
  USING ( bucket_id = 'hero_images' AND auth.role() = 'authenticated' );

CREATE POLICY "Authenticated users can delete hero_images storage."
  ON storage.objects FOR DELETE
  USING ( bucket_id = 'hero_images' AND auth.role() = 'authenticated' );
