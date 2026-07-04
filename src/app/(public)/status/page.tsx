import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PrintButton } from '@/components/ui/PrintButton';
import { JENIS_DOKUMEN_LABEL } from '@/types';
import type { Pendaftar, DokumenPendaftar, Jurusan } from '@/types';
import type { Metadata } from 'next';
import Image from 'next/image';

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

  // Ambil data pengaturan
  const { data: setting } = await supabase
    .from('pengaturan_sistem')
    .select('tahun_periode')
    .eq('id', 1)
    .single();
  const tahunSingkat = setting?.tahun_periode?.split('/')[0] || '2026';

  // Ambil dokumen jika ada data pendaftar
  let dokumenWithSignedUrl: (DokumenPendaftar & { signedUrl: string })[] = [];
  if (pendaftar) {
    const { data: docs } = await supabase
      .from('dokumen_pendaftar')
      .select('*')
      .eq('pendaftar_id', pendaftar.id)
      .order('uploaded_at');
    
    const dokumenList = (docs as DokumenPendaftar[]) ?? [];

    // Generate signed URL (1 jam) untuk setiap dokumen di bucket private
    dokumenWithSignedUrl = await Promise.all(
      dokumenList.map(async (doc) => {
        const urlObj = new URL(doc.file_url);
        const pathParts = urlObj.pathname.split('/object/sign/dokumen-pendaftaran/');
        let storagePath = '';

        if (pathParts.length > 1) {
          storagePath = decodeURIComponent(pathParts[1].split('?')[0]);
        } else {
          const pubParts = urlObj.pathname.split('/object/public/dokumen-pendaftaran/');
          storagePath = pubParts.length > 1
            ? decodeURIComponent(pubParts[1])
            : `${pendaftar.user_id}/${doc.jenis_dokumen}`;
        }

        const { data: signedData } = await supabase.storage
          .from('dokumen-pendaftaran')
          .createSignedUrl(storagePath, 3600); // 1 jam

        return {
          ...doc,
          signedUrl: signedData?.signedUrl ?? doc.file_url,
        };
      })
    );
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
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-rose-50/30 pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ===== Notifikasi Sukses ===== */}
        {isSuccess && nomorBaru && (
          <div className="mb-6 p-5 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-4 animate-fade-in">
            <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-rose-900">Pendaftaran Berhasil! 🎉</h3>
              <p className="text-sm text-rose-700 mt-1">
                Nomor pendaftaran kamu: <strong className="text-rose-900 font-mono">{nomorBaru}</strong>
              </p>
              <p className="text-xs text-rose-600 mt-1">
                Simpan nomor ini untuk keperluan verifikasi. Tim kami akan memproses pendaftaran kamu segera.
              </p>
            </div>
          </div>
        )}

        {/* ===== Page Header ===== */}
        <div className="text-center mb-8 flex flex-col items-center print:hidden">
          <div className="relative w-16 h-16 mb-4">
            <Image 
              src="/images/logo_wu.png" 
              alt="Logo SPMB SMK Widya Utama" 
              fill
              className="object-cover"
              sizes="64px"
            />
          </div>
          <div className="inline-flex items-center gap-2 bg-rose-100 text-rose-700 rounded-full px-4 py-2 text-sm font-medium mb-4">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Status Pendaftaran SPMB {tahunSingkat}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-rose-900">
            Status Pendaftaran
          </h1>
          <p className="text-slate-500 mt-2 text-sm">
            Email: <span className="font-medium text-rose-900">{user.email}</span>
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
          <div className="space-y-5 print:space-y-4 print:text-black">
            {/* Print Header */}
            <div className="hidden print:block text-center border-b-2 border-slate-800 pb-4 mb-6">
              <h1 className="text-2xl font-black text-slate-800 uppercase tracking-widest">SMK WIDYA UTAMA</h1>
              <p className="text-sm text-slate-600">Bukti Pendaftaran Siswa Baru (SPMB) Tahun {tahunSingkat}</p>
              <p className="text-xs text-slate-500 mt-1">Jl. Widya Utama No.1, Kota | info@smkwidyautama.sch.id</p>
            </div>

            {/* Status Card */}
            <Card className="overflow-hidden !p-0 print:shadow-none print:border-slate-800 print:rounded-none">
              <div className="p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Nomor Pendaftaran</p>
                    <p className="text-2xl font-black font-mono text-rose-900 tracking-wide">
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
            <Card className="print:shadow-none print:border-none print:p-0 print:mb-4">
              <h3 className="font-bold text-rose-900 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path className="fill-rose-900" d="M12 3L1 9L5 11.18V17C5 17 8.5 21 12 21C15.5 21 19 17 19 17V11.18L21 10.09V17H23V9L12 3ZM12 14C9.79 14 8 12.21 8 10C8 7.79 9.79 6 12 6C14.21 6 16 7.79 16 10C16 12.21 14.21 14 12 14Z" />
                  <path className="fill-amber-500" d="M12 12C12 12 10 14 10 15.5C10 16.88 10.9 18 12 18C13.1 18 14 16.88 14 15.5C14 14 12 12 12 12Z" />
                </svg>
                Data Diri
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: 'Nama Lengkap', value: pendaftar.nama_lengkap },
                  { label: 'NISN', value: pendaftar.nisn },
                  { label: 'Jenis Kelamin', value: pendaftar.jenis_kelamin },
                  { label: 'Tempat, Tanggal Lahir', value: `${pendaftar.tempat_lahir}, ${formatTanggal(pendaftar.tanggal_lahir)}` },
                  { label: 'No. HP / WhatsApp', value: pendaftar.no_whatsapp },
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
            <Card className="print:shadow-none print:border-none print:p-0 print:mb-4">
              <h3 className="font-bold text-rose-900 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path className="fill-amber-500" d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 2.19l7 3.11V11c0 4.52-2.98 8.69-7 9.93-4.02-1.24-7-5.41-7-9.93V6.3l7-3.11z" />
                  <g transform="translate(3.6, 3.6) scale(0.7)">
                    <path className="fill-rose-900" d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                  </g>
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
            <Card className="print:hidden">
              <h3 className="font-bold text-rose-900 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path className="fill-rose-900" d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2ZM6 20V4H13V9H18V20H6Z" />
                  <path className="fill-amber-500" d="M16 11.5L11.5 16L8.5 13L9.5 12L11.5 14L15 10.5L16 11.5Z" />
                </svg>
                Dokumen yang Diupload
              </h3>

              {dokumenWithSignedUrl.length === 0 ? (
                <p className="text-sm text-slate-400 italic">Belum ada dokumen yang diupload.</p>
              ) : (
                <div className="space-y-2">
                  {dokumenWithSignedUrl.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center">
                          <svg className="w-4 h-4 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                        href={doc.signedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-medium text-rose-600 hover:text-rose-800 transition-colors flex items-center gap-1"
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
            <Card className="bg-slate-50 border-slate-200 print:hidden">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-slate-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="text-sm font-semibold text-slate-800">Informasi Status</p>
                  <ul className="text-xs text-slate-600 mt-1 space-y-1">
                    <li>🟡 <strong>Menunggu Verifikasi</strong> — berkas sedang ditinjau oleh panitia</li>
                    <li>🔵 <strong>Diverifikasi</strong> — berkas sudah diverifikasi, menunggu hasil seleksi</li>
                    <li>🟢 <strong>Diterima</strong> — selamat! kamu diterima di SMK Widya Utama</li>
                    <li>🔴 <strong>Ditolak</strong> — hubungi panitia untuk informasi lebih lanjut</li>
                  </ul>
                </div>
              </div>
            </Card>

            {/* Tombol Aksi Mobile-Optimized */}
            <div className="mt-8 flex justify-end print:hidden">
              <div className="w-full sm:w-auto [&>button]:w-full">
                <PrintButton />
              </div>
            </div>

            {/* Print Signature */}
            <div className="hidden print:flex justify-end mt-12 pt-8">
              <div className="text-center">
                <p className="text-sm text-slate-600 mb-20">Panitia SPMB {tahunSingkat}</p>
                <p className="text-sm font-bold text-slate-800 border-b border-slate-800 inline-block px-4">Admin SPMB</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
