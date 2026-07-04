'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { StatusBadge } from '@/components/ui/StatusBadge';
import type { Pendaftar, Jurusan, StatusPendaftaran } from '@/types';

type PendaftarWithJurusan = Pendaftar & { jurusan: Jurusan | null };

interface PendaftarTableProps {
  pendaftarList: PendaftarWithJurusan[];
  jurusanList: Pick<Jurusan, 'id' | 'nama_jurusan'>[];
}

const STATUS_OPTIONS: StatusPendaftaran[] = [
  'Menunggu Verifikasi',
  'Diverifikasi',
  'Diterima',
  'Ditolak',
];

/**
 * Tabel pendaftar dengan filter jurusan, filter status, dan search real-time.
 * Client Component — semua filtering dilakukan di sisi client (data sudah di-fetch di server).
 */
export function PendaftarTable({ pendaftarList, jurusanList }: PendaftarTableProps) {
  const router = useRouter();

  const [search, setSearch] = useState('');
  const [filterJurusan, setFilterJurusan] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Filter + search (memoized agar tidak recalculate setiap render)
  const filtered = useMemo(() => {
    return pendaftarList.filter((p) => {
      const q = search.toLowerCase().trim();

      const matchSearch =
        !q ||
        p.nama_lengkap.toLowerCase().includes(q) ||
        p.nomor_pendaftaran.toLowerCase().includes(q);

      const matchJurusan = !filterJurusan || p.jurusan_id === filterJurusan;
      const matchStatus = !filterStatus || p.status === filterStatus;

      return matchSearch && matchJurusan && matchStatus;
    });
  }, [pendaftarList, search, filterJurusan, filterStatus]);

  const formatTanggal = (d: string) =>
    new Date(d).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

  const selectClass =
    'px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all';

  const handleExportCSV = () => {
    // Header CSV
    const headers = ['Nomor Pendaftaran', 'Nama Lengkap', 'NISN', 'Asal Sekolah', 'Pilihan Jurusan', 'No HP', 'Status'];
    
    // Baris data (menggunakan data yang difilter saat ini)
    const rows = filtered.map(p => [
      p.nomor_pendaftaran,
      `"${p.nama_lengkap}"`, // kutip untuk menghindari error jika ada koma di nama
      `"${p.nisn}"`, // perlakukan sebagai string
      `"${p.asal_sekolah}"`,
      `"${p.jurusan?.nama_jurusan || '-'}"`,
      `"${p.no_whatsapp || '-'}"`,
      p.status
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    
    // Trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Data_Pendaftar_SPMB_WidyaUtama.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* ===== Toolbar: search + filter ===== */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            id="search-pendaftar"
            type="text"
            placeholder="Cari nama atau nomor pendaftaran..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Filter Jurusan */}
        <div className="relative">
          <select
            id="filter-jurusan"
            value={filterJurusan}
            onChange={(e) => setFilterJurusan(e.target.value)}
            className={selectClass}
          >
            <option value="">Semua Jurusan</option>
            {jurusanList.map((j) => (
              <option key={j.id} value={j.id}>
                {j.nama_jurusan}
              </option>
            ))}
          </select>
        </div>

        {/* Filter Status */}
        <div className="relative">
          <select
            id="filter-status"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className={selectClass}
          >
            <option value="">Semua Status</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* Export Button */}
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-rose-900 hover:bg-rose-800 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm whitespace-nowrap"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export CSV
        </button>
      </div>

      {/* Hasil count */}
      <p className="text-xs text-slate-400">
        Menampilkan <span className="font-semibold text-slate-600">{filtered.length}</span> dari{' '}
        <span className="font-semibold text-slate-600">{pendaftarList.length}</span> pendaftar
      </p>

      {/* ===== Tabel ===== */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          /* Empty state */
          <div className="text-center py-16 text-slate-400">
            <svg
              className="w-14 h-14 mx-auto mb-4 opacity-25"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="font-medium text-slate-500">Tidak ada data yang sesuai</p>
            <p className="text-sm mt-1">Coba ubah filter atau kata kunci pencarian</p>
            {(search || filterJurusan || filterStatus) && (
              <button
                onClick={() => {
                  setSearch('');
                  setFilterJurusan('');
                  setFilterStatus('');
                }}
                className="mt-4 text-sm text-rose-600 hover:text-rose-800 underline"
              >
                Reset semua filter
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {[
                    'Nomor Pendaftaran',
                    'Nama Lengkap',
                    'Jurusan',
                    'Status',
                    'Tanggal Daftar',
                    '',
                  ].map((col) => (
                    <th
                      key={col}
                      className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => router.push(`/admin/pendaftar/${p.id}`)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                  >
                    <td className="px-6 py-4 font-mono text-xs font-semibold text-rose-800 whitespace-nowrap">
                      {p.nomor_pendaftaran}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-800 whitespace-nowrap">
                      {p.nama_lengkap}
                    </td>
                    <td className="px-6 py-4 text-slate-600 whitespace-nowrap">
                      {p.jurusan?.nama_jurusan ?? '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={p.status} size="sm" />
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-xs whitespace-nowrap">
                      {formatTanggal(p.created_at)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity text-xs font-medium flex items-center gap-1 whitespace-nowrap">
                        Lihat Detail
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
