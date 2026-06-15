import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Supabase client untuk digunakan di Server Components, Server Actions,
 * dan Route Handlers.
 * Menggunakan createServerClient dari @supabase/ssr yang membaca/menulis
 * cookies via next/headers.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Dipanggil dari Server Component — cookies tidak bisa di-set,
            // tapi session di-refresh oleh middleware jadi ini aman diabaikan.
          }
        },
      },
    }
  );
}
