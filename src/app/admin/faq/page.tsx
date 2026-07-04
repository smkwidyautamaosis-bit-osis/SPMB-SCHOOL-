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
            className="bg-amber-500 hover:bg-amber-600 text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-sm disabled:opacity-50 h-[46px]"
          >
            {isSavingWa ? 'Menyimpan...' : 'Simpan Nomor Admin'}
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
