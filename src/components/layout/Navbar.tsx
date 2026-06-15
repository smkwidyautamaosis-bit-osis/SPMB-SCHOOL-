'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import type { User } from '@supabase/supabase-js';

/**
 * Komponen Navbar — menampilkan navigasi utama dan status login user.
 */
export function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // Ambil user session saat mount
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));

    // Subscribe perubahan auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => setUser(session?.user ?? null)
    );

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
    setIsLoggingOut(false);
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-md shadow-md'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-900 to-blue-700 flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
              <span className="text-white font-black text-sm">WU</span>
            </div>
            <div>
              <p className="font-bold text-blue-900 leading-none text-sm">SMK Widya Utama</p>
              <p className="text-xs text-amber-500 font-medium">SPMB 2026</p>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              href="/#program"
              className="text-sm font-medium text-slate-600 hover:text-blue-900 transition-colors"
            >
              Program Keahlian
            </Link>
            <Link
              href="/#jadwal"
              className="text-sm font-medium text-slate-600 hover:text-blue-900 transition-colors"
            >
              Jadwal SPMB
            </Link>
            {user ? (
              <div className="flex items-center gap-3">
                <Link href="/status">
                  <Button variant="outline" size="sm">
                    Status Pendaftaran
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  isLoading={isLoggingOut}
                >
                  Keluar
                </Button>
              </div>
            ) : (
              <Link href="/login">
                <Button size="sm">Masuk / Daftar</Button>
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t border-slate-100 py-4 px-2 space-y-2 shadow-lg rounded-b-2xl">
            <Link
              href="/#program"
              className="block px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-blue-900 transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Program Keahlian
            </Link>
            <Link
              href="/#jadwal"
              className="block px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-blue-900 transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Jadwal SPMB
            </Link>
            {user ? (
              <>
                <Link
                  href="/status"
                  className="block px-4 py-2 rounded-xl text-sm font-medium text-blue-900 hover:bg-blue-50 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Status Pendaftaran
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
                >
                  Keluar
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="block"
                onClick={() => setIsMenuOpen(false)}
              >
                <Button className="w-full" size="sm">Masuk / Daftar</Button>
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
