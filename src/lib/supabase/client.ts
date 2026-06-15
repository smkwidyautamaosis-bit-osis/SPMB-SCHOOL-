import { createBrowserClient } from '@supabase/ssr';

/**
 * Supabase client untuk digunakan di Client Components.
 * Menggunakan createBrowserClient dari @supabase/ssr
 * yang otomatis mengelola session di browser via cookies.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
