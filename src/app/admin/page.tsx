import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { StatCard } from '@/components/ui/StatCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import Link from 'next/link';
import type { Pendaftar, Jurusan, StatusPendaftaran } from '@/types';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Dashboard' };

type PendaftarWithJurusan = Pendaftar & { jurusan: Jurusan };

/**
 * Dashboard Admin — statistik ringkas:
 * - Total pendaftar
 * - Per jurusan (4 card)
 * - Per status (4 card berwarna)
 * - 5 pendaftar terbaru
 */
export default async function AdminDashboardPage() {
  const supabase = await createClient();

  // Fetch semua pendaftar + jurusan (tanpa limit, untuk statistik)
  const { data: allPendaftar } = await supabase
    .from('pendaftar')
    .select('*, jurusan:jurusan_id(id, nama_jurusan)')
    .order('created_at', { ascending: false }) as { data: PendaftarWithJurusan[] | null };

  const pendaftarList = allPendaftar ?? [];

  // Fetch daftar jurusan untuk label card
  const { data: jurusanList } = await supabase
    .from('jurusan')
    .select('id, nama_jurusan')
    .order('nama_jurusan') as { data: Pick<Jurusan, 'id' | 'nama_jurusan'>[] | null };

  const total = pendaftarList.length;

  // Hitung per status
  const statusList: StatusPendaftaran[] = [
    'Menunggu Verifikasi',
    'Diverifikasi',
    'Diterima',
    'Ditolak',
  ];

  const countByStatus = (status: StatusPendaftaran) =>
    pendaftarList.filter((p) => p.status === status).length;

  // Hitung per jurusan
  const countByJurusan = (jurusanId: string) =>
    pendaftarList.filter((p) => p.jurusan_id === jurusanId).length;

  const statusAccent: Record<StatusPendaftaran, 'yellow' | 'blue' | 'green' | 'red'> = {
    'Menunggu Verifikasi': 'yellow',
    Diverifikasi: 'blue',
    Diterima: 'green',
    Ditolak: 'red',
  };

  const statusIcon: Record<StatusPendaftaran, React.ReactNode> = {
    'Menunggu Verifikasi': (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    Diverifikasi: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    Diterima: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    Ditolak: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  };

  // 5 pendaftar terbaru
  const recentPendaftar = pendaftarList.slice(0, 5);

  const formatTanggal = (d: string) =>
    new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h2 className="text-2xl font-extrabold text-slate-800">Dashboard</h2>
        <p className="text-slate-400 text-sm mt-1">
          Ringkasan data penerimaan murid baru tahun ajaran 2026/2027
        </p>
      </div>

      {/* ===== Total + Per Status ===== */}
      <section>
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
          Statistik Umum
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
          {/* Total */}
          <StatCard
            label="Total Pendaftar"
            value={total}
            accent="blue"
            subLabel="Semua jurusan"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            }
          />
          {statusList.map((status) => (
            <StatCard
              key={status}
              label={status}
              value={countByStatus(status)}
              accent={statusAccent[status]}
              icon={statusIcon[status]}
            />
          ))}
        </div>
      </section>

      {/* ===== Per Jurusan ===== */}
      <section>
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
          Per Program Keahlian
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {(jurusanList ?? []).map((jurusan, idx) => {
            const accents = ['blue', 'yellow', 'green', 'slate'] as const;
            return (
              <StatCard
                key={jurusan.id}
                label={jurusan.nama_jurusan}
                value={countByJurusan(jurusan.id)}
                accent={accents[idx % accents.length]}
                subLabel="pendaftar"
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                }
              />
            );
          })}
        </div>
      </section>

      {/* ===== Pendaftar Terbaru ===== */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
            Pendaftar Terbaru
          </h3>
          <Link
            href="/admin/pendaftar"
            className="text-sm font-medium text-blue-700 hover:text-blue-900 transition-colors flex items-center gap-1"
          >
            Lihat Semua
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {recentPendaftar.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-sm">Belum ada data pendaftar</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    {['Nomor Pendaftaran', 'Nama Lengkap', 'Jurusan', 'Status', 'Tanggal'].map(
                      (col) => (
                        <th
                          key={col}
                          className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider"
                        >
                          {col}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {recentPendaftar.map((p) => (
                    <tr
                      key={p.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-5 py-3.5 font-mono text-xs font-medium text-blue-800">
                        {p.nomor_pendaftaran}
                      </td>
                      <td className="px-5 py-3.5 font-medium text-slate-800">
                        {p.nama_lengkap}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">
                        {p.jurusan?.nama_jurusan ?? '-'}
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge status={p.status} size="sm" />
                      </td>
                      <td className="px-5 py-3.5 text-slate-400 text-xs">
                        {formatTanggal(p.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
