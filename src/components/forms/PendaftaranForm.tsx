'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { FileUploadField } from '@/components/ui/FileUploadField';
import type { Jurusan } from '@/types';

// ============================================================
// Helper: Section Header
// ============================================================
const SectionHeader = ({
  number,
  title,
  subtitle,
}: {
  number: number;
  title: string;
  subtitle?: string;
}) => (
  <div className="flex items-center gap-4 mb-7 pb-4 border-b border-slate-200">
    <div className="w-9 h-9 rounded-xl bg-rose-900 text-white flex items-center justify-center text-sm font-extrabold flex-shrink-0 shadow-sm">
      {number}
    </div>
    <div>
      <h3 className="font-bold text-rose-900 text-base">{title}</h3>
      {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
    </div>
  </div>
);

// ============================================================
// Helper: Field dengan ikon kiri
// ============================================================
const IconInput = ({
  icon,
  label,
  required,
  error,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) => (
  <div className="flex flex-col gap-1">
    <label className="text-sm font-semibold text-slate-700">
      {label}
      {required && <span className="text-rose-500 ml-0.5">*</span>}
    </label>
    <div className="relative">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
        {icon}
      </div>
      {children}
    </div>
    {error && <p className="text-xs text-red-500">{error}</p>}
  </div>
);

const inputCls = (hasError?: string) =>
  `w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm outline-none transition-all duration-150 bg-white
  ${hasError
    ? 'border-red-300 focus:ring-2 focus:ring-red-300 focus:border-red-400'
    : 'border-slate-200 focus:ring-2 focus:ring-rose-300 focus:border-rose-400'
  }`;

const selectCls = (hasError?: string) =>
  `w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm outline-none transition-all duration-150 bg-white appearance-none
  ${hasError
    ? 'border-red-300 focus:ring-2 focus:ring-red-300 focus:border-red-400'
    : 'border-slate-200 focus:ring-2 focus:ring-rose-300 focus:border-rose-400'
  }`;

// ============================================================
// SVG Icons inline (tanpa dependensi lucide-react)
// ============================================================
const I = {
  user: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
  phone: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>,
  calendar: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
  map: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  globe: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  star: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>,
  home: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
  car: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l2 1m0-11h8m0 0l2 4H3" /></svg>,
  briefcase: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
  cash: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  heart: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>,
  school: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 14l9-5-9-5-9 5 9 5z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /></svg>,
  id: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2" /></svg>,
  chat: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>,
  users: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
  activity: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
  book: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>,
  doc: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
};

// ============================================================
// Zod Schema
// ============================================================
const pendaftaranSchema = z.object({
  // Section 1 — Pilihan Jurusan
  jurusan_id: z.string().min(1, 'Pilih program keahlian'),

  // Section 2 — Data Diri
  nama_lengkap: z.string().min(2, 'Nama lengkap minimal 2 karakter'),
  nama_panggilan: z.string().optional(),
  no_whatsapp: z
    .string()
    .min(10, 'Nomor WA minimal 10 digit')
    .max(15, 'Nomor WA maksimal 15 digit')
    .regex(/^[0-9+\-\s]+$/, 'Format nomor tidak valid'),
  jenis_kelamin: z.enum(['Laki-laki', 'Perempuan'], {
    error: 'Pilih jenis kelamin',
  }),
  tempat_lahir: z.string().min(2, 'Tempat lahir wajib diisi'),
  tanggal_lahir: z.string().min(1, 'Tanggal lahir wajib diisi'),
  agama: z.string().min(1, 'Pilih agama'),
  kewarganegaraan: z.string().min(1, 'Kewarganegaraan wajib diisi'),

  // Section 3 — Keluarga & Domisili
  anak_ke: z.coerce.number().min(1, 'Anak ke wajib diisi').optional(),
  jumlah_saudara: z.coerce.number().min(0).optional(),
  bahasa_sehari_hari: z.string().optional(),
  nama_orang_tua: z.string().min(2, 'Nama orang tua wajib diisi'),
  no_hp_orang_tua: z
    .string()
    .min(10, 'Nomor HP orang tua minimal 10 digit')
    .max(15, 'Maksimal 15 digit')
    .regex(/^[0-9+\-\s]+$/, 'Format nomor tidak valid'),
  pekerjaan_orang_tua: z.string().optional(),
  penghasilan_orang_tua: z.string().optional(),
  alamat: z.string().min(10, 'Alamat minimal 10 karakter'),
  tinggal_bersama: z.string().optional(),
  jarak_ke_sekolah: z.string().optional(),
  transportasi: z.string().optional(),

  // Section 4 — Kesehatan
  berat_kg: z.coerce.number().min(1, 'Berat badan wajib diisi').optional(),
  tinggi_cm: z.coerce.number().min(1, 'Tinggi badan wajib diisi').optional(),
  gol_darah: z.string().optional(),
  riwayat_penyakit: z.string().optional(),
  kelainan_jasmani: z.string().optional(),

  // Section 5 — Asal Sekolah
  asal_sekolah: z.string().min(3, 'Nama sekolah asal wajib diisi'),
  nisn: z
    .string()
    .length(10, 'NISN harus tepat 10 digit')
    .regex(/^\d+$/, 'NISN hanya boleh berisi angka'),
  alamat_sekolah_asal: z.string().optional(),
});

type PendaftaranFormData = z.infer<typeof pendaftaranSchema>;

interface PendaftaranFormProps {
  jurusanList: Jurusan[];
  userId: string;
  userEmail: string;
}

// ============================================================
// Main Component
// ============================================================
export function PendaftaranForm({ jurusanList, userId, userEmail }: PendaftaranFormProps) {
  const router = useRouter();
  const supabase = createClient();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStep, setSubmitStep] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [files, setFiles] = useState<{
    kk: File | null;
    akta_lahir: File | null;
    ijazah_skl: File | null;
    pas_foto: File | null;
  }>({ kk: null, akta_lahir: null, ijazah_skl: null, pas_foto: null });

  const [fileErrors, setFileErrors] = useState<{
    kk?: string;
    akta_lahir?: string;
    ijazah_skl?: string;
    pas_foto?: string;
  }>({});

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PendaftaranFormData>({
    resolver: zodResolver(pendaftaranSchema) as any,
    defaultValues: {
      kewarganegaraan: 'Indonesia',
      jenis_kelamin: undefined,
      jurusan_id: '',
    },
  });



  // ============================================================
  // Upload file ke Storage
  // ============================================================
  const uploadFile = async (file: File, jenisDokumen: string): Promise<string> => {
    const ext = file.name.split('.').pop();
    const path = `${userId}/${jenisDokumen}.${ext}`;

    const { error } = await supabase.storage
      .from('dokumen-pendaftaran')
      .upload(path, file, { upsert: true });

    if (error) throw new Error(`Gagal upload ${jenisDokumen}: ${error.message}`);

    const { data: urlData } = await supabase.storage
      .from('dokumen-pendaftaran')
      .createSignedUrl(path, 60 * 60 * 24 * 365);

    if (!urlData?.signedUrl) throw new Error(`Gagal mendapatkan URL untuk ${jenisDokumen}`);
    return urlData.signedUrl;
  };

  const validateFiles = (): boolean => {
    const newErrors: typeof fileErrors = {};
    if (!files.kk) newErrors.kk = 'Kartu Keluarga wajib diupload';
    if (!files.akta_lahir) newErrors.akta_lahir = 'Akta Lahir wajib diupload';
    if (!files.ijazah_skl) newErrors.ijazah_skl = 'Ijazah / SKL wajib diupload';
    if (!files.pas_foto) newErrors.pas_foto = 'Pas Foto wajib diupload';
    setFileErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ============================================================
  // Submit handler
  // ============================================================
  const onSubmit = async (data: PendaftaranFormData) => {
    if (!validateFiles()) return;
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      setSubmitStep('Menyimpan data pendaftaran...');
      const { data: pendaftarData, error: insertError } = await supabase
        .from('pendaftar')
        .insert({
          user_id: userId,
          // Section 2 — Data Diri
          nama_lengkap: data.nama_lengkap,
          nama_panggilan: data.nama_panggilan || null,
          no_whatsapp: data.no_whatsapp,
          jenis_kelamin: data.jenis_kelamin,
          tempat_lahir: data.tempat_lahir,
          tanggal_lahir: data.tanggal_lahir,
          agama: data.agama,
          kewarganegaraan: data.kewarganegaraan,
          // Section 3 — Keluarga & Domisili
          anak_ke: data.anak_ke || null,
          jumlah_saudara: data.jumlah_saudara ?? null,
          bahasa_sehari_hari: data.bahasa_sehari_hari || null,
          nama_orang_tua: data.nama_orang_tua,
          no_hp_orang_tua: data.no_hp_orang_tua,
          pekerjaan_orang_tua: data.pekerjaan_orang_tua || null,
          penghasilan_orang_tua: data.penghasilan_orang_tua || null,
          alamat: data.alamat,
          tinggal_bersama: data.tinggal_bersama || null,
          jarak_ke_sekolah: data.jarak_ke_sekolah || null,
          transportasi: data.transportasi || null,
          // Section 4 — Kesehatan
          berat_kg: data.berat_kg || null,
          tinggi_cm: data.tinggi_cm || null,
          gol_darah: data.gol_darah || null,
          riwayat_penyakit: data.riwayat_penyakit || null,
          kelainan_jasmani: data.kelainan_jasmani || null,
          // Section 5 — Asal Sekolah
          asal_sekolah: data.asal_sekolah,
          nisn: data.nisn,
          alamat_sekolah_asal: data.alamat_sekolah_asal || null,
          // Jurusan & Status
          jurusan_id: data.jurusan_id,
          status: 'Menunggu Verifikasi',
        })
        .select('id, nomor_pendaftaran')
        .single();

      if (insertError) throw new Error(`Gagal menyimpan data: ${insertError.message}`);
      const pendaftarId = pendaftarData.id;

      // Upload dokumen
      const dokumenEntries = [
        { key: 'kk' as const, file: files.kk! },
        { key: 'akta_lahir' as const, file: files.akta_lahir! },
        { key: 'ijazah_skl' as const, file: files.ijazah_skl! },
        { key: 'pas_foto' as const, file: files.pas_foto! },
      ];

      for (const { key, file } of dokumenEntries) {
        setSubmitStep(`Mengupload ${key.replace(/_/g, ' ')}...`);
        const fileUrl = await uploadFile(file, key);
        const { error: docError } = await supabase
          .from('dokumen_pendaftar')
          .insert({ pendaftar_id: pendaftarId, jenis_dokumen: key, file_url: fileUrl });
        if (docError) throw new Error(`Gagal menyimpan dokumen ${key}: ${docError.message}`);
      }

      setSubmitStep('Pendaftaran berhasil! Mengalihkan...');
      router.push(`/status?success=1&nomor=${encodeURIComponent(pendaftarData.nomor_pendaftaran)}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Terjadi kesalahan tidak dikenal';
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
      setSubmitStep('');
    }
  };

  const jurusanOptions = jurusanList.map((j) => ({ value: j.id, label: j.nama_jurusan }));

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">

      {/* ===== SECTION 1: PILIHAN PROGRAM KEAHLIAN ===== */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-8">
        <SectionHeader
          number={1}
          title="Pilihan Program Keahlian"
          subtitle="Pilih satu program keahlian yang kamu minati"
        />
        
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-4">
            Program Keahlian <span className="text-rose-500">*</span>
          </label>
          <Controller
            name="jurusan_id"
            control={control}
            render={({ field: { onChange, value } }) => (
              <div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {jurusanOptions.map((opt) => {
                    const isSelected = value === opt.value;
                    let iconSvg = null;
                    let colorCls = '';
                    
                    if (opt.label.toLowerCase().includes('perhotelan')) {
                      iconSvg = <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />;
                      colorCls = 'text-rose-600 bg-rose-50 border-rose-200 ring-rose-500';
                    } else if (opt.label.toLowerCase().includes('boga')) {
                      iconSvg = <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />;
                      colorCls = 'text-amber-600 bg-amber-50 border-amber-200 ring-amber-500';
                    } else if (opt.label.toLowerCase().includes('akuntansi') || opt.label.toLowerCase().includes('bank')) {
                      iconSvg = <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />;
                      colorCls = 'text-slate-700 bg-slate-100 border-slate-300 ring-slate-700';
                    } else if (opt.label.toLowerCase().includes('pariwisata')) {
                      iconSvg = <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />;
                      colorCls = 'text-emerald-600 bg-emerald-50 border-emerald-200 ring-emerald-500';
                    } else {
                      iconSvg = <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />;
                      colorCls = 'text-blue-600 bg-blue-50 border-blue-200 ring-blue-500';
                    }

                    return (
                      <label 
                        key={opt.value} 
                        className={`relative flex items-center p-4 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${
                          isSelected 
                            ? `border-transparent ring-2 ${colorCls} shadow-md scale-[1.02]` 
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 hover:scale-[1.01]'
                        }`}
                      >
                        <input 
                          type="radio" 
                          name="jurusan_id" 
                          value={opt.value} 
                          checked={isSelected} 
                          onChange={() => onChange(opt.value)}
                          className="sr-only" 
                        />
                        <div className={`w-12 h-12 flex-shrink-0 rounded-full flex items-center justify-center mr-4 transition-colors ${isSelected ? 'bg-white shadow-sm text-inherit' : 'bg-slate-100 text-slate-400'}`}>
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {iconSvg}
                          </svg>
                        </div>
                        <div className="flex-grow">
                          <span className={`block font-extrabold text-base ${isSelected ? 'text-slate-900' : 'text-slate-700'}`}>
                            {opt.label}
                          </span>
                        </div>
                        {isSelected && (
                          <div className={`absolute top-4 right-4 ${colorCls.split(' ')[0]}`}>
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </label>
                    );
                  })}
                </div>
                {errors.jurusan_id?.message && (
                  <p className="mt-3 text-sm text-rose-500 flex items-center font-medium bg-rose-50 p-2.5 rounded-lg border border-rose-100">
                    <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                    {errors.jurusan_id.message}
                  </p>
                )}
              </div>
            )}
          />
        </div>
      </div>

      {/* ===== SECTION 2: DATA DIRI CALON SISWA ===== */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-8">
        <SectionHeader
          number={2}
          title="Data Diri Calon Siswa"
          subtitle="Isi sesuai dokumen resmi (akta lahir / kartu keluarga)"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

          {/* Nama Lengkap */}
          <div className="sm:col-span-2">
            <IconInput icon={I.user} label="Nama Lengkap" required error={errors.nama_lengkap?.message}>
              <input
                {...register('nama_lengkap')}
                id="nama_lengkap"
                placeholder="Sesuai akta kelahiran"
                className={inputCls(errors.nama_lengkap?.message)}
              />
            </IconInput>
          </div>

          {/* Nama Panggilan */}
          <IconInput icon={I.star} label="Nama Panggilan" error={errors.nama_panggilan?.message}>
            <input
              {...register('nama_panggilan')}
              id="nama_panggilan"
              placeholder="Nama sehari-hari"
              className={inputCls(errors.nama_panggilan?.message)}
            />
          </IconInput>

          {/* No WhatsApp */}
          <IconInput icon={I.phone} label="No. WhatsApp Siswa" required error={errors.no_whatsapp?.message}>
            <input
              {...register('no_whatsapp')}
              id="no_whatsapp"
              placeholder="08xxxxxxxxxx"
              type="tel"
              className={inputCls(errors.no_whatsapp?.message)}
            />
          </IconInput>

          {/* Jenis Kelamin */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-slate-700">
              Jenis Kelamin <span className="text-rose-500">*</span>
            </label>
            <div className="flex gap-4 pt-2">
              {(['Laki-laki', 'Perempuan'] as const).map((jk) => (
                <label key={jk} className="flex items-center gap-2 cursor-pointer">
                  <Controller
                    name="jenis_kelamin"
                    control={control}
                    render={({ field }) => (
                      <input
                        type="radio"
                        value={jk}
                        checked={field.value === jk}
                        onChange={() => field.onChange(jk)}
                        className="w-4 h-4 accent-rose-800"
                      />
                    )}
                  />
                  <span className="text-sm text-slate-700">{jk}</span>
                </label>
              ))}
            </div>
            {errors.jenis_kelamin && (
              <p className="text-xs text-red-500">{errors.jenis_kelamin.message}</p>
            )}
          </div>

          {/* Tempat Lahir */}
          <IconInput icon={I.map} label="Tempat Lahir" required error={errors.tempat_lahir?.message}>
            <input
              {...register('tempat_lahir')}
              id="tempat_lahir"
              placeholder="Nama kota/kabupaten"
              className={inputCls(errors.tempat_lahir?.message)}
            />
          </IconInput>

          {/* Tanggal Lahir */}
          <IconInput icon={I.calendar} label="Tanggal Lahir" required error={errors.tanggal_lahir?.message}>
            <input
              {...register('tanggal_lahir')}
              id="tanggal_lahir"
              type="date"
              className={inputCls(errors.tanggal_lahir?.message)}
            />
          </IconInput>

          {/* Agama */}
          <IconInput icon={I.star} label="Agama" required error={errors.agama?.message}>
            <select {...register('agama')} id="agama" className={selectCls(errors.agama?.message)}>
              <option value="">-- Pilih Agama --</option>
              {['Islam', 'Kristen', 'Katolik', 'Hindu', 'Buddha', 'Konghucu'].map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </IconInput>

          {/* Kewarganegaraan */}
          <IconInput icon={I.globe} label="Kewarganegaraan" required error={errors.kewarganegaraan?.message}>
            <input
              {...register('kewarganegaraan')}
              id="kewarganegaraan"
              placeholder="Indonesia"
              className={inputCls(errors.kewarganegaraan?.message)}
            />
          </IconInput>
        </div>
      </div>

      {/* ===== SECTION 3: DATA KELUARGA & DOMISILI ===== */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-8">
        <SectionHeader
          number={3}
          title="Data Keluarga & Domisili"
          subtitle="Informasi keluarga, tempat tinggal, dan transportasi ke sekolah"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

          {/* Anak ke */}
          <IconInput icon={I.users} label="Anak ke-" error={errors.anak_ke?.message}>
            <input
              {...register('anak_ke')}
              id="anak_ke"
              type="number"
              min={1}
              placeholder="Contoh: 1"
              className={inputCls(errors.anak_ke?.message)}
            />
          </IconInput>

          {/* Jumlah Saudara */}
          <IconInput icon={I.users} label="Jumlah Saudara Kandung" error={errors.jumlah_saudara?.message}>
            <input
              {...register('jumlah_saudara')}
              id="jumlah_saudara"
              type="number"
              min={0}
              placeholder="Contoh: 2"
              className={inputCls(errors.jumlah_saudara?.message)}
            />
          </IconInput>

          {/* Bahasa Sehari-hari */}
          <IconInput icon={I.chat} label="Bahasa Sehari-hari" error={errors.bahasa_sehari_hari?.message}>
            <input
              {...register('bahasa_sehari_hari')}
              id="bahasa_sehari_hari"
              placeholder="Contoh: Sunda, Indonesia"
              className={inputCls(errors.bahasa_sehari_hari?.message)}
            />
          </IconInput>

          {/* Nama Orang Tua */}
          <IconInput icon={I.user} label="Nama Orang Tua / Wali" required error={errors.nama_orang_tua?.message}>
            <input
              {...register('nama_orang_tua')}
              id="nama_orang_tua"
              placeholder="Nama lengkap orang tua/wali"
              className={inputCls(errors.nama_orang_tua?.message)}
            />
          </IconInput>

          {/* No HP Orang Tua */}
          <IconInput icon={I.phone} label="No. HP Orang Tua / Wali" required error={errors.no_hp_orang_tua?.message}>
            <input
              {...register('no_hp_orang_tua')}
              id="no_hp_orang_tua"
              type="tel"
              placeholder="08xxxxxxxxxx"
              className={inputCls(errors.no_hp_orang_tua?.message)}
            />
          </IconInput>

          {/* Pekerjaan Orang Tua */}
          <IconInput icon={I.briefcase} label="Pekerjaan Orang Tua" error={errors.pekerjaan_orang_tua?.message}>
            <select {...register('pekerjaan_orang_tua')} id="pekerjaan_orang_tua" className={selectCls(errors.pekerjaan_orang_tua?.message)}>
              <option value="">-- Pilih Pekerjaan --</option>
              {['PNS/ASN', 'TNI/Polri', 'Karyawan Swasta', 'Wiraswasta/Pedagang', 'Petani/Nelayan', 'Buruh', 'Tidak Bekerja', 'Lainnya'].map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </IconInput>

          {/* Penghasilan Orang Tua */}
          <IconInput icon={I.cash} label="Penghasilan Orang Tua (per bulan)" error={errors.penghasilan_orang_tua?.message}>
            <select {...register('penghasilan_orang_tua')} id="penghasilan_orang_tua" className={selectCls(errors.penghasilan_orang_tua?.message)}>
              <option value="">-- Pilih Kisaran --</option>
              {[
                'Di bawah Rp 1.000.000',
                'Rp 1.000.000 – Rp 2.000.000',
                'Rp 2.000.000 – Rp 3.500.000',
                'Rp 3.500.000 – Rp 5.000.000',
                'Di atas Rp 5.000.000',
              ].map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </IconInput>

          {/* Tinggal Bersama */}
          <IconInput icon={I.home} label="Tinggal Bersama" error={errors.tinggal_bersama?.message}>
            <select {...register('tinggal_bersama')} id="tinggal_bersama" className={selectCls(errors.tinggal_bersama?.message)}>
              <option value="">-- Pilih --</option>
              {['Orang Tua', 'Wali', 'Kos / Kontrak', 'Asrama', 'Lainnya'].map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </IconInput>

          {/* Jarak ke Sekolah */}
          <IconInput icon={I.map} label="Jarak ke Sekolah" error={errors.jarak_ke_sekolah?.message}>
            <select {...register('jarak_ke_sekolah')} id="jarak_ke_sekolah" className={selectCls(errors.jarak_ke_sekolah?.message)}>
              <option value="">-- Pilih Jarak --</option>
              {['< 1 km', '1 – 5 km', '5 – 10 km', '10 – 20 km', '> 20 km'].map((j) => (
                <option key={j} value={j}>{j}</option>
              ))}
            </select>
          </IconInput>

          {/* Transportasi */}
          <IconInput icon={I.car} label="Transportasi ke Sekolah" error={errors.transportasi?.message}>
            <select {...register('transportasi')} id="transportasi" className={selectCls(errors.transportasi?.message)}>
              <option value="">-- Pilih Transportasi --</option>
              {['Jalan Kaki', 'Sepeda', 'Sepeda Motor', 'Kendaraan Umum', 'Diantar Orang Tua', 'Lainnya'].map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </IconInput>

          {/* Alamat Lengkap */}
          <div className="sm:col-span-2 flex flex-col gap-1">
            <label className="text-sm font-semibold text-slate-700">
              Alamat Lengkap <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute left-3 top-3 text-slate-400 pointer-events-none">{I.home}</div>
              <textarea
                {...register('alamat')}
                id="alamat"
                rows={3}
                placeholder="Jl. Nama Jalan No. X, RT/RW, Kelurahan, Kecamatan, Kota/Kabupaten"
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm outline-none transition-all duration-150 bg-white resize-none ${errors.alamat?.message ? 'border-red-300 focus:ring-2 focus:ring-red-300' : 'border-slate-200 focus:ring-2 focus:ring-rose-300 focus:border-rose-400'}`}
              />
            </div>
            {errors.alamat && <p className="text-xs text-red-500">{errors.alamat.message}</p>}
          </div>
        </div>
      </div>

      {/* ===== SECTION 4: DATA KESEHATAN ===== */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-8">
        <SectionHeader
          number={4}
          title="Data Kesehatan"
          subtitle="Informasi kondisi fisik dan riwayat kesehatan calon siswa"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

          {/* Berat Badan */}
          <IconInput icon={I.activity} label="Berat Badan (kg)" error={errors.berat_kg?.message}>
            <input
              {...register('berat_kg')}
              id="berat_kg"
              type="number"
              min={1}
              placeholder="Contoh: 55"
              className={inputCls(errors.berat_kg?.message)}
            />
          </IconInput>

          {/* Tinggi Badan */}
          <IconInput icon={I.activity} label="Tinggi Badan (cm)" error={errors.tinggi_cm?.message}>
            <input
              {...register('tinggi_cm')}
              id="tinggi_cm"
              type="number"
              min={1}
              placeholder="Contoh: 165"
              className={inputCls(errors.tinggi_cm?.message)}
            />
          </IconInput>

          {/* Golongan Darah */}
          <IconInput icon={I.heart} label="Golongan Darah" error={errors.gol_darah?.message}>
            <select {...register('gol_darah')} id="gol_darah" className={selectCls(errors.gol_darah?.message)}>
              <option value="">-- Pilih --</option>
              {['A', 'B', 'AB', 'O', 'Tidak Tahu'].map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </IconInput>

          {/* Riwayat Penyakit */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-slate-700">
              Riwayat Penyakit <span className="text-slate-400 text-xs font-normal">(opsional)</span>
            </label>
            <div className="relative">
              <div className="absolute left-3 top-3 text-slate-400 pointer-events-none">{I.doc}</div>
              <textarea
                {...register('riwayat_penyakit')}
                id="riwayat_penyakit"
                rows={2}
                placeholder="Contoh: Asma, Diabetes, dll. Kosongkan jika tidak ada."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none transition-all focus:ring-2 focus:ring-rose-300 focus:border-rose-400 bg-white resize-none"
              />
            </div>
          </div>

          {/* Kelainan Jasmani */}
          <div className="sm:col-span-2 flex flex-col gap-1">
            <label className="text-sm font-semibold text-slate-700">
              Kelainan Jasmani <span className="text-slate-400 text-xs font-normal">(opsional)</span>
            </label>
            <div className="relative">
              <div className="absolute left-3 top-3 text-slate-400 pointer-events-none">{I.doc}</div>
              <textarea
                {...register('kelainan_jasmani')}
                id="kelainan_jasmani"
                rows={2}
                placeholder="Contoh: Buta warna, gangguan pendengaran, dll. Kosongkan jika tidak ada."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none transition-all focus:ring-2 focus:ring-rose-300 focus:border-rose-400 bg-white resize-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ===== SECTION 5: ASAL SEKOLAH ===== */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-8">
        <SectionHeader
          number={5}
          title="Asal Sekolah"
          subtitle="Data sekolah SMP/MTs yang kamu tamatkan sebelumnya"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

          {/* Nama Sekolah Asal */}
          {/* Nama Sekolah Asal */}
          <div className="sm:col-span-2">
            <IconInput icon={I.school} label="Nama Sekolah Asal (SMP/MTs)" required error={errors.asal_sekolah?.message}>
              <input
                {...register('asal_sekolah')}
                id="asal_sekolah"
                placeholder="Contoh: SMP Negeri 1 Baleendah"
                className={inputCls(errors.asal_sekolah?.message)}
              />
            </IconInput>
          </div>

          {/* NISN */}
          <IconInput icon={I.id} label="NISN" required error={errors.nisn?.message}>
            <input
              {...register('nisn')}
              id="nisn"
              placeholder="10 digit angka"
              maxLength={10}
              className={inputCls(errors.nisn?.message)}
            />
          </IconInput>

          {/* Alamat Sekolah Asal */}
          <div className="sm:col-span-2 flex flex-col gap-1">
            <label className="text-sm font-semibold text-slate-700">
              Alamat Sekolah Asal <span className="text-slate-400 text-xs font-normal">(opsional)</span>
            </label>
            <div className="relative">
              <div className="absolute left-3 top-3 text-slate-400 pointer-events-none">{I.map}</div>
              <textarea
                {...register('alamat_sekolah_asal')}
                id="alamat_sekolah_asal"
                rows={2}
                placeholder="Alamat lengkap sekolah asal"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none transition-all focus:ring-2 focus:ring-rose-300 focus:border-rose-400 bg-white resize-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ===== SECTION 6: UPLOAD DOKUMEN ===== */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-8">
        <SectionHeader
          number={6}
          title="Upload Dokumen"
          subtitle="Format: PDF, JPG, JPEG, PNG. Maksimal 2MB per file."
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <FileUploadField
            id="doc-kk"
            label="Kartu Keluarga (KK)"
            error={fileErrors.kk}
            onChange={(file) => {
              setFiles((prev) => ({ ...prev, kk: file }));
              if (file) setFileErrors((prev) => ({ ...prev, kk: undefined }));
            }}
            required
          />
          <FileUploadField
            id="doc-akta-lahir"
            label="Akta Lahir"
            error={fileErrors.akta_lahir}
            onChange={(file) => {
              setFiles((prev) => ({ ...prev, akta_lahir: file }));
              if (file) setFileErrors((prev) => ({ ...prev, akta_lahir: undefined }));
            }}
            required
          />
          <FileUploadField
            id="doc-ijazah-skl"
            label="Ijazah / SKL"
            error={fileErrors.ijazah_skl}
            onChange={(file) => {
              setFiles((prev) => ({ ...prev, ijazah_skl: file }));
              if (file) setFileErrors((prev) => ({ ...prev, ijazah_skl: undefined }));
            }}
            required
          />
          <FileUploadField
            id="doc-pas-foto"
            label="Pas Foto (3x4 atau 4x6)"
            error={fileErrors.pas_foto}
            onChange={(file) => {
              setFiles((prev) => ({ ...prev, pas_foto: file }));
              if (file) setFileErrors((prev) => ({ ...prev, pas_foto: undefined }));
            }}
            required
          />
        </div>
      </div>

      {/* ===== SUBMIT AREA ===== */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-8">
        {submitError && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 flex items-start gap-3">
            <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-red-700">Gagal Mendaftar</p>
              <p className="text-xs text-red-500 mt-0.5">{submitError}</p>
            </div>
          </div>
        )}

        {isSubmitting && submitStep && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-100 flex items-center gap-3">
            <svg className="animate-spin w-5 h-5 text-rose-600 flex-shrink-0" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-sm text-rose-700 font-medium">{submitStep}</p>
          </div>
        )}

        <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-100">
          <p className="text-xs text-amber-700 flex items-start gap-2">
            <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            Pastikan semua data yang diisi sudah benar. Pendaftaran yang sudah dikirim tidak dapat diubah. Data kamu terdaftar dengan email: <strong>{userEmail}</strong>
          </p>
        </div>

        <Button
          type="submit"
          size="lg"
          className="w-full"
          isLoading={isSubmitting}
          id="btn-submit-pendaftaran"
        >
          {isSubmitting ? 'Memproses...' : 'Kirim Pendaftaran'}
          {!isSubmitting && (
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </Button>
      </div>
    </form>
  );
}
