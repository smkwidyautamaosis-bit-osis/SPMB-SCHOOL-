'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useState } from 'react';
import Image from 'next/image';

interface AdminSidebarProps {
  adminEmail: string;
}

const navItems = [
  {
    href: '/admin',
    label: 'Dashboard',
    exact: true,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    href: '/admin/pendaftar',
    label: 'Data Pendaftar',
    exact: false,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    href: '/admin/users',
    label: 'Informasi User',
    exact: false,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  },
];

/**
 * Sidebar navigasi untuk dashboard admin.
 */
export function AdminSidebar({ adminEmail }: AdminSidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isPengaturanOpen, setIsPengaturanOpen] = useState(false);
  const supabase = createClient();

  const handleSignOut = async () => {
    setIsLoggingOut(true);
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  const isSettingsActive = pathname.startsWith('/admin/pengaturan');
  const currentTab = searchParams.get('tab') || 'periode';

  return (
    <aside className="w-64 h-screen sticky top-0 bg-rose-950 flex flex-col flex-shrink-0 overflow-hidden print:hidden">
      {/* Logo / Brand */}
      <div className="px-6 py-6 border-b border-rose-900">
        <div className="flex items-center gap-3">
          <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0 bg-white border-2 border-white shadow-md">
            <Image 
              src="/images/logo_wu.png" 
              alt="Logo SPMB SMK Widya Utama" 
              fill
              className="object-cover"
              sizes="48px"
            />
          </div>
          <div>
            <p className="font-extrabold text-white text-sm leading-tight tracking-tight">SPMB SMK Widya Utama</p>
            <p className="text-xs text-amber-400 mt-0.5">Admin Panel</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
        {navItems.map((item) => {
          const active = isActive(item.href, item.exact);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200
                ${active
                  ? 'bg-white/10 text-white border-l-[3px] border-amber-500 shadow-sm'
                  : 'text-rose-200 hover:bg-white/5 hover:text-white border-l-[3px] border-transparent'
                }
              `}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}

        {/* Pengaturan SPMB Accordion */}
        <div>
          <button
            onClick={() => setIsPengaturanOpen(!isPengaturanOpen)}
            className={`
              w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200
              ${isSettingsActive && !isPengaturanOpen
                ? 'bg-white/10 text-white border-l-[3px] border-amber-500 shadow-sm'
                : 'text-rose-200 hover:bg-white/5 hover:text-white border-l-[3px] border-transparent'
              }
            `}
          >
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Pengaturan SPMB
            </div>
            <svg
              className={`w-4 h-4 transition-transform duration-300 ${isPengaturanOpen ? 'rotate-180' : ''}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {/* Submenu */}
          <div className={`overflow-hidden transition-all duration-300 ${isPengaturanOpen ? 'max-h-64 mt-1' : 'max-h-0'}`}>
            <div className="ml-6 pl-4 border-l-2 border-rose-900/60 space-y-1 mt-1">
              {[
                { label: 'Periode & Gelombang', tab: 'periode' },
                { label: 'Informasi Kontak', tab: 'kontak' },
                { label: 'Alamat Sekolah', tab: 'alamat' },
              ].map((sub) => {
                const isSubActive = isSettingsActive && currentTab === sub.tab;
                return (
                  <Link
                    key={sub.tab}
                    href={`/admin/pengaturan?tab=${sub.tab}`}
                    className={`
                      flex items-center text-sm rounded-xl px-3 py-2 transition-all duration-200
                      ${isSubActive
                        ? 'bg-rose-900/50 text-amber-400 font-medium'
                        : 'text-rose-100/70 hover:text-white hover:bg-white/5'
                      }
                    `}
                  >
                    <div className={`w-1 h-1 rounded-full mr-2 flex-shrink-0 transition-all ${isSubActive ? 'opacity-100 bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]' : 'bg-current opacity-40'}`}></div>
                    {sub.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Kelola Banner */}
        <Link
          href="/admin/banner"
          className={`
            flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 mt-1
            ${isActive('/admin/banner', true)
              ? 'bg-white/10 text-white border-l-[3px] border-amber-500 shadow-sm'
              : 'text-rose-200 hover:bg-white/5 hover:text-white border-l-[3px] border-transparent'
            }
          `}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Kelola Banner
        </Link>

        {/* Pengaturan FAQ */}
        <Link
          href="/admin/faq"
          className={`
            flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 mt-1
            ${isActive('/admin/faq', true)
              ? 'bg-white/10 text-white border-l-[3px] border-amber-500 shadow-sm'
              : 'text-rose-200 hover:bg-white/5 hover:text-white border-l-[3px] border-transparent'
            }
          `}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Kelola FAQ
        </Link>
      </nav>

      {/* Admin info + Sign out */}
      <div className="px-4 py-5 border-t border-rose-900 bg-rose-950">
        <div className="flex items-center gap-3 mb-3 px-2">
          <div className="w-8 h-8 rounded-full bg-rose-800 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-rose-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-xs text-rose-400">Super Admin</p>
            <p className="text-xs text-rose-200 font-medium truncate">{adminEmail}</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          disabled={isLoggingOut}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all disabled:opacity-50"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          {isLoggingOut ? 'Keluar...' : 'Sign Out'}
        </button>
      </div>
    </aside>
  );
}
