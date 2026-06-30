import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Card } from '@/components/ui/Card';
import { StatusUpdateForm } from '@/components/admin/StatusUpdateForm';
import { PrintButton } from '@/components/admin/PrintButton';
import { JENIS_DOKUMEN_LABEL } from '@/types';
import type { Pendaftar, Jurusan, DokumenPendaftar } from '@/types';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Detail Pendaftar - SPMB SMK Widya Utama' };

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

  // Fetch pengaturan sistem untuk cetak surat
  const { data: pengaturan } = await supabase
    .from('pengaturan_sistem')
    .select('*')
    .eq('id', 1)
    .single();

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
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page { size: A4; margin: 0; }
          body { 
            padding: 15mm 20mm;
            background-color: #fff;
          }
        }
      `}} />
      <div className="space-y-6 max-w-4xl print:hidden">
        {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-slate-400">
        <Link href="/admin" className="hover:text-rose-700 transition-colors">
          Dashboard
        </Link>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <Link href="/admin/pendaftar" className="hover:text-rose-700 transition-colors">
          Data Pendaftar
        </Link>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-slate-600 font-medium">{pendaftar.nama_lengkap}</span>
      </nav>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">{pendaftar.nama_lengkap}</h2>
          <div className="flex items-center gap-3 mt-2">
            <span className="font-mono text-sm font-semibold text-rose-800 bg-rose-50 px-2.5 py-0.5 rounded-lg">
              {pendaftar.nomor_pendaftaran}
            </span>
            <StatusBadge status={pendaftar.status} />
          </div>
        </div>
        <div className="flex items-center gap-4">
          {pendaftar.status === 'Diterima' && <PrintButton />}
          <Link
            href="/admin/pendaftar"
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-rose-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Kembali ke Daftar
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ===== Kolom Kiri: Data Lengkap ===== */}
        <div className="lg:col-span-2 space-y-5">
          {/* Data Diri */}
          <Card className="p-6 sm:p-8 border-slate-100 shadow-sm">
            <h3 className="font-extrabold text-rose-900 mb-6 flex items-center gap-2 text-lg">
              <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path className="fill-rose-900" d="M12 3L1 9L5 11.18V17C5 17 8.5 21 12 21C15.5 21 19 17 19 17V11.18L21 10.09V17H23V9L12 3ZM12 14C9.79 14 8 12.21 8 10C8 7.79 9.79 6 12 6C14.21 6 16 7.79 16 10C16 12.21 14.21 14 12 14Z" />
                <path className="fill-amber-500" d="M12 12C12 12 10 14 10 15.5C10 16.88 10.9 18 12 18C13.1 18 14 16.88 14 15.5C14 14 12 12 12 12Z" />
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
          <Card className="p-6 sm:p-8 border-slate-100 shadow-sm mt-6">
            <h3 className="font-extrabold text-rose-900 mb-6 flex items-center gap-2 text-lg">
              <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path className="fill-amber-500" d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 2.19l7 3.11V11c0 4.52-2.98 8.69-7 9.93-4.02-1.24-7-5.41-7-9.93V6.3l7-3.11z" />
                <g transform="translate(3.6, 3.6) scale(0.7)">
                  <path className="fill-rose-900" d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                </g>
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
          <Card className="p-6 sm:p-8 border-slate-100 shadow-sm mt-6">
            <h3 className="font-extrabold text-rose-900 mb-6 flex items-center gap-2 text-lg">
              <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path className="fill-rose-900" d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2ZM6 20V4H13V9H18V20H6Z" />
                <path className="fill-amber-500" d="M16 11.5L11.5 16L8.5 13L9.5 12L11.5 14L15 10.5L16 11.5Z" />
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
                      className="group flex items-center gap-4 p-4 rounded-2xl border border-slate-100 bg-white hover:bg-rose-50/50 hover:border-rose-200 hover:shadow-sm transition-all"
                    >
                      {/* Icon */}
                      <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center flex-shrink-0 group-hover:bg-rose-100 group-hover:border-rose-200 transition-colors">
                        {isImage ? (
                          <svg className="w-6 h-6 text-rose-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        ) : (
                          <svg className="w-6 h-6 text-rose-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-rose-950 group-hover:text-rose-800 transition-colors truncate">
                          {JENIS_DOKUMEN_LABEL[doc.jenis_dokumen] || 'Dokumen'}
                        </p>
                        <p className="text-[11px] font-medium text-slate-400 mt-0.5 truncate">
                          Klik untuk membuka/meninjau berkas
                        </p>
                      </div>

                      {/* Arrow */}
                      <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center flex-shrink-0 group-hover:bg-rose-900 transition-colors">
                        <svg
                          className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </div>
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
            <Card className="p-6 border-slate-100 shadow-sm">
              <h3 className="font-extrabold text-rose-900 mb-5 flex items-center gap-2 text-lg">
                <svg className="w-5 h-5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Update Status
              </h3>
              <StatusUpdateForm
                pendaftarId={pendaftar.id}
                currentStatus={pendaftar.status}
              />
            </Card>

            </div>
          </div>
        </div>
      </div>

      {/* ===== PRINT LAYOUT (SURAT KELULUSAN RESMI) ===== */}
      <div className="hidden print:block bg-white text-black font-serif w-full max-w-[210mm] mx-auto min-h-[297mm] p-10">
        {/* KOP SURAT */}
        <div className="flex items-center gap-4 mb-3">
          <div className="w-20 h-20 rounded-full border-2 border-amber-500 bg-white flex-shrink-0 flex items-center justify-center overflow-hidden">
            {/* Fallback jika image gagal load saat print, biarkan kosong agar logo fallback terlihat */}
            <img src="/images/logo_wu.png" alt="Logo Sekolah" className="w-full h-full object-cover" />
          </div>
          <div className="text-center flex-1">
            <h1 className="text-lg font-bold uppercase tracking-widest text-slate-800">YAYASAN PENDIDIKAN WIDYA UTAMA</h1>
            <h2 className="text-2xl font-black uppercase text-rose-950 mt-0.5">SMK WIDYA UTAMA</h2>
            <p className="text-xs font-semibold tracking-widest text-slate-600 mt-0.5">TERAKREDITASI "A"</p>
            <p className="text-[11px] text-slate-500 mt-0.5">{pengaturan?.alamat_sekolah || 'Jl. Pendidikan No. 123, Kota Pendidikan, Provinsi 40123'}</p>
            <p className="text-[11px] text-slate-500">Telp: {pengaturan?.no_hp_sekolah || '(021) 1234567'} | Email: {pengaturan?.email_sekolah || 'info@smkwidyautama.sch.id'} | Website: www.smkwidyautama.sch.id</p>
          </div>
        </div>
        
        {/* Garis Kop */}
        <div className="border-b-[3px] border-rose-950 mb-0.5"></div>
        <div className="border-b-[1px] border-amber-500 mb-4"></div>

        {/* Nomor Surat & Tanggal */}
        <div className="flex justify-between items-start text-sm mb-4">
          <div>
            <p>Nomor<span className="inline-block w-8 text-center">:</span>421.5/SPMB/{pendaftar.id}/2026</p>
            <p>Lampiran<span className="inline-block w-5 text-center">:</span>-</p>
            <p>Perihal<span className="inline-block w-8 text-center">:</span><strong>Pemberitahuan Kelulusan Seleksi</strong></p>
          </div>
          <div>
            <p>{formatTanggal(new Date().toISOString())}</p>
          </div>
        </div>

        {/* Tujuan */}
        <div className="text-sm mb-5">
          <p>Kepada Yth.,</p>
          <p>Orang Tua/Wali dari <strong>{pendaftar.nama_lengkap}</strong></p>
          <p>di Tempat</p>
        </div>

        {/* Isi Surat */}
        <div className="text-sm leading-relaxed text-justify mb-4">
          <p>Dengan hormat,</p>
          <p className="mt-1">
            Berdasarkan hasil seleksi Penerimaan Murid Baru (SPMB) SMK Widya Utama Tahun Ajaran {pengaturan?.tahun_periode?.split('/')[0] || '2026'}/{parseInt(pengaturan?.tahun_periode?.split('/')[0] || '2026')+1}, 
            dengan ini kami memberitahukan bahwa calon peserta didik berikut:
          </p>
        </div>

        {/* Tabel Data Siswa */}
        <div className="px-8 mb-4">
          <table className="w-full text-sm">
            <tbody>
              <tr>
                <td className="py-0.5 w-48 font-semibold">Nomor Pendaftaran</td>
                <td className="py-0.5 w-4">:</td>
                <td className="py-0.5">{pendaftar.nomor_pendaftaran}</td>
              </tr>
              <tr>
                <td className="py-0.5 font-semibold">Nama Lengkap</td>
                <td className="py-0.5">:</td>
                <td className="py-0.5 font-bold">{pendaftar.nama_lengkap}</td>
              </tr>
              <tr>
                <td className="py-0.5 font-semibold">NISN</td>
                <td className="py-0.5">:</td>
                <td className="py-0.5">{pendaftar.nisn}</td>
              </tr>
              <tr>
                <td className="py-0.5 font-semibold">Asal Sekolah</td>
                <td className="py-0.5">:</td>
                <td className="py-0.5">{pendaftar.asal_sekolah}</td>
              </tr>
              <tr>
                <td className="py-0.5 font-semibold">Program Keahlian</td>
                <td className="py-0.5">:</td>
                <td className="py-0.5 font-bold text-rose-950">{pendaftar.jurusan?.nama_jurusan}</td>
              </tr>
              <tr>
                <td className="py-0.5 font-semibold">Status Seleksi</td>
                <td className="py-0.5">:</td>
                <td className="py-0.5 font-bold text-green-700 uppercase">{pendaftar.status}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Paragraf Penutup & Boks Instruksi */}
        <div className="text-sm leading-relaxed text-justify mb-4">
          <p>
            Dinyatakan <strong>LULUS SELEKSI</strong> dan berhak untuk melanjutkan ke tahap daftar ulang. 
            Kami mengucapkan selamat atas keberhasilan yang telah dicapai.
          </p>
          
          <div className="mt-4 p-2.5 border-2 border-amber-500 bg-amber-50 rounded-lg text-xs">
            <h3 className="font-bold text-rose-950 mb-1 underline">INSTRUKSI DAFTAR ULANG:</h3>
            <ol className="list-decimal list-inside space-y-0.5 text-slate-800">
              <li>Membawa surat keterangan lulus ini sebagai bukti sah.</li>
              <li>Membawa dokumen asli (KK, Akta Kelahiran, Ijazah/SKL).</li>
              <li>Melakukan administrasi daftar ulang paling lambat 7 hari sejak tanggal surat ini dicetak.</li>
            </ol>
          </div>
          
          <p className="mt-4">
            Demikian surat pemberitahuan ini kami sampaikan. Atas perhatian dan kerjasamanya kami ucapkan terima kasih.
          </p>
        </div>

      </div>
    </>
  );
}
