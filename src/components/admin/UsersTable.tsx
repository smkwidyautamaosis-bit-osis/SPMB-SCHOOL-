'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';

interface AuthUser {
  id: string;
  email: string;
  avatar_url: string;
  full_name: string;
  created_at: string;
  has_registered: boolean;
}

export function UsersTable({ users }: { users: AuthUser[] }) {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Filtering search dan status formulir
  const filtered = useMemo(() => {
    return users.filter(u => {
      const q = search.toLowerCase().trim();
      const matchSearch = !q || 
        u.email.toLowerCase().includes(q) || 
        u.full_name.toLowerCase().includes(q);
        
      const matchStatus = filterStatus === '' ? true :
        filterStatus === 'registered' ? u.has_registered : !u.has_registered;

      return matchSearch && matchStatus;
    });
  }, [users, search, filterStatus]);

  const formatTanggal = (d: string) =>
    new Date(d).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

  return (
    <div className="space-y-4">
      {/* Toolbar: search + filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Kolom Pencarian */}
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Cari email atau nama pengguna Google..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all placeholder:text-slate-400"
          />
        </div>
        
        {/* Dropdown Filter */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
        >
          <option value="">Semua Status Formulir</option>
          <option value="registered">Sudah Mengisi Form</option>
          <option value="unregistered">Belum Mengisi (Hanya Login)</option>
        </select>
      </div>

      {/* Rangkuman Data */}
      <p className="text-xs text-slate-400">
        Menampilkan <span className="font-semibold text-slate-600">{filtered.length}</span> dari{' '}
        <span className="font-semibold text-slate-600">{users.length}</span> akun terdaftar
      </p>

      {/* Komponen Tabel */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {['No', 'Avatar & Akun Google', 'Email Gmail', 'Tgl Join (Login Pertama)', 'Status Formulir'].map((col) => (
                  <th key={col} className="px-5 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-16">
                    <p className="font-medium text-slate-500">Tidak ada pengguna yang sesuai filter pencarian.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((u, idx) => (
                  <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-4 whitespace-nowrap text-slate-400 font-medium">
                      {idx + 1}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        {u.avatar_url ? (
                          <Image
                            src={u.avatar_url}
                            alt="Avatar"
                            width={34}
                            height={34}
                            className="rounded-full ring-2 ring-slate-100 object-cover shrink-0"
                          />
                        ) : (
                          <div className="w-[34px] h-[34px] bg-rose-100 text-rose-700 rounded-full flex items-center justify-center font-bold text-sm ring-2 ring-rose-50 shrink-0">
                            {u.email?.charAt(0).toUpperCase() || 'U'}
                          </div>
                        )}
                        <span className="font-semibold text-slate-800 line-clamp-1 max-w-[150px]">
                          {u.full_name || 'Tanpa Nama'}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-slate-600 font-medium">
                      {u.email}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-slate-400 text-xs">
                      {formatTanggal(u.created_at)}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      {u.has_registered ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>
                          ✅ Sudah Mengisi Form
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-100">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                          ⏳ Hanya Login (Belum Mengisi Form)
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
