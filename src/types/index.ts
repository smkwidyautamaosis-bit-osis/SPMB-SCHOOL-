// Definisi tipe TypeScript untuk seluruh aplikasi SPMB

export type JenisKelamin = 'Laki-laki' | 'Perempuan';

export type StatusPendaftaran =
  | 'Menunggu Verifikasi'
  | 'Diverifikasi'
  | 'Ditolak'
  | 'Diterima';

export type JenisDokumen = 'kk' | 'akta_lahir' | 'ijazah_skl' | 'pas_foto';

export interface Admin {
  id: string;
  email: string;
  created_at: string;
}


export interface Jurusan {
  id: string;
  nama_jurusan: string;
  deskripsi: string | null;
  kuota: number;
  created_at: string;
}

export interface Pendaftar {
  id: string;
  user_id: string;
  nomor_pendaftaran: string;
  // Metadata dari auth.users (Google Auth)
  email?: string;
  avatar_url?: string;
  // Data Diri
  nama_lengkap: string;
  nama_panggilan?: string | null;
  no_whatsapp: string;
  jenis_kelamin: JenisKelamin;
  tempat_lahir: string;
  tanggal_lahir: string;
  agama?: string | null;
  kewarganegaraan?: string | null;
  // Keluarga & Domisili
  anak_ke?: number | null;
  jumlah_saudara?: number | null;
  bahasa_sehari_hari?: string | null;
  nama_orang_tua: string;
  no_hp_orang_tua: string;
  pekerjaan_orang_tua?: string | null;
  penghasilan_orang_tua?: string | null;
  alamat: string;
  tinggal_bersama?: string | null;
  jarak_ke_sekolah?: string | null;
  transportasi?: string | null;
  // Kesehatan
  berat_kg?: number | null;
  tinggi_cm?: number | null;
  gol_darah?: string | null;
  riwayat_penyakit?: string | null;
  kelainan_jasmani?: string | null;
  // Asal Sekolah
  asal_sekolah: string;
  nisn: string;
  alamat_sekolah_asal?: string | null;
  // Meta
  jurusan_id: string;
  status: StatusPendaftaran;
  created_at: string;
  jurusan?: Jurusan;
}

export interface DokumenPendaftar {
  id: string;
  pendaftar_id: string;
  jenis_dokumen: JenisDokumen;
  file_url: string;
  uploaded_at: string;
}

// Mapping label untuk tampilan UI
export const JENIS_DOKUMEN_LABEL: Record<JenisDokumen, string> = {
  kk: 'Kartu Keluarga (KK)',
  akta_lahir: 'Akta Lahir',
  ijazah_skl: 'Ijazah / SKL',
  pas_foto: 'Pas Foto',
};

export const STATUS_COLOR: Record<StatusPendaftaran, string> = {
  'Menunggu Verifikasi': 'yellow',
  Diverifikasi: 'blue',
  Diterima: 'green',
  Ditolak: 'red',
};
