import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Card } from '@/components/ui/Card';
import { StatusUpdateForm } from '@/components/admin/StatusUpdateForm';
import { JENIS_DOKUMEN_LABEL } from '@/types';
import type { Pendaftar, Jurusan, DokumenPendaftar } from '@/types';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Detail Pendaftar' };

type PendaftarDetail = Pendaftar & { jurusan: Jurusan | null };

/**
 * Halaman Detail Pendaftar (/admin/pendaftar/[id]).
 * Server Component — fetch data lengkap + generate signed URL untuk tiap dokumen.
 */
export default async function AdminPendaftarDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch data pendaftar lengkap + join jurusan
  const { data: pendaftar } = await supabase
    .from('pendaftar')
    .select('*, jurusan:jurusan_id(*)')
    .eq('id', id)
    .maybeSingle() as { data: PendaftarDetail | null };

  if (!pendaftar) notFound();

  // Fetch dokumen yang diupload
  const { data: dokumenList } = await supabase
    .from('dokumen_pendaftar')
    .select('*')
    .eq('pendaftar_id', id)
    .order('uploaded_at') as { data: DokumenPendaftar[] | null };

  // Generate signed URL (1 jam) untuk setiap dokumen di bucket private
  const dokumenWithSignedUrl = await Promise.all(
    (dokumenList ?? []).map(async (doc) => {
      // Ekstrak path dari URL yang disimpan atau gunakan path standar
      // Path format: {user_id}/{jenis_dokumen}.{ext}
      const urlObj = new URL(doc.file_url);
      const pathParts = urlObj.pathname.split('/object/sign/dokumen-pendaftaran/');
      let storagePath = '';

      if (pathParts.length > 1) {
        // URL sudah berupa signed URL — ambil path dari URL lama
        storagePath = decodeURIComponent(pathParts[1].split('?')[0]);
      } else {
        // Fallback: coba ekstrak dari URL public
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

  const formatTanggal = (d: string, withTime = false) => {
    const opts: Intl.DateTimeFormatOptions = {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    };
    if (withTime) {
      opts.hour = '2-digit';
      opts.minute = '2-digit';
    }
    return new Date(d).toLocaleDateString('id-ID', opts);
  };

  const InfoRow = ({ label, value }: { label: string; value: string }) => (
    <div>
      <p className="text-xs text-slate-400 mb-0.5">{label}</p>
      <p className="font-medium text-slate-800 text-sm">{value}</p>
    </div>
  );

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-slate-400">
        <Link href="/admin" className="hover:text-blue-700 transition-colors">
          Dashboard
        </Link>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <Link href="/admin/pendaftar" className="hover:text-blue-700 transition-colors">
          Data Pendaftar
        </Link>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-slate-600 font-medium">{pendaftar.nama_lengkap}</span>
      </nav>

      {/* Page Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-800">{pendaftar.nama_lengkap}</h2>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="font-mono text-sm font-semibold text-blue-800 bg-blue-50 px-2.5 py-0.5 rounded-lg">
              {pendaftar.nomor_pendaftaran}
            </span>
            <StatusBadge status={pendaftar.status} />
          </div>
        </div>
        <Link
          href="/admin/pendaftar"
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Kembali ke Daftar
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ===== Kolom Kiri: Data Lengkap ===== */}
        <div className="lg:col-span-2 space-y-5">
          {/* Data Diri */}
          <Card>
            <h3 className="font-bold text-blue-900 mb-5 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Data Diri Calon Siswa
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoRow label="Nama Lengkap" value={pendaftar.nama_lengkap} />
              <InfoRow label="NISN" value={pendaftar.nisn} />
              <InfoRow label="Jenis Kelamin" value={pendaftar.jenis_kelamin} />
              <InfoRow
                label="Tempat, Tanggal Lahir"
                value={`${pendaftar.tempat_lahir}, ${formatTanggal(pendaftar.tanggal_lahir)}`}
              />
              <InfoRow label="No. HP" value={pendaftar.no_hp} />
              <InfoRow label="Jurusan Pilihan" value={pendaftar.jurusan?.nama_jurusan ?? '-'} />
              <div className="sm:col-span-2">
                <InfoRow label="Alamat" value={pendaftar.alamat} />
              </div>
            </div>
          </Card>

          {/* Data Orang Tua */}
          <Card>
            <h3 className="font-bold text-blue-900 mb-5 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Data Orang Tua / Wali
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoRow label="Nama Orang Tua / Wali" value={pendaftar.nama_orang_tua} />
              <InfoRow label="No. HP Orang Tua / Wali" value={pendaftar.no_hp_orang_tua} />
              <InfoRow label="Asal Sekolah" value={pendaftar.asal_sekolah} />
              <InfoRow
                label="Tanggal Pendaftaran"
                value={formatTanggal(pendaftar.created_at, true)}
              />
            </div>
          </Card>

          {/* Dokumen */}
          <Card>
            <h3 className="font-bold text-blue-900 mb-5 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Dokumen Pendukung
            </h3>

            {dokumenWithSignedUrl.length === 0 ? (
              <p className="text-sm text-slate-400 italic">Belum ada dokumen yang diupload.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {dokumenWithSignedUrl.map((doc) => {
                  const ext = doc.file_url.split('.').pop()?.split('?')[0]?.toLowerCase() ?? '';
                  const isImage = ['jpg', 'jpeg', 'png'].includes(ext);

                  return (
                    <a
                      key={doc.id}
                      href={doc.signedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center gap-3 p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-blue-50 hover:border-blue-200 transition-all"
                    >
                      {/* Icon */}
                      <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center flex-shrink-0 group-hover:border-blue-300 transition-colors">
                        {isImage ? (
                          <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-700 group-hover:text-blue-800 transition-colors">
                          {JENIS_DOKUMEN_LABEL[doc.jenis_dokumen]}
                        </p>
                        <p className="text-xs text-slate-400 uppercase">{ext}</p>
                      </div>

                      {/* Arrow */}
                      <svg
                        className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* ===== Kolom Kanan: Update Status ===== */}
        <div className="lg:col-span-1">
          <div className="sticky top-6">
            <Card>
              <h3 className="font-bold text-blue-900 mb-5 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Update Status
              </h3>
              <StatusUpdateForm
                pendaftarId={pendaftar.id}
                currentStatus={pendaftar.status}
              />
            </Card>

            {/* Info tambahan */}
            <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-500 space-y-1">
              <p className="font-semibold text-slate-600">Informasi</p>
              <p>ID: <span className="font-mono text-xs break-all">{pendaftar.id}</span></p>
              <p>User ID: <span className="font-mono text-xs break-all">{pendaftar.user_id}</span></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
