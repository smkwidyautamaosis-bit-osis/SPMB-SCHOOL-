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
  const [banners, setBanners] = useState<{ id: string; url: string }[]>([]);
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

      const { data: bannerData } = await supabase
        .from('hero_images')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (bannerData) {
        setBanners(bannerData);
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

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !pengaturan) return;
    const file = e.target.files[0];
    setIsSaving(true);
    
    // Validasi file (hanya gambar, maks 2MB)
    if (!file.type.startsWith('image/')) {
      alert('File harus berupa gambar (JPG/PNG).');
      setIsSaving(false);
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert('Ukuran gambar maksimal 2MB.');
      setIsSaving(false);
      return;
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `banner_${Date.now()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('hero_images')
      .upload(fileName, file, { upsert: true });
      
    if (uploadError) {
      alert('Gagal mengupload gambar ke server.');
      console.error(uploadError);
      setIsSaving(false);
      return;
    }
    
    const { data: publicUrlData } = supabase.storage
      .from('hero_images')
      .getPublicUrl(fileName);
      
    const newBannerUrl = publicUrlData.publicUrl;
    
    // Insert into hero_images table
    const { error: dbError } = await supabase
      .from('hero_images')
      .insert([{ url: newBannerUrl }]);
      
    setIsSaving(false);
    
    if (!dbError) {
      // Re-fetch banners to get the latest list including the newly inserted one
      const { data: updatedBanners } = await supabase
        .from('hero_images')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (updatedBanners) {
        setBanners(updatedBanners);
      }
      
      alert('Banner berhasil diupload dan disimpan!');
      router.refresh();
    } else {
      alert(`Gambar terupload tapi gagal update database. Error: ${dbError?.message || 'Unknown error'}`);
      console.error(dbError);
    }
  };

  const handleDeleteBanner = async (bannerId: string, bannerUrl: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus banner ini?')) return;
    
    setIsSaving(true);
    
    // Extract filename from URL
    const fileName = bannerUrl.split('/').pop();
    
    if (fileName) {
      await supabase.storage.from('hero_images').remove([fileName]);
    }
    
    const { error } = await supabase.from('hero_images').delete().eq('id', bannerId);
    
    setIsSaving(false);
    
    if (!error) {
      setBanners(banners.filter((b) => b.id !== bannerId));
      alert('Banner berhasil dihapus.');
      router.refresh();
    } else {
      alert('Gagal menghapus banner.');
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
            {activeTab === 'banner' && 'Banner Halaman Utama'}
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            {activeTab === 'periode' && 'Atur tahun akademik dan jadwal masing-masing gelombang pendaftaran.'}
            {activeTab === 'kontak' && 'Perbarui email dan nomor kontak resmi sekolah untuk pertanyaan pendaftar.'}
            {activeTab === 'alamat' && 'Sesuaikan lokasi fisik sekolah untuk kebutuhan administrasi.'}
            {activeTab === 'banner' && 'Unggah gambar banner promosi kustom (dari Canva) untuk ditampilkan di Landing Page publik.'}
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

          {activeTab === 'banner' && (
            <div className="space-y-8 max-w-4xl">
              <div>
                <label className="block text-sm font-semibold text-rose-950 mb-2">Upload Banner Baru</label>
                
                {/* Panduan Rekomendasi */}
                <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl flex gap-3">
                  <span className="text-xl">💡</span>
                  <p className="text-sm text-amber-900 leading-relaxed">
                    <strong>Rekomendasi Ukuran Desain Canva:</strong> 1200 x 200 px atau 1200 x 250 px (Format: JPG/PNG, Maksimal 2MB) agar tampilan halaman utama presisi dan tidak pecah.
                  </p>
                </div>

                <div className="flex items-center justify-center w-full max-w-xl">
                  <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-48 border-2 border-slate-300 border-dashed rounded-2xl cursor-pointer bg-slate-50 hover:bg-slate-100 hover:border-amber-500 transition-all">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <svg className="w-8 h-8 mb-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      <p className="mb-2 text-sm text-slate-500"><span className="font-semibold text-rose-950">Klik untuk upload</span> atau drag and drop</p>
                      <p className="text-xs text-slate-500">PNG, JPG (Maks. 2MB)</p>
                    </div>
                    <input id="dropzone-file" type="file" accept="image/png, image/jpeg, image/jpg" className="hidden" onChange={handleBannerUpload} disabled={isSaving} />
                  </label>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-bold text-rose-950 mb-4 border-t pt-8 border-slate-100">Daftar Banner Aktif</h4>
                
                {banners.length === 0 ? (
                  <p className="text-sm text-slate-400 italic">Belum ada banner yang diupload. Silakan upload banner pertama Anda.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {banners.map((banner) => (
                      <div key={banner.id} className="relative group rounded-2xl overflow-hidden border border-slate-200 shadow-sm aspect-[5/1] md:aspect-[4/1]">
                        <img src={banner.url} alt="Banner" className="w-full h-full object-cover" />
                        
                        {/* Overlay dan Tombol Hapus */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button
                            onClick={() => handleDeleteBanner(banner.id, banner.url)}
                            disabled={isSaving}
                            className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-all shadow-lg"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Hapus Banner
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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
