import { createClient } from '@/lib/supabase/server';
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

  // Fetch semua pendaftar + nama jurusan, diurutkan terbaru dulu
  const { data: pendaftarList } = await supabase
    .from('pendaftar')
    .select('*, jurusan:jurusan_id(id, nama_jurusan)')
    .order('created_at', { ascending: false }) as { data: PendaftarWithJurusan[] | null };

  // Fetch daftar jurusan untuk filter dropdown
  const { data: jurusanList } = await supabase
    .from('jurusan')
    .select('id, nama_jurusan')
    .order('nama_jurusan') as { data: Pick<Jurusan, 'id' | 'nama_jurusan'>[] | null };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h2 className="text-2xl font-extrabold text-slate-800">Data Pendaftar</h2>
        <p className="text-slate-400 text-sm mt-1">
          Kelola dan pantau seluruh pendaftar SPMB 2026
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
