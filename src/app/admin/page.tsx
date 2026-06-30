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

  const { data: setting } = await supabase
    .from('pengaturan_sistem')
    .select('*')
    .eq('id', 1)
    .single();
  const tahunPeriode = setting?.tahun_periode || '2026/2027';

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
      <svg className="w-7 h-7" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path className="fill-amber-500" d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
      </svg>
    ),
    Diverifikasi: (
      <svg className="w-7 h-7" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path className="fill-rose-900" d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 2.19l7 3.11V11c0 4.52-2.98 8.69-7 9.93-4.02-1.24-7-5.41-7-9.93V6.3l7-3.11z"/>
        <path className="fill-amber-500" d="M10.5 14.5l-3-3 1.4-1.4 1.6 1.6 5.6-5.6 1.4 1.4z"/>
      </svg>
    ),
    Diterima: (
      <svg className="w-7 h-7" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path className="fill-rose-900" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
      </svg>
    ),
    Ditolak: (
      <svg className="w-7 h-7" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path className="fill-rose-900" d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z"/>
      </svg>
    ),
  };

  // Hitung per gelombang menggunakan tanggal pengaturan
  const countGelombang = (start?: string, end?: string) => {
    if (!start || !end) return 0;
    const s = new Date(start).getTime();
    const e = new Date(end).setHours(23, 59, 59, 999);
    return pendaftarList.filter(p => {
      const d = new Date(p.created_at).getTime();
      return d >= s && d <= e;
    }).length;
  };

  const gel1 = countGelombang(setting?.gel1_mulai, setting?.gel1_selesai);
  const gel2 = countGelombang(setting?.gel2_mulai, setting?.gel2_selesai);
  const gel3 = countGelombang(setting?.gel3_mulai, setting?.gel3_selesai);
  const maxGel = Math.max(gel1, gel2, gel3, 10); // scale reference

  const totalPendaftar = total || 1;
  const jurusanColorsHex = ['#4c0519', '#be123c', '#fb7185', '#f59e0b'];
  const jurusanColorsTailwind = ['bg-rose-950', 'bg-rose-700', 'bg-rose-400', 'bg-amber-500'];

  const conicGradient = (() => {
    let acc = 0;
    return (jurusanList ?? []).map((j, i) => {
      const pct = (countByJurusan(j.id) / totalPendaftar) * 100;
      const start = acc;
      acc += pct;
      const color = jurusanColorsHex[i % 4];
      return `${color} ${start}% ${acc}%`;
    }).join(', ');
  })();

  return (
    <div className="space-y-10">
      {/* Page header */}
      <div>
        <h2 className="text-3xl font-black text-rose-950">Dashboard</h2>
        <p className="text-slate-400 text-sm mt-1">
          Ringkasan data penerimaan murid baru tahun ajaran {tahunPeriode}
        </p>
      </div>

      {/* ===== Total + Per Status ===== */}
      <section>
        <h3 className="text-sm font-extrabold text-rose-950 uppercase tracking-wider mb-6">
          Statistik Umum
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {/* Total */}
          <StatCard
            label="Total Pendaftar"
            value={total}
            accent="blue"
            subLabel="Semua jurusan"
            icon={
              <svg className="w-7 h-7" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path className="fill-amber-500" d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
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
        <h3 className="text-sm font-extrabold text-rose-950 uppercase tracking-wider mb-6">
          Per Program Keahlian
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                  <svg className="w-7 h-7" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path className="fill-rose-900" d="M12 3L1 9V21H23V9L12 3ZM12 5.5L19 9V21H16V14H8V21H5V9L12 5.5Z"/>
                    <path className="fill-amber-500" d="M10 16H14V21H10V16ZM10 10H14V12H10V10ZM6 10H8V12H6V10ZM16 10H18V12H16V10Z" />
                  </svg>
                }
              />
            );
          })}
        </div>
      </section>

      {/* ===== Grafik Analisis ===== */}
      <section>
        <h3 className="text-sm font-extrabold text-rose-950 uppercase tracking-wider mb-6">
          Grafik Analisis Pendaftaran
        </h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Bar Chart: Tren Gelombang */}
          <div className="lg:col-span-2 bg-white rounded-3xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] p-8">
            <h4 className="text-base font-bold text-rose-950 mb-2">Tren Pendaftaran per Gelombang</h4>
            <p className="text-xs text-slate-400 mb-8">Jumlah pendaftar berdasarkan periode waktu pendaftaran gelombang.</p>
            
            <div className="flex items-end justify-around h-64 mt-4 relative">
              {/* Grid lines background */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="w-full border-t border-slate-100 flex-1"></div>
                ))}
              </div>
              
              {/* Bars */}
              {[
                { label: 'Gelombang 1', value: gel1 },
                { label: 'Gelombang 2', value: gel2 },
                { label: 'Gelombang 3', value: gel3 },
              ].map((item, i) => (
                <div key={i} className="relative flex flex-col items-center group w-1/4 z-10">
                  <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity bg-rose-950 text-white text-xs font-bold py-1 px-3 rounded-lg shadow-lg">
                    {item.value} Siswa
                  </div>
                  <div 
                    className="w-full bg-rose-900 rounded-t-xl transition-all duration-500 ease-out group-hover:bg-amber-500"
                    style={{ height: `${(item.value / maxGel) * 100}%`, minHeight: '4px' }}
                  ></div>
                  <span className="mt-4 text-xs font-bold text-slate-600">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Donut Chart: Distribusi Jurusan */}
          <div className="lg:col-span-1 bg-white rounded-3xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] p-8 flex flex-col">
            <h4 className="text-base font-bold text-rose-950 mb-2">Distribusi Jurusan</h4>
            <p className="text-xs text-slate-400 mb-8">Persentase peminatan program keahlian.</p>

            <div className="flex-1 flex flex-col items-center justify-center">
              {/* Conic Gradient Donut */}
              <div 
                className="w-48 h-48 rounded-full flex items-center justify-center relative shadow-inner"
                style={{ background: total === 0 ? '#f8fafc' : `conic-gradient(${conicGradient})` }}
              >
                <div className="w-32 h-32 bg-white rounded-full flex flex-col items-center justify-center absolute shadow-[inset_0_2px_8px_rgba(0,0,0,0.04)]">
                  <span className="text-3xl font-black text-rose-950">{total}</span>
                  <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Total</span>
                </div>
              </div>

              {/* Legends */}
              <div className="w-full mt-8 flex flex-col gap-3">
                {(jurusanList ?? []).map((j, i) => {
                  const count = countByJurusan(j.id);
                  const pct = total === 0 ? 0 : Math.round((count / total) * 100);
                  return (
                    <div key={j.id} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className={`w-3 h-3 rounded-full ${jurusanColorsTailwind[i % 4]}`}></span>
                        <span className="font-semibold text-slate-600 truncate max-w-[120px]">{j.nama_jurusan}</span>
                      </div>
                      <div className="flex gap-2 items-center">
                        <span className="text-slate-400">{count}</span>
                        <span className="font-bold text-rose-950 w-8 text-right">{pct}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
