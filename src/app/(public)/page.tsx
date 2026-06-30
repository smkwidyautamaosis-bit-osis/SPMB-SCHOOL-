import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Footer } from '@/components/layout/Footer';
import { BannerCarousel } from '@/components/public/BannerCarousel';
import type { Jurusan } from '@/types';

/**
 * Landing page SPMB SMK Widya Utama.
 * Server Component — fetch data jurusan langsung dari Supabase.
 */
export default async function HomePage() {
  const supabase = await createClient();

  // Ambil data jurusan dari DB
  const { data: jurusanList } = await supabase
    .from('jurusan')
    .select('*')
    .order('nama_jurusan');

  // Ambil pengaturan sistem
  const { data: setting } = await supabase
    .from('pengaturan_sistem')
    .select('*')
    .eq('id', 1)
    .single();

  // Ambil data banners (hero_images)
  const { data: bannersList } = await supabase
    .from('hero_images')
    .select('*')
    .order('created_at', { ascending: false });

  const tahunPeriode = setting?.tahun_periode || '2026/2027';
  const tahunSingkat = tahunPeriode.split('/')[0];

  // Cek apakah user sudah login
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let hasPendaftaran = false;
  if (user) {
    const { data: pendaftar } = await supabase
      .from('pendaftar')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();
    hasPendaftaran = !!pendaftar;
  }

  let ctaConfig = {
    href: '/login',
    text: 'Masuk / Daftar Sekarang',
    icon: (
      <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
      </svg>
    ),
  };

  if (user) {
    if (hasPendaftaran) {
      ctaConfig = {
        href: '/status',
        text: 'Cek Status Pendaftaran',
        icon: (
          <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        ),
      };
    } else {
      ctaConfig = {
        href: '/daftar',
        text: 'Mulai Pendaftaran',
        icon: (
          <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        ),
      };
    }
  }

  const formatTanggal = (dStr?: string) => {
    if (!dStr) return '';
    return new Date(dStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const getFaseStatus = (startStr?: string, endStr?: string) => {
    if (!startStr || !endStr) return { label: 'Akan Datang', color: 'bg-amber-100 text-amber-700' };
    
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    const startDate = new Date(startStr);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(endStr);
    endDate.setHours(0, 0, 0, 0);
    
    if (now < startDate) {
      return { label: 'Akan Datang', color: 'bg-amber-100 text-amber-700' };
    } else if (now >= startDate && now <= endDate) {
      return { label: 'Dibuka', color: 'bg-emerald-100 text-emerald-700' };
    } else {
      return { label: 'Selesai', color: 'bg-slate-100 text-slate-500' };
    }
  };

  const jadwalSpmb = [
    {
      fase: 'Gelombang 1',
      tanggal: `${formatTanggal(setting?.gel1_mulai)} – ${formatTanggal(setting?.gel1_selesai)}`,
      status: getFaseStatus(setting?.gel1_mulai, setting?.gel1_selesai),
    },
    {
      fase: 'Gelombang 2',
      tanggal: `${formatTanggal(setting?.gel2_mulai)} – ${formatTanggal(setting?.gel2_selesai)}`,
      status: getFaseStatus(setting?.gel2_mulai, setting?.gel2_selesai),
    },
    {
      fase: 'Gelombang 3 (Daftar Ulang)',
      tanggal: `${formatTanggal(setting?.gel3_mulai)} – ${formatTanggal(setting?.gel3_selesai)}`,
      status: getFaseStatus(setting?.gel3_mulai, setting?.gel3_selesai),
    },
  ];

  const programIcons: Record<string, React.ReactNode> = {
    Perhotelan: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    'Tata Boga': (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
      </svg>
    ),
    Pariwisata: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    Perbankan: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  };

  const programColors = ['from-rose-500 to-rose-700', 'from-amber-400 to-orange-500', 'from-emerald-400 to-teal-600', 'from-purple-500 to-indigo-600'];

  return (
    <>
      {/* ===== HERO SECTION ===== */}
      <section className="relative min-h-screen flex items-center overflow-hidden bg-[url('/images/backgroundspmb.png')] bg-cover bg-center bg-no-repeat">
        {/* Background overlay */}
        <div className="absolute inset-0 bg-slate-950/35 z-0" />

        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-rose-400/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/5 rounded-full blur-3xl" />
          {/* Grid pattern */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 pt-40">
          <div className="max-w-3xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded-full px-4 py-2 text-sm font-medium mb-6 animate-fade-in">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400" />
              </span>
              Penerimaan Murid Baru {tahunPeriode} Dibuka!
            </div>

            {/* Heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-6 animate-fade-in-up drop-shadow-[0_4px_6px_rgba(0,0,0,0.7)]">
              Selamat Datang di{' '}
              <span className="text-amber-400">SMK Widya Utama</span>
            </h1>

            <p className="text-lg sm:text-xl text-white leading-relaxed mb-8 max-w-2xl animate-fade-in-up drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" style={{ animationDelay: '0.1s' }}>
              Wujudkan impianmu bersama kami. Daftar sekarang ke program keahlian pilihanmu dan mulai perjalanan menuju karier yang gemilang.
            </p>

            {/* Stats */}
            <div className="flex flex-wrap gap-6 mb-10 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              {[
                { value: '4', label: 'Program Keahlian' },
                { value: '500+', label: 'Kuota Siswa' },
                { value: tahunPeriode, label: 'Tahun Ajaran' },
              ].map((stat) => (
                <div key={stat.label} className="text-center drop-shadow-md">
                  <p className="text-3xl font-bold text-amber-400">{stat.value}</p>
                  <p className="text-sm text-white">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
              <Link href={ctaConfig.href}>
                <Button size="lg" variant="secondary" id="cta-daftar-sekarang">
                  {ctaConfig.text}
                  {ctaConfig.icon}
                </Button>
              </Link>
              <Link href="/#program">
                <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10 hover:text-white" id="cta-program">
                  Lihat Program
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/50 animate-bounce">
          <span className="text-xs">Scroll</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        {/* Bottom Fade-out Gradient (White Fog) */}
        <div className="absolute bottom-0 left-0 right-0 h-24 md:h-36 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none z-10" />
      </section>

      {/* ===== DYNAMIC BANNER SECTION ===== */}
      <BannerCarousel banners={bannersList || []} />

      {/* ===== PROGRAM KEAHLIAN SECTION ===== */}
      <section id="program" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          {/* Section header */}
          <div className="text-center mb-14">
            <span className="text-amber-500 font-semibold text-sm uppercase tracking-wider">
              Pilih Masa Depanmu
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-rose-900 mt-2 mb-4">
              Program Keahlian
            </h2>
            <p className="text-slate-500 max-w-2xl mx-auto">
              Kami menawarkan 4 program keahlian unggulan yang dirancang untuk mempersiapkan
              kamu menghadapi dunia kerja profesional.
            </p>
          </div>

          {/* Program Content - Orbit Layout (Desktop) & Flex (Mobile) */}
          <div className="max-w-4xl mx-auto">
            {/* Desktop Orbit Layout */}
            <div className="relative hidden lg:flex items-center justify-center h-[550px]">
              {/* Mascot */}
              <img 
                src="/images/orangspmb.png" 
                alt="Maskot SPMB"
                className="absolute z-10 w-auto h-auto max-h-[480px] object-contain"
                style={{ animation: 'float 4s ease-in-out infinite' }}
              />

              {/* Orbiting Badges */}
              {['Pariwisata', 'Perbankan', 'Perhotelan', 'Tata Boga'].map((namaJurusan, index) => {
                const jurusan = (jurusanList as Jurusan[] ?? []).find(j => j.nama_jurusan === namaJurusan);
                const positions = [
                  'top-[20%] left-[2%] xl:left-[-5%]', // Top-Left: Pariwisata
                  'bottom-[25%] left-[0%] xl:left-[-10%]', // Bottom-Left: Perbankan
                  'top-[15%] right-[0%] xl:right-[-10%]', // Top-Right: Perhotelan (ditunjuk maskot)
                  'bottom-[20%] right-[2%] xl:right-[-5%]', // Bottom-Right: Tata Boga
                ];
                return (
                  <div key={namaJurusan} className={`absolute z-20 ${positions[index]}`}>
                    <div className="px-6 py-3 rounded-full bg-white/80 backdrop-blur-md shadow-md hover:shadow-xl hover:shadow-rose-950/10 border border-rose-100 text-rose-950 hover:bg-rose-900 hover:text-amber-400 font-semibold text-center tracking-wide min-w-[160px] transition-all duration-300 hover:scale-105 cursor-default relative">
                      {namaJurusan}
                      {jurusan && <div className="text-xs font-normal opacity-80 mt-0.5">{jurusan.kuota > 0 ? `${jurusan.kuota} Kuota` : 'Kuota Terbatas'}</div>}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Mobile Vertical Layout */}
            <div className="flex flex-col items-center lg:hidden">
              <img 
                src="/images/orangspmb.png" 
                alt="Maskot SPMB"
                className="w-full max-w-[300px] h-auto object-contain mb-8"
                style={{ animation: 'float 4s ease-in-out infinite' }}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-md">
                {(jurusanList as Jurusan[] ?? []).map((jurusan) => (
                  <div key={jurusan.id} className="px-6 py-3 rounded-full bg-white/80 backdrop-blur-md shadow-md border border-rose-100 text-rose-950 font-semibold text-center tracking-wide min-w-[160px] transition-all duration-300 hover:scale-105 hover:bg-rose-900 hover:text-amber-400 cursor-default">
                    {jurusan.nama_jurusan}
                    <div className="text-xs font-normal opacity-80 mt-0.5">{jurusan.kuota > 0 ? `${jurusan.kuota} Kuota` : 'Kuota Terbatas'}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center mt-12">
            <Link href={ctaConfig.href}>
              <Button size="lg" id="cta-program-daftar">
                {ctaConfig.text}
                {ctaConfig.icon}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ===== JADWAL SPMB SECTION ===== */}
      <section id="jadwal" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-50 to-rose-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-amber-500 font-semibold text-sm uppercase tracking-wider">
              Tahun Ajaran {tahunPeriode}
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-rose-900 mt-2 mb-4">
              Jadwal SPMB
            </h2>
            <p className="text-slate-500 max-w-2xl mx-auto">
              Pastikan kamu tidak melewatkan setiap tahapan penerimaan murid baru.
            </p>
          </div>

          {/* Timeline */}
          <div className="max-w-3xl mx-auto">
            {jadwalSpmb.map((item, idx) => (
              <div key={idx} className="flex gap-6 mb-8 last:mb-0">
                {/* Timeline dot */}
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-2xl bg-rose-900 flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-md">
                    {idx + 1}
                  </div>
                  {idx < jadwalSpmb.length - 1 && (
                    <div className="w-0.5 flex-1 bg-rose-200 mt-2 min-h-[2rem]" />
                  )}
                </div>

                {/* Content */}
                <Card className="flex-1 mb-0" padding="sm">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <h3 className="font-bold text-rose-900">{item.fase}</h3>
                      <p className="text-sm text-slate-500 mt-0.5 flex items-center gap-1.5">
                        <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {item.tanggal}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${item.status.color}`}>
                      {item.status.label}
                    </span>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA SECTION ===== */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-rose-900 to-rose-700">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
            Siap Memulai Perjalananmu?
          </h2>
          <p className="text-rose-100 text-lg mb-8">
            Daftarkan dirimu sekarang dan raih kesempatan belajar di SMK Widya Utama.
          </p>
          <Link href={ctaConfig.href}>
            <Button size="lg" variant="secondary" id="cta-bottom">
              {ctaConfig.text}
              {ctaConfig.icon}
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </>
  );
}
