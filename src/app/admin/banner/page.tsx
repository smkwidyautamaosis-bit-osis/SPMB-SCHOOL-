'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function BannerAdminPage() {
  const [banners, setBanners] = useState<{ id: string; url: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function fetchBanners() {
      const { data: bannerData } = await supabase
        .from('hero_images')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (bannerData) {
        setBanners(bannerData);
      }

      setIsLoading(false);
    }
    fetchBanners();
  }, [supabase]);

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
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
    return <div className="p-8 text-center text-slate-500">Memuat data banner...</div>;
  }

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h2 className="text-3xl font-black text-rose-950">Kelola Banner</h2>
        <p className="text-slate-400 text-sm mt-1">
          Unggah gambar banner promosi kustom (dari Canva) untuk ditampilkan di Landing Page publik.
        </p>
      </div>

      <div className="bg-white rounded-3xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="p-8">
          <div className="space-y-8">
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
        </div>
      </div>
    </div>
  );
}
