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
import type { Jurusan } from '@/types';

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
  // Generate nomor pendaftaran
  // ==============================
  const generateNomorPendaftaran = async (): Promise<string> => {
    // Ambil nomor terakhir dari DB untuk mendapatkan increment
    const { data } = await supabase
      .from('pendaftar')
      .select('nomor_pendaftaran')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    let nextNumber = 1;
    if (data?.nomor_pendaftaran) {
      // Format: SPMB-2026-XXXX → ambil 4 digit terakhir
      const parts = data.nomor_pendaftaran.split('-');
      const lastNum = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(lastNum)) nextNumber = lastNum + 1;
    }

    return `SPMB-2026-${String(nextNumber).padStart(4, '0')}`;
  };

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
      // Step 1: Generate nomor pendaftaran
      setSubmitStep('Membuat nomor pendaftaran...');
      const nomorPendaftaran = await generateNomorPendaftaran();

      // Step 2: Insert data pendaftar ke DB
      setSubmitStep('Menyimpan data pendaftaran...');
      const { data: pendaftarData, error: insertError } = await supabase
        .from('pendaftar')
        .insert({
          user_id: userId,
          nomor_pendaftaran: nomorPendaftaran,
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
        .select('id')
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
      router.push(`/status?success=1&nomor=${encodeURIComponent(nomorPendaftaran)}`);
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

  // Helper untuk section header
  const SectionHeader = ({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle?: string }) => (
    <div className="flex items-start gap-3 mb-6 pb-4 border-b border-slate-100">
      <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 flex-shrink-0">
        {icon}
      </div>
      <div>
        <h3 className="font-bold text-blue-900">{title}</h3>
        {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
      </div>
    </div>
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
      {/* ===== DATA DIRI ===== */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-8">
        <SectionHeader
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
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
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
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
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
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
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
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
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
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
          <div className="mb-6 p-4 rounded-xl bg-blue-50 border border-blue-100 flex items-center gap-3">
            <svg className="animate-spin w-5 h-5 text-blue-600 flex-shrink-0" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-sm text-blue-700 font-medium">{submitStep}</p>
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
