CREATE TABLE pengaturan_sistem (
  id INT PRIMARY KEY DEFAULT 1,
  tahun_periode TEXT NOT NULL DEFAULT '2026/2027',
  gel1_mulai DATE NOT NULL DEFAULT '2026-07-01',
  gel1_selesai DATE NOT NULL DEFAULT '2026-07-31',
  gel2_mulai DATE NOT NULL DEFAULT '2026-08-01',
  gel2_selesai DATE NOT NULL DEFAULT '2026-08-10',
  gel3_mulai DATE NOT NULL DEFAULT '2026-08-16',
  gel3_selesai DATE NOT NULL DEFAULT '2026-08-31',
  alamat_sekolah TEXT NOT NULL DEFAULT 'Jl. Merdeka No. 45, Jakarta Selatan',
  email_sekolah TEXT NOT NULL DEFAULT 'info@smkwidyautama.sch.id',
  no_hp_sekolah TEXT NOT NULL DEFAULT '0812-3456-7890',
  CONSTRAINT single_row CHECK (id = 1)
);

-- Masukkan data awal
INSERT INTO pengaturan_sistem (id) VALUES (1);

-- Aktifkan RLS
ALTER TABLE pengaturan_sistem ENABLE ROW LEVEL SECURITY;

-- Policy: Publik bisa baca
CREATE POLICY "Publik bisa membaca pengaturan" 
ON pengaturan_sistem 
FOR SELECT 
USING (true);

-- Policy: Admin (authenticated) bisa update
CREATE POLICY "Admin bisa mengubah pengaturan" 
ON pengaturan_sistem 
FOR UPDATE 
TO authenticated 
USING (true)
WITH CHECK (true);
