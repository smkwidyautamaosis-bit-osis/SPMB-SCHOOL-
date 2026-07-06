'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface FAQ {
  id: number;
  question: string;
  answer: string;
  created_at: string;
}

export default function FAQAdminPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [editingId, setEditingId] = useState<number | null>(null);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [waNumber, setWaNumber] = useState('');
  const [isSavingWa, setIsSavingWa] = useState(false);
  
  const supabase = createClient();
  const router = useRouter();

  const fetchData = async () => {
    setIsLoading(true);
    // Fetch FAQs
    const { data: faqsData, error: faqsError } = await supabase
      .from('faqs')
      .select('*')
      .order('created_at', { ascending: true });
      
    if (faqsError) {
      console.error('Error fetching faqs:', faqsError);
    } else {
      setFaqs(faqsData || []);
    }
    
    // Fetch Settings
    const { data: settingsData } = await supabase
      .from('pengaturan_sistem')
      .select('faq_wa_number')
      .eq('id', 1)
      .single();
      
    if (settingsData && settingsData.faq_wa_number) {
      setWaNumber(settingsData.faq_wa_number);
    }
    
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveWa = async () => {
    setIsSavingWa(true);
    const { error } = await supabase
      .from('pengaturan_sistem')
      .update({ faq_wa_number: waNumber })
      .eq('id', 1);
      
    setIsSavingWa(false);
    if (!error) {
      alert('Nomor WhatsApp Admin FAQ berhasil disimpan!');
      router.refresh();
    } else {
      alert('Gagal menyimpan nomor WhatsApp.');
      console.error(error);
    }
  };

  const openAddModal = () => {
    setEditingId(null);
    setQuestion('');
    setAnswer('');
    setIsModalOpen(true);
  };

  const openEditModal = (faq: FAQ) => {
    setEditingId(faq.id);
    setQuestion(faq.question);
    setAnswer(faq.answer);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setQuestion('');
    setAnswer('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !answer.trim()) return;

    if (editingId) {
      // Update
      const { error } = await supabase
        .from('faqs')
        .update({ question, answer })
        .eq('id', editingId);
        
      if (!error) {
        fetchData();
        closeModal();
      } else {
        alert('Gagal mengupdate FAQ.');
      }
    } else {
      // Create
      const { error } = await supabase
        .from('faqs')
        .insert([{ question, answer }]);
        
      if (!error) {
        fetchData();
        closeModal();
      } else {
        alert('Gagal menambah FAQ.');
      }
    }
    router.refresh();
  };

  const handleDelete = async (id: number) => {
    if (confirm('Apakah Anda yakin ingin menghapus FAQ ini?')) {
      const { error } = await supabase
        .from('faqs')
        .delete()
        .eq('id', id);
        
      if (!error) {
        fetchData();
        router.refresh();
      } else {
        alert('Gagal menghapus FAQ.');
      }
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Manajemen FAQ</h1>
          <p className="text-slate-500 text-sm mt-1">Kelola pertanyaan yang sering diajukan di halaman utama.</p>
        </div>
        <button
          onClick={openAddModal}
          className="bg-rose-800 hover:bg-rose-900 text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-sm flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Tambah FAQ
        </button>
      </div>

      {/* Pengaturan Kontak Admin FAQ */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-8 p-6">
        <h2 className="text-lg font-bold text-slate-800 mb-2">Pengaturan Kontak Admin FAQ</h2>
        <p className="text-sm text-slate-500 mb-4">
          Nomor ini akan digunakan pada tombol "Tanyakan ke Admin" di halaman utama. Gunakan format awal 0 atau 62 (contoh: 08123456789).
        </p>
        <div className="flex gap-4 items-end max-w-xl">
          <div className="flex-1">
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nomor WhatsApp</label>
            <input
              type="text"
              value={waNumber}
              onChange={(e) => setWaNumber(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition-shadow"
              placeholder="Contoh: 08123456789"
            />
          </div>
          <button
            onClick={handleSaveWa}
            disabled={isSavingWa}
            className="bg-[#25D366] hover:bg-[#128C7E] text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 h-[46px]"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
            </svg>
            {isSavingWa ? 'Menyimpan...' : 'Simpan Nomor'}
          </button>
        </div>
      </div>

      {/* Tampilan Tabel/List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="p-10 text-center text-slate-500">Memuat data FAQ...</div>
        ) : faqs.length === 0 ? (
          <div className="p-10 text-center text-slate-500 flex flex-col items-center">
            <svg className="w-12 h-12 text-slate-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <p>Belum ada FAQ yang ditambahkan.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-sm">
                <th className="py-4 px-6 font-semibold w-1/3">Pertanyaan</th>
                <th className="py-4 px-6 font-semibold w-1/2">Jawaban</th>
                <th className="py-4 px-6 font-semibold w-auto text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {faqs.map((faq) => (
                <tr key={faq.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                  <td className="py-4 px-6 align-top">
                    <p className="font-medium text-slate-800">{faq.question}</p>
                  </td>
                  <td className="py-4 px-6 align-top">
                    <p className="text-slate-600 text-sm line-clamp-3">{faq.answer}</p>
                  </td>
                  <td className="py-4 px-6 align-top text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => openEditModal(faq)}
                        className="text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 p-2 rounded-lg transition-colors"
                        title="Edit FAQ"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                      <button
                        onClick={() => handleDelete(faq.id)}
                        className="text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 p-2 rounded-lg transition-colors"
                        title="Hapus FAQ"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-lg text-slate-800">
                {editingId ? 'Edit FAQ' : 'Tambah FAQ Baru'}
              </h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Pertanyaan</label>
                <input
                  type="text"
                  required
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition-shadow"
                  placeholder="Contoh: Kapan batas akhir pendaftaran?"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Jawaban</label>
                <textarea
                  required
                  rows={4}
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition-shadow resize-none"
                  placeholder="Tuliskan jawaban yang lengkap di sini..."
                />
              </div>
              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-5 py-2.5 rounded-lg font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-lg font-medium text-white bg-rose-800 hover:bg-rose-900 shadow-sm transition-colors"
                >
                  {editingId ? 'Simpan Perubahan' : 'Simpan FAQ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
