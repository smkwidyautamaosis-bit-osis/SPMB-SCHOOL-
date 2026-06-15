'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import type { StatusPendaftaran } from '@/types';

interface StatusUpdateFormProps {
  pendaftarId: string;
  currentStatus: StatusPendaftaran;
}

const STATUS_OPTIONS: StatusPendaftaran[] = [
  'Menunggu Verifikasi',
  'Diverifikasi',
  'Diterima',
  'Ditolak',
];

/**
 * Form ubah status pendaftaran untuk admin.
 * Melakukan update ke tabel `pendaftar` via Supabase client,
 * lalu refresh halaman untuk menampilkan data terbaru.
 */
export function StatusUpdateForm({ pendaftarId, currentStatus }: StatusUpdateFormProps) {
  const router = useRouter();
  const supabase = createClient();

  const [selectedStatus, setSelectedStatus] = useState<StatusPendaftaran>(currentStatus);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const hasChanged = selectedStatus !== currentStatus;

  const handleSave = async () => {
    if (!hasChanged) return;

    setIsLoading(true);
    setToast(null);

    const { error } = await supabase
      .from('pendaftar')
      .update({ status: selectedStatus })
      .eq('id', pendaftarId);

    setIsLoading(false);

    if (error) {
      setToast({ type: 'error', message: `Gagal update: ${error.message}` });
      return;
    }

    setToast({
      type: 'success',
      message: `Status berhasil diubah ke "${selectedStatus}"`,
    });

    // Refresh Server Component untuk menampilkan data terbaru
    router.refresh();
  };

  return (
    <div className="space-y-4">
      {/* Status saat ini */}
      <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100">
        <span className="text-sm text-slate-500">Status saat ini:</span>
        <StatusBadge status={currentStatus} size="md" />
      </div>

      {/* Dropdown pilih status baru */}
      <div>
        <label
          htmlFor="new-status"
          className="block text-sm font-semibold text-slate-700 mb-2"
        >
          Ubah Status
        </label>
        <div className="relative">
          <select
            id="new-status"
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value as StatusPendaftaran);
              setToast(null);
            }}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 appearance-none
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center">
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Preview status baru jika berubah */}
      {hasChanged && (
        <div className="flex items-center gap-2 text-sm text-slate-500 animate-fade-in">
          <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
          <span>Akan diubah ke:</span>
          <StatusBadge status={selectedStatus} size="sm" />
        </div>
      )}

      {/* Toast notification */}
      {toast && (
        <div
          className={`
            flex items-start gap-3 p-4 rounded-xl text-sm animate-fade-in
            ${toast.type === 'success'
              ? 'bg-green-50 border border-green-100 text-green-700'
              : 'bg-red-50 border border-red-100 text-red-700'
            }
          `}
        >
          {toast.type === 'success' ? (
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Tombol Simpan */}
      <Button
        onClick={handleSave}
        isLoading={isLoading}
        disabled={!hasChanged}
        className="w-full"
        id="btn-simpan-status"
      >
        {isLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
      </Button>
    </div>
  );
}
