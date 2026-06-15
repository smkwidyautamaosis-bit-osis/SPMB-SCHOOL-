import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Auth Callback Route Handler.
 *
 * Flow:
 * 1. User klik magic link dari email
 * 2. Supabase mengarahkan ke /auth/callback?code=...
 * 3. Handler ini menukar `code` dengan session aktif
 * 4. Cek apakah email user ada di tabel `admins` → redirect ke /admin
 * 5. Jika bukan admin, cek tabel `pendaftar`:
 *    - Sudah punya data → /status
 *    - Belum → /daftar
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  if (code) {
    const supabase = await createClient();

    // Tukar authorization code dengan session
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Ambil user yang baru login
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Cek apakah user adalah super admin
        const { data: adminRow } = await supabase
          .from('admins')
          .select('id')
          .eq('email', user.email ?? '')
          .maybeSingle();

        if (adminRow) {
          // User adalah admin → redirect ke dashboard admin
          return NextResponse.redirect(`${origin}/admin`);
        }

        // Bukan admin — cek apakah sudah pernah mendaftar
        const { data: pendaftar } = await supabase
          .from('pendaftar')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (pendaftar) {
          // Sudah pernah daftar → ke halaman status
          return NextResponse.redirect(`${origin}/status`);
        } else {
          // Belum pernah daftar → ke form pendaftaran
          return NextResponse.redirect(`${origin}/daftar`);
        }
      }
    }
  }

  // Jika terjadi error atau tidak ada code, redirect ke login dengan pesan error
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
