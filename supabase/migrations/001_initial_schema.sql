-- =============================================
-- SPMB SMK Widya Utama — Initial Schema Migration
-- =============================================

-- Tabel jurusan
create table if not exists jurusan (
  id uuid primary key default gen_random_uuid(),
  nama_jurusan text not null,
  deskripsi text,
  kuota integer default 0,
  created_at timestamptz default now()
);

-- Seed data jurusan
insert into jurusan (nama_jurusan, deskripsi) values
('Perhotelan', 'Program keahlian Perhotelan'),
('Tata Boga', 'Program keahlian Tata Boga'),
('Pariwisata', 'Program keahlian Pariwisata'),
('Perbankan', 'Program keahlian Perbankan');

-- Tabel pendaftar
create table if not exists pendaftar (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  nomor_pendaftaran text unique not null,
  nama_lengkap text not null,
  nisn text not null,
  jenis_kelamin text not null check (jenis_kelamin in ('Laki-laki','Perempuan')),
  tempat_lahir text not null,
  tanggal_lahir date not null,
  alamat text not null,
  no_hp text not null,
  nama_orang_tua text not null,
  no_hp_orang_tua text not null,
  asal_sekolah text not null,
  jurusan_id uuid references jurusan(id) not null,
  status text not null default 'Menunggu Verifikasi'
    check (status in ('Menunggu Verifikasi','Diverifikasi','Ditolak','Diterima')),
  created_at timestamptz default now()
);

-- Tabel dokumen_pendaftar
create table if not exists dokumen_pendaftar (
  id uuid primary key default gen_random_uuid(),
  pendaftar_id uuid references pendaftar(id) on delete cascade not null,
  jenis_dokumen text not null check (jenis_dokumen in ('kk','akta_lahir','ijazah_skl','pas_foto')),
  file_url text not null,
  uploaded_at timestamptz default now()
);

-- =============================================
-- Row Level Security
-- =============================================
alter table pendaftar enable row level security;
alter table dokumen_pendaftar enable row level security;

-- Pendaftar: hanya bisa lihat & insert data sendiri
create policy "User bisa lihat data sendiri" on pendaftar
  for select using (auth.uid() = user_id);

create policy "User bisa insert data sendiri" on pendaftar
  for insert with check (auth.uid() = user_id);

-- Dokumen: hanya bisa lihat & insert dokumen milik sendiri
create policy "User bisa lihat dokumen sendiri" on dokumen_pendaftar
  for select using (
    pendaftar_id in (select id from pendaftar where user_id = auth.uid())
  );

create policy "User bisa insert dokumen sendiri" on dokumen_pendaftar
  for insert with check (
    pendaftar_id in (select id from pendaftar where user_id = auth.uid())
  );

-- =============================================
-- Storage: Bucket dokumen-pendaftaran
-- (Buat bucket dulu via Dashboard, kemudian jalankan policy berikut)
-- =============================================

-- Policy: user hanya bisa upload ke folder {user_id}/
-- insert into storage.buckets (id, name, public) values ('dokumen-pendaftaran', 'dokumen-pendaftaran', false);

create policy "User bisa upload dokumen sendiri"
  on storage.objects for insert
  with check (
    bucket_id = 'dokumen-pendaftaran'
    and auth.uid()::text = (string_to_array(name, '/'))[1]
  );

create policy "User bisa lihat dokumen sendiri"
  on storage.objects for select
  using (
    bucket_id = 'dokumen-pendaftaran'
    and auth.uid()::text = (string_to_array(name, '/'))[1]
  );
