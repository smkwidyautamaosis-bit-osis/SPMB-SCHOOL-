# AGENTS.md — SPMB SMK Widya Utama

## Project Overview
Website Sistem Penerimaan Murid Baru (SPMB) SMK Widya Utama.
Calon siswa: daftar online, upload dokumen, cek status pendaftaran via Magic Link Email.

## Tech Stack
- Next.js 14+ (App Router, TypeScript, src/ directory)
- Tailwind CSS
- Supabase (PostgreSQL, Auth - Magic Link only, Storage)
- react-hook-form + zod
- npm sebagai package manager

## Commands
- `npm run dev` — dev server (http://localhost:3000)
- `npm run build` — production build
- `npm run lint` — linting

## Database Schema (Supabase)
### jurusan
id, nama_jurusan, deskripsi, kuota
Data tetap: Perhotelan, Tata Boga, Pariwisata, Perbankan

### pendaftar
id, user_id (FK auth.users), nomor_pendaftaran (format SPMB-2026-XXXX),
nama_lengkap, nisn, jenis_kelamin, tempat_lahir, tanggal_lahir,
alamat, no_hp, nama_orang_tua, no_hp_orang_tua, asal_sekolah,
jurusan_id (FK jurusan), status (Menunggu Verifikasi/Diverifikasi/Diterima/Ditolak)

### dokumen_pendaftar
id, pendaftar_id (FK), jenis_dokumen (kk/akta_lahir/ijazah_skl/pas_foto), file_url

RLS aktif di semua tabel — user hanya boleh akses data miliknya sendiri (auth.uid()).

## Auth
- Google Sign-In (OAuth) sebagai metode utama.
- Callback route: /auth/callback

## Storage
- Bucket: dokumen-pendaftaran (private)
- Path: {user_id}/{jenis_dokumen}.{ext}
- Validasi: .pdf/.jpg/.jpeg/.png, max 2MB per file

## Design System
- Primary: blue-900 (#1E3A8A)
- Accent: amber-500 (#F59E0B)
- Background: slate-50
- Font: Poppins (next/font/google)
- Mobile-first, fully responsive

## Conventions / Rules (WAJIB DIIKUTI)
1. Field database & label UI dalam Bahasa Indonesia. Nama variabel/komponen dalam English.
2. NISN WAJIB disimpan & divalidasi sebagai string, BUKAN number (leading zero hilang kalau number).
3. Reusable UI components di src/components/ui (Button, Input, Select, Textarea, FileUploadField, Card, Badge, StatusBadge).
4. JANGAN ubah/hapus RLS policy tanpa konfirmasi eksplisit.
5. .env.local sudah berisi kredensial asli Supabase — JANGAN pernah commit ke git, JANGAN tampilkan isinya di chat/log.
6. Setiap fitur baru: jelaskan dulu rencana perubahan sebelum eksekusi besar (terutama yang menyentuh schema DB).
7. Untuk setiap penyelesaian task/tugas: jelaskan saja secara singkat apa yang diubah dan di file mana, TIDAK PERLU melampirkan full source code ke dalam jawaban agar chat tidak terlalu panjang.