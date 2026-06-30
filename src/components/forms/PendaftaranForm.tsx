'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { FileUploadField } from '@/components/ui/FileUploadField';
import { StatusBadge } from '@/components/ui/StatusBadge';
import type { Jurusan } from '@/types';

// Helper untuk section header
const SectionHeader = ({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle?: string }) => (
  <div className="flex items-start gap-3 mb-6 pb-4 border-b border-slate-100">
    <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center text-rose-700 flex-shrink-0">
      {icon}
    </div>
    <div>
      <h3 className="font-bold text-rose-900">{title}</h3>
      {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
    </div>
  </div>
);

// ==============================
// Zod Schema validasi form
// ==============================
const pendaftaranSchema = z.object({
  // Data Diri
  nama_lengkap: z.string().min(2, 'Nama lengkap minimal 2 karakter'),
  nisn: z
    .string()
    .length(10, 'NISN harus tepat 10 digit')
    .regex(/^\d+$/, 'NISN hanya boleh berisi angka'),
  jenis_kelamin: z.enum(['Laki-laki', 'Perempuan'], {
    error: 'Pilih jenis kelamin',
  }),
  tempat_lahir: z.string().min(2, 'Tempat lahir wajib diisi'),
  tanggal_lahir: z.string().min(1, 'Tanggal lahir wajib diisi'),
  alamat: z.string().min(10, 'Alamat minimal 10 karakter'),
  no_hp: z
    .string()
    .min(10, 'Nomor HP minimal 10 digit')
    .max(15, 'Nomor HP maksimal 15 digit')
    .regex(/^[0-9+\-\s]+$/, 'Format nomor HP tidak valid'),

  // Data Orang Tua
  nama_orang_tua: z.string().min(2, 'Nama orang tua wajib diisi'),
  no_hp_orang_tua: z
    .string()
    .min(10, 'Nomor HP orang tua minimal 10 digit')
    .max(15, 'Nomor HP orang tua maksimal 15 digit')
    .regex(/^[0-9+\-\s]+$/, 'Format nomor HP tidak valid'),

  // Asal Sekolah
  asal_sekolah: z.string().min(3, 'Nama sekolah asal wajib diisi'),

  // Jurusan
  jurusan_id: z.string().min(1, 'Pilih jurusan'),

  // Dokumen (opsional di schema, validasi manual saat submit)
  doc_kk: z.instanceof(File).nullable().optional(),
  doc_akta_lahir: z.instanceof(File).nullable().optional(),
  doc_ijazah_skl: z.instanceof(File).nullable().optional(),
  doc_pas_foto: z.instanceof(File).nullable().optional(),
});

type PendaftaranFormData = z.infer<typeof pendaftaranSchema>;

interface PendaftaranFormProps {
  jurusanList: Jurusan[];
  userId: string;
  userEmail: string;
}

/**
 * Komponen Form Pendaftaran utama.
 *
 * Logic submit:
 * 1. Validasi form dengan zod
 * 2. Generate nomor_pendaftaran (SPMB-2026-XXXX)
 * 3. Insert ke tabel pendaftar
 * 4. Upload tiap file ke Supabase Storage bucket dokumen-pendaftaran
 * 5. Insert URL file ke tabel dokumen_pendaftar
 * 6. Redirect ke /status
 */
export function PendaftaranForm({ jurusanList, userId, userEmail }: PendaftaranFormProps) {
  const router = useRouter();
  const supabase = createClient();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStep, setSubmitStep] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);

  // State file (dikelola terpisah dari react-hook-form agar mudah)
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
    formState: { errors },
  } = useForm<PendaftaranFormData>({
    resolver: zodResolver(pendaftaranSchema),
    defaultValues: { jenis_kelamin: undefined, jurusan_id: '' },
  });



  // ==============================
  // Upload satu file ke Storage
  // ==============================
  const uploadFile = async (file: File, jenisDokumen: string): Promise<string> => {
    const ext = file.name.split('.').pop();
    const path = `${userId}/${jenisDokumen}.${ext}`;

    const { error } = await supabase.storage
      .from('dokumen-pendaftaran')
      .upload(path, file, { upsert: true });

    if (error) throw new Error(`Gagal upload ${jenisDokumen}: ${error.message}`);

    // Ambil URL (signed URL untuk bucket private)
    const { data: urlData } = await supabase.storage
      .from('dokumen-pendaftaran')
      .createSignedUrl(path, 60 * 60 * 24 * 365); // 1 tahun

    if (!urlData?.signedUrl) throw new Error(`Gagal mendapatkan URL untuk ${jenisDokumen}`);

    return urlData.signedUrl;
  };

  // ==============================
  // Validasi dokumen wajib
  // ==============================
  const validateFiles = (): boolean => {
    const newErrors: typeof fileErrors = {};
    if (!files.kk) newErrors.kk = 'Kartu Keluarga wajib diupload';
    if (!files.akta_lahir) newErrors.akta_lahir = 'Akta Lahir wajib diupload';
    if (!files.ijazah_skl) newErrors.ijazah_skl = 'Ijazah / SKL wajib diupload';
    if (!files.pas_foto) newErrors.pas_foto = 'Pas Foto wajib diupload';
    setFileErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ==============================
  // Submit handler
  // ==============================
  const onSubmit = async (data: PendaftaranFormData) => {
    // Validasi file dokumen
    if (!validateFiles()) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Step 1: Insert data pendaftar ke DB (nomor_pendaftaran otomatis dari trigger)
      setSubmitStep('Menyimpan data pendaftaran...');
      const { data: pendaftarData, error: insertError } = await supabase
        .from('pendaftar')
        .insert({
          user_id: userId,
          nama_lengkap: data.nama_lengkap,
          nisn: data.nisn,
          jenis_kelamin: data.jenis_kelamin,
          tempat_lahir: data.tempat_lahir,
          tanggal_lahir: data.tanggal_lahir,
          alamat: data.alamat,
          no_hp: data.no_hp,
          nama_orang_tua: data.nama_orang_tua,
          no_hp_orang_tua: data.no_hp_orang_tua,
          asal_sekolah: data.asal_sekolah,
          jurusan_id: data.jurusan_id,
          status: 'Menunggu Verifikasi',
        })
        .select('id, nomor_pendaftaran')
        .single();

      if (insertError) throw new Error(`Gagal menyimpan data: ${insertError.message}`);
      const pendaftarId = pendaftarData.id;

      // Step 3 & 4: Upload tiap file dan simpan URL ke dokumen_pendaftar
      const dokumenEntries = [
        { key: 'kk' as const, file: files.kk! },
        { key: 'akta_lahir' as const, file: files.akta_lahir! },
        { key: 'ijazah_skl' as const, file: files.ijazah_skl! },
        { key: 'pas_foto' as const, file: files.pas_foto! },
      ];

      for (const { key, file } of dokumenEntries) {
        setSubmitStep(`Mengupload ${key.replace('_', ' ')}...`);

        const fileUrl = await uploadFile(file, key);

        const { error: docError } = await supabase
          .from('dokumen_pendaftar')
          .insert({
            pendaftar_id: pendaftarId,
            jenis_dokumen: key,
            file_url: fileUrl,
          });

        if (docError) throw new Error(`Gagal menyimpan info dokumen ${key}: ${docError.message}`);
      }

      // Step 5: Redirect ke /status dengan nomor pendaftaran di query
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

  const jurusanOptions = jurusanList.map((j) => ({
    value: j.id,
    label: j.nama_jurusan,
  }));



  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
      {/* ===== DATA DIRI ===== */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-8">
        <SectionHeader
          icon={
            <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path className="fill-rose-900" d="M12 3L1 9L5 11.18V17C5 17 8.5 21 12 21C15.5 21 19 17 19 17V11.18L21 10.09V17H23V9L12 3ZM12 14C9.79 14 8 12.21 8 10C8 7.79 9.79 6 12 6C14.21 6 16 7.79 16 10C16 12.21 14.21 14 12 14Z" />
              <path className="fill-amber-500" d="M12 12C12 12 10 14 10 15.5C10 16.88 10.9 18 12 18C13.1 18 14 16.88 14 15.5C14 14 12 12 12 12Z" />
            </svg>
          }
          title="Data Diri Calon Siswa"
          subtitle="Isi dengan data yang sesuai dengan dokumen resmi"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="sm:col-span-2">
            <Input
              {...register('nama_lengkap')}
              id="nama_lengkap"
              label="Nama Lengkap"
              placeholder="Sesuai akta kelahiran"
              error={errors.nama_lengkap?.message}
              required
            />
          </div>

          <Input
            {...register('nisn')}
            id="nisn"
            label="NISN"
            placeholder="10 digit angka"
            error={errors.nisn?.message}
            maxLength={10}
            required
          />

          <Controller
            name="jenis_kelamin"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                id="jenis_kelamin"
                label="Jenis Kelamin"
                placeholder="Pilih jenis kelamin"
                options={[
                  { value: 'Laki-laki', label: 'Laki-laki' },
                  { value: 'Perempuan', label: 'Perempuan' },
                ]}
                error={errors.jenis_kelamin?.message}
                required
              />
            )}
          />

          <Input
            {...register('tempat_lahir')}
            id="tempat_lahir"
            label="Tempat Lahir"
            placeholder="Nama kota"
            error={errors.tempat_lahir?.message}
            required
          />

          <Input
            {...register('tanggal_lahir')}
            id="tanggal_lahir"
            label="Tanggal Lahir"
            type="date"
            error={errors.tanggal_lahir?.message}
            required
          />

          <Input
            {...register('no_hp')}
            id="no_hp"
            label="No. HP / WhatsApp"
            placeholder="08xxxxxxxxxx"
            error={errors.no_hp?.message}
            type="tel"
            required
          />

          <div className="sm:col-span-2">
            <Textarea
              {...register('alamat')}
              id="alamat"
              label="Alamat Lengkap"
              placeholder="Jl. Nama Jalan No. X, Kelurahan, Kecamatan, Kota/Kabupaten"
              error={errors.alamat?.message}
              rows={3}
              required
            />
          </div>
        </div>
      </div>

      {/* ===== DATA ORANG TUA ===== */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-8">
        <SectionHeader
          icon={
            <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path className="fill-amber-500" d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 2.19l7 3.11V11c0 4.52-2.98 8.69-7 9.93-4.02-1.24-7-5.41-7-9.93V6.3l7-3.11z" />
              <g transform="translate(3.6, 3.6) scale(0.7)">
                <path className="fill-rose-900" d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
              </g>
            </svg>
          }
          title="Data Orang Tua / Wali"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="sm:col-span-2">
            <Input
              {...register('nama_orang_tua')}
              id="nama_orang_tua"
              label="Nama Orang Tua / Wali"
              placeholder="Nama lengkap orang tua atau wali"
              error={errors.nama_orang_tua?.message}
              required
            />
          </div>

          <Input
            {...register('no_hp_orang_tua')}
            id="no_hp_orang_tua"
            label="No. HP Orang Tua / Wali"
            placeholder="08xxxxxxxxxx"
            error={errors.no_hp_orang_tua?.message}
            type="tel"
            required
          />
        </div>
      </div>

      {/* ===== ASAL SEKOLAH ===== */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-8">
        <SectionHeader
          icon={
            <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path className="fill-rose-900" d="M12 3L1 9V21H23V9L12 3ZM12 5.5L19 9V21H16V14H8V21H5V9L12 5.5Z" />
              <path className="fill-amber-500" d="M10 16H14V21H10V16ZM10 10H14V12H10V10ZM6 10H8V12H6V10ZM16 10H18V12H16V10Z" />
            </svg>
          }
          title="Asal Sekolah"
        />

        <Input
          {...register('asal_sekolah')}
          id="asal_sekolah"
          label="Nama Sekolah Asal (SMP/MTs)"
          placeholder="Contoh: SMP Negeri 1 Kota"
          error={errors.asal_sekolah?.message}
          required
        />
      </div>

      {/* ===== PILIHAN JURUSAN ===== */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-8">
        <SectionHeader
          icon={
            <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path className="fill-rose-900" d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2ZM6 20V4H13V9H18V20H6Z" />
              <path className="fill-amber-500" d="M16 11.5L11.5 16L8.5 13L9.5 12L11.5 14L15 10.5L16 11.5Z" />
            </svg>
          }
          title="Pilihan Jurusan"
          subtitle="Pilih satu jurusan yang kamu minati"
        />

        <Controller
          name="jurusan_id"
          control={control}
          render={({ field }) => (
            <Select
              {...field}
              id="jurusan_id"
              label="Program Keahlian"
              placeholder="-- Pilih Jurusan --"
              options={jurusanOptions}
              error={errors.jurusan_id?.message}
              required
            />
          )}
        />
      </div>

      {/* ===== UPLOAD DOKUMEN ===== */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-8">
        <SectionHeader
          icon={
            <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path className="fill-rose-900" d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2ZM6 20V4H13V9H18V20H6Z" />
              <path className="fill-amber-500" d="M16 11.5L11.5 16L8.5 13L9.5 12L11.5 14L15 10.5L16 11.5Z" />
            </svg>
          }
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
        {/* Error state */}
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

        {/* Progress state */}
        {isSubmitting && submitStep && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-100 flex items-center gap-3">
            <svg className="animate-spin w-5 h-5 text-rose-600 flex-shrink-0" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-sm text-rose-700 font-medium">{submitStep}</p>
          </div>
        )}

        {/* Info */}
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
