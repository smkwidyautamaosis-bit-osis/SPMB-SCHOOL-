-- Buat tabel banners
CREATE TABLE banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Buka akses SELECT untuk publik
CREATE POLICY "Banners are viewable by everyone."
  ON banners FOR SELECT
  USING ( true );

-- Batasi akses INSERT, UPDATE, DELETE hanya untuk role authenticated
CREATE POLICY "Banners can be inserted by authenticated users."
  ON banners FOR INSERT
  WITH CHECK ( auth.role() = 'authenticated' );

CREATE POLICY "Banners can be updated by authenticated users."
  ON banners FOR UPDATE
  USING ( auth.role() = 'authenticated' );

CREATE POLICY "Banners can be deleted by authenticated users."
  ON banners FOR DELETE
  USING ( auth.role() = 'authenticated' );

-- Pastikan RLS aktif
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;
