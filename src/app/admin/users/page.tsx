import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Metadata } from 'next';
import { UsersTable } from '@/components/admin/UsersTable';

export const metadata: Metadata = { title: 'Informasi User (Leads)' };

export default async function AdminUsersPage() {
  const supabase = await createClient();

  // Inisialisasi admin client untuk mengambil data lengkap dari auth.users
  const supabaseAdmin = process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      )
    : null;

  let authUsers: any[] = [];
  if (supabaseAdmin) {
    try {
      const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
      authUsers = users || [];
    } catch (e) {
      console.error("Gagal mengambil data auth.users.", e);
    }
  }

  // Fetch seluruh pendaftar (kita hanya butuh user_id untuk keperluan status registrasi)
  const { data: pendaftarList } = await supabase
    .from('pendaftar')
    .select('user_id');
    
  const pendaftarIds = new Set(pendaftarList?.map(p => p.user_id) || []);

  // Gabungkan (Left Join) data login dengan data pendaftar
  const mergedUsers = authUsers.map(user => {
    return {
      id: user.id,
      email: user.email || '',
      avatar_url: user.user_metadata?.avatar_url || '',
      full_name: user.user_metadata?.full_name || '',
      created_at: user.created_at,
      has_registered: pendaftarIds.has(user.id),
    };
  });
  
  // Urutkan akun terbaru di posisi atas
  mergedUsers.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h2 className="text-2xl font-extrabold text-slate-800">Informasi User (Leads)</h2>
        <p className="text-slate-400 text-sm mt-1">
          Pantau dan kelola seluruh pengguna yang telah berhasil masuk menggunakan akun Google.
        </p>
      </div>
      
      {/* Peringatan jika service role key tidak ada */}
      {!supabaseAdmin && (
        <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-xl shadow-sm">
          <p className="text-sm font-semibold text-rose-800">Peringatan: SUPABASE_SERVICE_ROLE_KEY belum diatur!</p>
          <p className="text-xs text-rose-700 mt-1">
            Sistem tidak memiliki izin penuh untuk mengambil daftar login pengguna dari tabel <code>auth.users</code>. 
            Silakan tambahkan service role key ke <i>environment variables</i> Anda untuk mengaktifkan fitur ini.
          </p>
        </div>
      )}

      {/* Tabel Komponen Utama */}
      <UsersTable users={mergedUsers} />
    </div>
  );
}
