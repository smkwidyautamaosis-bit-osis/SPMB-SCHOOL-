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
        {/* Page content */}
        <main className="flex-1 p-8 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
