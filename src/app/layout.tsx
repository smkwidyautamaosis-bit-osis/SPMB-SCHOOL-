import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
import './globals.css';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-poppins',
  display: 'swap',
});

import { createClient } from '@/lib/supabase/server';

export async function generateMetadata(): Promise<Metadata> {
  const supabase = await createClient();
  const { data } = await supabase.from('pengaturan_sistem').select('tahun_periode').eq('id', 1).single();
  const tahun = data?.tahun_periode?.split('/')[0] || '2026'; // e.g. "2026/2027" -> "2026"
  
  return {
    title: {
      default: `SPMB SMK Widya Utama ${tahun} — Sistem Penerimaan Murid Baru`,
      template: '%s | SPMB SMK Widya Utama',
    },
    description: `Sistem Penerimaan Murid Baru (SPMB) SMK Widya Utama ${tahun}. Daftarkan dirimu secara online untuk program keahlian Perhotelan, Tata Boga, Pariwisata, dan Perbankan.`,
    keywords: ['SPMB', 'SMK Widya Utama', 'penerimaan siswa baru', 'pendaftaran online', tahun],
    openGraph: {
      title: `SPMB SMK Widya Utama ${tahun}`,
      description: 'Daftar online untuk masuk SMK Widya Utama. Mudah, cepat, dan transparan.',
      type: 'website',
    },
  };
}

/**
 * Root layout — hanya menyediakan <html> dan <body> dengan font.
 * Navbar & Footer ada di src/app/(public)/layout.tsx (untuk halaman publik).
 * Admin layout ada di src/app/admin/layout.tsx (sidebar admin).
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={poppins.variable}>
      <body className="font-poppins antialiased bg-slate-50 text-slate-800 min-h-screen flex flex-col">
        {children}
      </body>
    </html>
  );
}
