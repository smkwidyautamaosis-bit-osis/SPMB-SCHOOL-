import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PendaftaranForm } from '@/components/forms/PendaftaranForm';
import type { Jurusan } from '@/types';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  const supabase = await createClient();
  const { data } = await supabase.from('pengaturan_sistem').select('tahun_periode').eq('id', 1).single();
  const tahun = data?.tahun_periode?.split('/')[0] || '2026';
  return {
    title: 'Form Pendaftaran',
    description: `Isi form pendaftaran online SPMB SMK Widya Utama ${tahun}`,
  };
}

/**
 * Halaman Form Pendaftaran (/daftar).
 * Server Component — cek auth, cek sudah punya data, fetch jurusan.
 * Render PendaftaranForm (Client Component) dengan data yang sudah disiapkan.
 */
export default async function DaftarPage() {
  const supabase = await createClient();

  // Ambil user session (middleware sudah menjamin user login)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Jika user sudah punya data pendaftaran → redirect ke status
  const { data: existingPendaftar } = await supabase
    .from('pendaftar')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (existingPendaftar) {
    redirect('/status');
  }

  // Fetch data jurusan untuk dropdown
  const { data: jurusanList } = await supabase
    .from('jurusan')
    .select('*')
    .order('nama_jurusan');

  // Ambil pengaturan sistem
  const { data: setting } = await supabase
    .from('pengaturan_sistem')
    .select('tahun_periode')
    .eq('id', 1)
    .single();
  const tahunSingkat = setting?.tahun_periode?.split('/')[0] || '2026';

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-rose-50/30 pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-rose-100 text-rose-700 rounded-full px-4 py-2 text-sm font-medium mb-4">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            SPMB {tahunSingkat} — Formulir Online
          </div>
          <h1 className="text-3xl font-extrabold text-rose-900">
            Form Pendaftaran
          </h1>
          <p className="text-slate-500 mt-2">
            Lengkapi semua data di bawah ini dengan benar dan sesuai dokumen resmi.
          </p>
          {/* Email info */}
          <div className="mt-3 inline-flex items-center gap-2 text-sm text-slate-600 bg-white rounded-full px-4 py-1.5 shadow-sm border border-slate-100">
            <svg className="w-4 h-4 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span className="font-medium">{user.email}</span>
          </div>
        </div>

        {/* Form Component */}
        <PendaftaranForm
          jurusanList={(jurusanList as Jurusan[]) ?? []}
          userId={user.id}
          userEmail={user.email ?? ''}
        />
      </div>
    </div>
  );
}
