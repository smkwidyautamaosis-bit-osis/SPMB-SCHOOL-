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
  nama_lengkap: string;
  nisn: string;
  jenis_kelamin: JenisKelamin;
  tempat_lahir: string;
  tanggal_lahir: string;
  alamat: string;
  no_hp: string;
  nama_orang_tua: string;
  no_hp_orang_tua: string;
  asal_sekolah: string;
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
