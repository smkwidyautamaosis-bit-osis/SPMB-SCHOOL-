import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { JENIS_DOKUMEN_LABEL } from '@/types';
import type { Pendaftar, DokumenPendaftar, Jurusan } from '@/types';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Status Pendaftaran',
  description: 'Cek status pendaftaran SPMB SMK Widya Utama 2026',
};

/**
 * Halaman Status Pendaftaran (/status).
 * Server Component — ambil data pendaftar, jurusan, dan dokumen milik user.
 */
export default async function StatusPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; nomor?: string }>;
}) {
  const supabase = await createClient();
  const params = await searchParams;

  // Ambil user session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Ambil data pendaftar dengan relasi jurusan
  const { data: pendaftar } = await supabase
    .from('pendaftar')
    .select('*, jurusan:jurusan_id(*)')
    .eq('user_id', user.id)
    .maybeSingle() as { data: (Pendaftar & { jurusan: Jurusan }) | null };

  // Ambil dokumen jika ada data pendaftar
  let dokumen: DokumenPendaftar[] = [];
  if (pendaftar) {
    const { data: docs } = await supabase
      .from('dokumen_pendaftar')
      .select('*')
      .eq('pendaftar_id', pendaftar.id)
      .order('uploaded_at');
    dokumen = (docs as DokumenPendaftar[]) ?? [];
  }

  const isSuccess = params.success === '1';
  const nomorBaru = params.nomor;

  // Format tanggal Indonesia
  const formatTanggal = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-blue-50/30 pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ===== Notifikasi Sukses ===== */}
        {isSuccess && nomorBaru && (
          <div className="mb-6 p-5 rounded-2xl bg-green-50 border border-green-200 flex items-start gap-4 animate-fade-in">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-green-800">Pendaftaran Berhasil! 🎉</h3>
              <p className="text-sm text-green-600 mt-1">
                Nomor pendaftaran kamu: <strong className="text-green-800 font-mono">{nomorBaru}</strong>
              </p>
              <p className="text-xs text-green-500 mt-1">
                Simpan nomor ini untuk keperluan verifikasi. Tim kami akan memproses pendaftaran kamu segera.
              </p>
            </div>
          </div>
        )}

        {/* ===== Page Header ===== */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 rounded-full px-4 py-2 text-sm font-medium mb-4">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Status Pendaftaran SPMB 2026
          </div>
          <h1 className="text-3xl font-extrabold text-blue-900">
            Status Pendaftaran
          </h1>
          <p className="text-slate-500 mt-2 text-sm">
            Email: <span className="font-medium text-blue-900">{user.email}</span>
          </p>
        </div>

        {!pendaftar ? (
          /* ===== Belum Mendaftar ===== */
          <Card className="text-center" padding="lg">
            <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-5">
              <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-700 mb-2">
              Belum Ada Pendaftaran
            </h2>
            <p className="text-slate-500 mb-6">
              Kamu belum pernah mengisi form pendaftaran. Daftar sekarang untuk memulai!
            </p>
            <Link href="/daftar">
              <Button size="lg" id="btn-ke-form-daftar">
                Mulai Pendaftaran
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Button>
            </Link>
          </Card>
        ) : (
          /* ===== Ada Data Pendaftaran ===== */
          <div className="space-y-5">
            {/* Status Card */}
            <Card className="overflow-hidden !p-0">
              <div className="h-2 bg-gradient-to-r from-blue-900 to-blue-600" />
              <div className="p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Nomor Pendaftaran</p>
                    <p className="text-2xl font-black font-mono text-blue-900 tracking-wide">
                      {pendaftar.nomor_pendaftaran}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Didaftarkan: {formatTanggal(pendaftar.created_at)}
                    </p>
                  </div>
                  <div className="flex flex-col items-start sm:items-end gap-2">
                    <p className="text-xs text-slate-500">Status Pendaftaran</p>
                    <StatusBadge status={pendaftar.status} size="md" />
                  </div>
                </div>
              </div>
            </Card>

            {/* Data Diri */}
            <Card>
              <h3 className="font-bold text-blue-900 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Data Diri
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: 'Nama Lengkap', value: pendaftar.nama_lengkap },
                  { label: 'NISN', value: pendaftar.nisn },
                  { label: 'Jenis Kelamin', value: pendaftar.jenis_kelamin },
                  { label: 'Tempat, Tanggal Lahir', value: `${pendaftar.tempat_lahir}, ${formatTanggal(pendaftar.tanggal_lahir)}` },
                  { label: 'No. HP', value: pendaftar.no_hp },
                  { label: 'Sekolah Asal', value: pendaftar.asal_sekolah },
                  { label: 'Program Keahlian', value: pendaftar.jurusan?.nama_jurusan ?? '-' },
                ].map((item) => (
                  <div key={item.label} className={item.label === 'Nama Lengkap' || item.label === 'Program Keahlian' ? 'sm:col-span-2' : ''}>
                    <p className="text-xs text-slate-400 mb-0.5">{item.label}</p>
                    <p className="font-medium text-slate-800 text-sm">{item.value}</p>
                  </div>
                ))}

                <div className="sm:col-span-2">
                  <p className="text-xs text-slate-400 mb-0.5">Alamat</p>
                  <p className="font-medium text-slate-800 text-sm">{pendaftar.alamat}</p>
                </div>
              </div>
            </Card>

            {/* Data Orang Tua */}
            <Card>
              <h3 className="font-bold text-blue-900 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Data Orang Tua / Wali
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: 'Nama Orang Tua / Wali', value: pendaftar.nama_orang_tua },
                  { label: 'No. HP Orang Tua / Wali', value: pendaftar.no_hp_orang_tua },
                ].map((item) => (
                  <div key={item.label}>
                    <p className="text-xs text-slate-400 mb-0.5">{item.label}</p>
                    <p className="font-medium text-slate-800 text-sm">{item.value}</p>
                  </div>
                ))}
              </div>
            </Card>

            {/* Dokumen */}
            <Card>
              <h3 className="font-bold text-blue-900 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Dokumen yang Diupload
              </h3>

              {dokumen.length === 0 ? (
                <p className="text-sm text-slate-400 italic">Belum ada dokumen yang diupload.</p>
              ) : (
                <div className="space-y-2">
                  {dokumen.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-700">
                            {JENIS_DOKUMEN_LABEL[doc.jenis_dokumen]}
                          </p>
                          <p className="text-xs text-slate-400">
                            Upload: {formatTanggal(doc.uploaded_at)}
                          </p>
                        </div>
                      </div>
                      <a
                        href={doc.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1"
                      >
                        Lihat
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Keterangan status */}
            <Card className="bg-blue-50 border-blue-100">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="text-sm font-semibold text-blue-800">Informasi Status</p>
                  <ul className="text-xs text-blue-600 mt-1 space-y-1">
                    <li>🟡 <strong>Menunggu Verifikasi</strong> — berkas sedang ditinjau oleh panitia</li>
                    <li>🔵 <strong>Diverifikasi</strong> — berkas sudah diverifikasi, menunggu hasil seleksi</li>
                    <li>🟢 <strong>Diterima</strong> — selamat! kamu diterima di SMK Widya Utama</li>
                    <li>🔴 <strong>Ditolak</strong> — hubungi panitia untuk informasi lebih lanjut</li>
                  </ul>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
