-- =============================================
-- SPMB SMK Widya Utama — Admin Schema Migration
-- =============================================

-- Tabel admins (super admin)
create table if not exists admins (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  created_at timestamptz default now()
);

-- RLS untuk tabel admins
alter table admins enable row level security;

-- Admin hanya bisa melihat record miliknya sendiri (untuk cek status admin)
create policy "User bisa cek status admin diri sendiri" on admins
  for select using (auth.jwt() ->> 'email' = email);

-- =============================================
-- Policy tambahan untuk tabel pendaftar (Admin access)
-- =============================================

-- Admin bisa lihat semua data pendaftar
create policy "Admin bisa lihat semua pendaftar" on pendaftar
  for select using (
    exists (select 1 from admins where admins.email = auth.jwt() ->> 'email')
  );

-- Admin bisa update status pendaftar
create policy "Admin bisa update pendaftar" on pendaftar
  for update using (
    exists (select 1 from admins where admins.email = auth.jwt() ->> 'email')
  )
  with check (
    exists (select 1 from admins where admins.email = auth.jwt() ->> 'email')
  );

-- =============================================
-- Policy tambahan untuk tabel dokumen_pendaftar (Admin access)
-- =============================================

-- Admin bisa lihat semua dokumen
create policy "Admin bisa lihat semua dokumen" on dokumen_pendaftar
  for select using (
    exists (select 1 from admins where admins.email = auth.jwt() ->> 'email')
  );

-- =============================================
-- Storage: Admin access ke bucket dokumen-pendaftaran
-- =============================================

create policy "Admin bisa lihat semua file storage"
  on storage.objects for select
  using (
    bucket_id = 'dokumen-pendaftaran'
    and exists (select 1 from admins where admins.email = auth.jwt() ->> 'email')
  );

-- =============================================
-- Seed: Insert super admin
-- WAJIB: Ganti email di bawah sebelum run!
-- =============================================
insert into admins (email) values ('smkwidyautamaosis@gmail.com');
