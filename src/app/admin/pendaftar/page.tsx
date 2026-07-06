import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { PendaftarTable } from '@/components/admin/PendaftarTable';
import type { Jurusan, Pendaftar } from '@/types';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Data Pendaftar' };

type PendaftarWithJurusan = Pendaftar & { jurusan: Jurusan | null };

/**
 * Halaman List Pendaftar (/admin/pendaftar).
 * Server Component — fetch semua data, render tabel di Client Component.
 */
export default async function AdminPendaftarPage() {
  const supabase = await createClient();

  // Inisialisasi admin client untuk mengambil data email (auth.users)
  const supabaseAdmin = process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      )
    : null;

  // Fetch semua pendaftar + nama jurusan, diurutkan terbaru dulu
  const { data: pendaftarData } = await supabase
    .from('pendaftar')
    .select('*, jurusan:jurusan_id(id, nama_jurusan)')
    .order('created_at', { ascending: false }) as { data: PendaftarWithJurusan[] | null };

  let pendaftarList = pendaftarData || [];

  // Jika admin client tersedia, fetch auth.users dan gabungkan email + avatar
  if (supabaseAdmin && pendaftarList.length > 0) {
    try {
      const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
      if (users && users.length > 0) {
        // Buat map user_id -> user untuk lookup cepat
        const userMap = new Map(users.map(u => [u.id, u]));
        
        pendaftarList = pendaftarList.map(p => {
          const u = userMap.get(p.user_id);
          return {
            ...p,
            email: u?.email || '',
            avatar_url: u?.user_metadata?.avatar_url || '',
          };
        });
      }
    } catch (e) {
      console.error("Gagal mengambil data auth.users. Pastikan service role key valid.", e);
    }
  }

  // Fetch daftar jurusan untuk filter dropdown
  const { data: jurusanList } = await supabase
    .from('jurusan')
    .select('id, nama_jurusan')
    .order('nama_jurusan') as { data: Pick<Jurusan, 'id' | 'nama_jurusan'>[] | null };

  // Ambil pengaturan sistem
  const { data: setting } = await supabase
    .from('pengaturan_sistem')
    .select('tahun_periode')
    .eq('id', 1)
    .single();
  const tahunSingkat = setting?.tahun_periode?.split('/')[0] || '2026';

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h2 className="text-2xl font-extrabold text-slate-800">Data Pendaftar</h2>
        <p className="text-slate-400 text-sm mt-1">
          Kelola dan pantau seluruh pendaftar SPMB {tahunSingkat}
        </p>
      </div>

      {/* Tabel dengan filter & search */}
      <PendaftarTable
        pendaftarList={pendaftarList ?? []}
        jurusanList={jurusanList ?? []}
      />
    </div>
  );
}
