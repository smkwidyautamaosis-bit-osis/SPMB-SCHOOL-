import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Helper middleware Supabase untuk merefresh session user.
 * Harus dipanggil di setiap request agar token tidak expired.
 *
 * Route protection:
 * - /daftar, /status  → butuh auth (user login)
 * - /admin/**         → butuh auth + email terdaftar di tabel admins
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session — penting: jangan hapus bagian ini!
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // --- Proteksi /admin/** ---
  if (pathname.startsWith('/admin')) {
    if (!user) {
      // Belum login → ke /login
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }

    // Cek apakah user adalah admin (email terdaftar di tabel admins)
    const { data: adminRow } = await supabase
      .from('admins')
      .select('id')
      .eq('email', user.email ?? '')
      .maybeSingle();

    if (!adminRow) {
      // Login tapi bukan admin → ke landing page
      const url = request.nextUrl.clone();
      url.pathname = '/';
      return NextResponse.redirect(url);
    }
  }

  // --- Proteksi /daftar & /status ---
  const protectedPaths = ['/daftar', '/status'];
  const isProtected = protectedPaths.some((path) =>
    pathname.startsWith(path)
  );

  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
