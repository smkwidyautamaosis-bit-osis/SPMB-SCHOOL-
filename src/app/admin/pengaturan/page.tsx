'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';

interface Pengaturan {
  id: number;
  tahun_periode: string;
  gel1_mulai: string;
  gel1_selesai: string;
  gel2_mulai: string;
  gel2_selesai: string;
  gel3_mulai: string;
  gel3_selesai: string;
  alamat_sekolah: string;
  email_sekolah: string;
  no_hp_sekolah: string;
  banner_url?: string | null;
}

export default function PengaturanPage() {
  const [pengaturan, setPengaturan] = useState<Pengaturan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab') as 'periode' | 'kontak' | 'alamat' | 'banner' | null;
  const [activeTab, setActiveTab] = useState<'periode' | 'kontak' | 'alamat' | 'banner'>(tabParam || 'periode');
  const supabase = createClient();

  useEffect(() => {
    if (tabParam) setActiveTab(tabParam);
  }, [tabParam]);

  const handleTabChange = (tab: 'periode' | 'kontak' | 'alamat' | 'banner') => {
    setActiveTab(tab);
    router.replace(`/admin/pengaturan?tab=${tab}`, { scroll: false });
  };

  useEffect(() => {
    async function fetchSettings() {
      const { data, error } = await supabase
        .from('pengaturan_sistem')
        .select('*')
        .eq('id', 1)
        .single();
      
      if (data && !error) {
        setPengaturan(data);
      }

      setIsLoading(false);
    }
    fetchSettings();
  }, [supabase]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!pengaturan) return;
    setPengaturan({ ...pengaturan, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    if (!pengaturan) return;
    setIsSaving(true);
    
    const { error } = await supabase
      .from('pengaturan_sistem')
      .update({
        tahun_periode: pengaturan.tahun_periode,
        gel1_mulai: pengaturan.gel1_mulai,
        gel1_selesai: pengaturan.gel1_selesai,
        gel2_mulai: pengaturan.gel2_mulai,
        gel2_selesai: pengaturan.gel2_selesai,
        gel3_mulai: pengaturan.gel3_mulai,
        gel3_selesai: pengaturan.gel3_selesai,
        alamat_sekolah: pengaturan.alamat_sekolah,
        email_sekolah: pengaturan.email_sekolah,
        no_hp_sekolah: pengaturan.no_hp_sekolah,
        banner_url: pengaturan.banner_url,
      })
      .eq('id', 1);

    setIsSaving(false);
    
    if (!error) {
      alert('Pengaturan berhasil disimpan!');
      router.refresh();
    } else {
      alert('Gagal menyimpan pengaturan.');
      console.error(error);
    }
  };



  if (isLoading) {
    return <div className="p-8 text-center text-slate-500">Memuat pengaturan...</div>;
  }

  if (!pengaturan) {
    return <div className="p-8 text-center text-red-500">Data pengaturan tidak ditemukan. Pastikan migrasi sudah dijalankan.</div>;
  }

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h2 className="text-3xl font-black text-rose-950">Pengaturan Sistem</h2>
        <p className="text-slate-400 text-sm mt-1">
          Kelola periode akademik, jadwal gelombang, dan informasi sekolah.
        </p>
      </div>

      <div className="bg-white rounded-3xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-xl md:text-2xl font-bold text-rose-950">
            {activeTab === 'periode' && 'Pengaturan Periode & Gelombang'}
            {activeTab === 'kontak' && 'Pengaturan Informasi Kontak'}
            {activeTab === 'alamat' && 'Pengaturan Alamat Sekolah'}
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            {activeTab === 'periode' && 'Atur tahun akademik dan jadwal masing-masing gelombang pendaftaran.'}
            {activeTab === 'kontak' && 'Perbarui email dan nomor kontak resmi sekolah untuk pertanyaan pendaftar.'}
            {activeTab === 'alamat' && 'Sesuaikan lokasi fisik sekolah untuk kebutuhan administrasi.'}
          </p>
        </div>

        <div className="p-8">
          {activeTab === 'periode' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-rose-950 mb-2">Tahun Periode Pendaftaran</label>
                <Input
                  name="tahun_periode"
                  value={pengaturan.tahun_periode}
                  onChange={handleChange}
                  placeholder="Contoh: 2026/2027"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="p-5 rounded-2xl bg-slate-50/50 border border-slate-100">
                  <h4 className="font-bold text-rose-900 mb-4">Gelombang 1</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Tanggal Mulai</label>
                      <Input type="date" name="gel1_mulai" value={pengaturan.gel1_mulai} onChange={handleChange} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Tanggal Selesai</label>
                      <Input type="date" name="gel1_selesai" value={pengaturan.gel1_selesai} onChange={handleChange} />
                    </div>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-slate-50/50 border border-slate-100">
                  <h4 className="font-bold text-rose-900 mb-4">Gelombang 2</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Tanggal Mulai</label>
                      <Input type="date" name="gel2_mulai" value={pengaturan.gel2_mulai} onChange={handleChange} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Tanggal Selesai</label>
                      <Input type="date" name="gel2_selesai" value={pengaturan.gel2_selesai} onChange={handleChange} />
                    </div>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-slate-50/50 border border-slate-100 sm:col-span-2 lg:col-span-1">
                  <h4 className="font-bold text-rose-900 mb-4">Gelombang 3 (Daftar Ulang)</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Tanggal Mulai</label>
                      <Input type="date" name="gel3_mulai" value={pengaturan.gel3_mulai} onChange={handleChange} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Tanggal Selesai</label>
                      <Input type="date" name="gel3_selesai" value={pengaturan.gel3_selesai} onChange={handleChange} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'kontak' && (
            <div className="space-y-6 max-w-xl">
              <div>
                <label className="block text-sm font-semibold text-rose-950 mb-2">Email Sekolah</label>
                <Input
                  type="email"
                  name="email_sekolah"
                  value={pengaturan.email_sekolah}
                  onChange={handleChange}
                  placeholder="info@sekolah.com"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-rose-950 mb-2">Nomor HP / WhatsApp Pendaftaran</label>
                <Input
                  name="no_hp_sekolah"
                  value={pengaturan.no_hp_sekolah}
                  onChange={handleChange}
                  placeholder="0812-3456-7890"
                />
              </div>
            </div>
          )}

          {activeTab === 'alamat' && (
            <div className="space-y-6 max-w-xl">
              <div>
                <label className="block text-sm font-semibold text-rose-950 mb-2">Alamat Lengkap Sekolah</label>
                <Textarea
                  name="alamat_sekolah"
                  value={pengaturan.alamat_sekolah}
                  onChange={handleChange}
                  placeholder="Masukkan alamat lengkap dengan kecamatan dan kota"
                  rows={4}
                />
              </div>
            </div>
          )}


        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
          <Button onClick={handleSave} disabled={isSaving} className="bg-rose-900 hover:bg-rose-800 text-white">
            {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
          </Button>
        </div>
      </div>
    </div>
  );
}
