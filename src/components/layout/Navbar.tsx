'use client';

import Link from 'next/link';
import Image from 'next/image';
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
  const [isProfileOpen, setIsProfileOpen] = useState(false);
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
  }, [supabase.auth]);

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
          ? 'bg-white/95 backdrop-blur-md shadow-md py-2'
          : 'bg-white/90 backdrop-blur-sm shadow-sm py-4'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 sm:gap-4 group min-w-0">
            <div className="relative w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 flex-shrink-0">
              <Image 
                src="/images/logo_wu.png" 
                alt="Logo SMK Widya Utama" 
                fill
                className="object-cover"
                sizes="(max-width: 768px) 48px, 64px"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-rose-900 text-xs sm:text-sm md:text-base lg:text-xl tracking-tight leading-tight truncate">
                SPMB SMK Widya Utama
              </p>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              href="/#program"
              className="text-sm font-medium text-slate-600 hover:text-rose-900 transition-colors"
            >
              Program Keahlian
            </Link>
            <Link
              href="/#jadwal"
              className="text-sm font-medium text-slate-600 hover:text-rose-900 transition-colors"
            >
              Jadwal SPMB
            </Link>
            {user ? (
              <div className="flex items-center gap-2">
                <Link href="/status" className="mr-2">
                  <Button variant="outline" size="sm">
                    Status Pendaftaran
                  </Button>
                </Link>

                {/* Profile Dropdown */}
                <div className="relative">
                  <button 
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center gap-3 p-1.5 pr-3 rounded-full hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200"
                  >
                    {user.user_metadata?.avatar_url ? (
                      <Image
                        src={user.user_metadata.avatar_url}
                        alt="Avatar"
                        width={32}
                        height={32}
                        className="rounded-full ring-2 ring-slate-100 object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-rose-100 text-rose-700 rounded-full flex items-center justify-center font-bold text-sm ring-2 ring-rose-50">
                        {user.email?.charAt(0).toUpperCase() || 'U'}
                      </div>
                    )}
                    <div className="hidden lg:flex flex-col text-left justify-center">
                      <span className="text-sm font-bold text-slate-800 leading-none mb-1">
                        {user.user_metadata?.full_name || 'Calon Siswa'}
                      </span>
                      <span className="text-xs text-slate-500 truncate max-w-[140px] leading-none">
                        {user.email}
                      </span>
                    </div>
                    <svg className={`w-4 h-4 text-slate-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Dropdown Menu */}
                  {isProfileOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 py-2 z-50 animate-fade-in origin-top-right">
                      <button
                        onClick={() => {
                          setIsProfileOpen(false);
                          handleLogout();
                        }}
                        disabled={isLoggingOut}
                        className="w-full text-left px-4 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors flex items-center gap-3"
                      >
                        {isLoggingOut ? (
                          <div className="w-4 h-4 border-2 border-rose-300 border-t-rose-600 rounded-full animate-spin"></div>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                        )}
                        {isLoggingOut ? 'Keluar...' : 'Keluar'}
                      </button>
                    </div>
                  )}
                </div>
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
              className="block px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-rose-900 transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Program Keahlian
            </Link>
            <Link
              href="/#jadwal"
              className="block px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-rose-900 transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Jadwal SPMB
            </Link>
            {user ? (
              <>
                <div className="px-4 py-3 flex items-center gap-3 border-b border-slate-100 mb-2">
                  {user.user_metadata?.avatar_url ? (
                    <Image
                      src={user.user_metadata.avatar_url}
                      alt="Avatar"
                      width={40}
                      height={40}
                      className="rounded-full ring-2 ring-slate-100 object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-rose-100 text-rose-700 rounded-full flex items-center justify-center font-bold text-lg ring-2 ring-rose-50 flex-shrink-0">
                      {user.email?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-bold text-slate-800 truncate leading-tight">
                      {user.user_metadata?.full_name || 'Calon Siswa'}
                    </span>
                    <span className="text-xs text-slate-500 truncate leading-tight">
                      {user.email}
                    </span>
                  </div>
                </div>
                <Link
                  href="/status"
                  className="block px-4 py-2.5 rounded-xl text-sm font-medium text-rose-900 hover:bg-rose-50 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Status Pendaftaran
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
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
