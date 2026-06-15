import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    default: 'Dashboard Admin — SPMB SMK Widya Utama',
    template: '%s | Admin SPMB',
  },
  robots: { index: false, follow: false },
};

/**
 * Layout untuk semua halaman admin (/admin/**).
 * Server Component — verifikasi ulang status admin di sisi server.
 * Menampilkan sidebar navigasi di sebelah kiri.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  // Verifikasi ulang bahwa user adalah admin (defence in depth)
  const { data: adminRow } = await supabase
    .from('admins')
    .select('email')
    .eq('email', user.email ?? '')
    .maybeSingle();

  if (!adminRow) redirect('/');

  return (
    <div className="flex min-h-screen bg-slate-100">
      {/* Sidebar */}
      <AdminSidebar adminEmail={adminRow.email} />

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-white border-b border-slate-100 px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-sm font-semibold text-slate-800">
              Sistem Penerimaan Murid Baru 2026
            </h1>
            <p className="text-xs text-slate-400">Panel Administrasi</p>
          </div>
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-full px-3 py-1.5">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs font-medium text-amber-700">Super Admin</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-8 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
