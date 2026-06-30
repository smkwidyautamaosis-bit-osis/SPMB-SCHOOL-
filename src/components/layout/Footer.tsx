import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';

/**
 * Komponen Footer untuk semua halaman.
 */
export async function Footer() {
  const currentYear = new Date().getFullYear();
  const supabase = await createClient();
  const { data: setting } = await supabase.from('pengaturan_sistem').select('*').eq('id', 1).single();

  const tahunSingkat = setting?.tahun_periode?.split('/')[0] || '2026';
  const alamat = setting?.alamat_sekolah || 'Jl. Widya Utama No.1, Kota';
  const email = setting?.email_sekolah || 'info@smkwidyautama.sch.id';
  const hp = setting?.no_hp_sekolah || '(021) 1234-5678';

  return (
    <footer className="bg-rose-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0 bg-transparent">
                <Image 
                  src="/images/logo_wu.png" 
                  alt="Logo SMK Widya Utama" 
                  fill
                  className="object-cover"
                  sizes="48px"
                />
              </div>
              <div>
                <p className="font-bold leading-none">SMK Widya Utama</p>
                <p className="text-xs text-amber-400 font-medium">SPMB {tahunSingkat}</p>
              </div>
            </div>
            <p className="text-sm text-rose-200 leading-relaxed">
              Sistem Penerimaan Murid Baru SMK Widya Utama. Mendaftar mudah, proses transparan.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold text-sm mb-4 text-amber-400">Navigasi</h4>
            <ul className="space-y-2">
              {[
                { href: '/#program', label: 'Program Keahlian' },
                { href: '/#jadwal', label: 'Jadwal SPMB' },
                { href: '/login', label: 'Login / Daftar' },
                { href: '/status', label: 'Status Pendaftaran' },
              ].map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-rose-200 hover:text-white transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-sm mb-4 text-amber-400">Kontak</h4>
            <ul className="space-y-2 text-sm text-rose-200">
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>{alamat}</span>
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>{email}</span>
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span>{hp}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-rose-800 mt-8 pt-8 text-center text-xs text-rose-300">
          <p>© {currentYear} SMK Widya Utama. Hak cipta dilindungi.</p>
        </div>
      </div>
    </footer>
  );
}
