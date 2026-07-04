'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import Image from 'next/image';

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email wajib diisi')
    .email('Format email tidak valid'),
});

type LoginForm = z.infer<typeof loginSchema>;

/**
 * Halaman Login — menggunakan Magic Link (OTP via Email) dari Supabase Auth.
 * Setelah kirim link, tampilkan pesan sukses dan sembunyikan form.
 */
export default function LoginPage() {
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [tahunSingkat, setTahunSingkat] = useState('2026');
  const supabase = createClient();

  useEffect(() => {
    supabase.from('pengaturan_sistem').select('tahun_periode').eq('id', 1).single().then(({data}) => {
      if (data?.tahun_periode) {
        setTahunSingkat(data.tahun_periode.split('/')[0]);
      }
    });
  }, [supabase]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    const origin = window.location.origin;

    const { error } = await supabase.auth.signInWithOtp({
      email: data.email,
      options: {
        // Setelah klik link, user akan diarahkan ke /auth/callback
        emailRedirectTo: `${origin}/auth/callback`,
      },
    });

    if (error) {
      // Supabase kadang mengembalikan error "{}" jika konfigurasi Custom SMTP salah/gagal
      let errorMessage = error.message;
      if (!errorMessage || typeof errorMessage === 'object' || errorMessage === '{}') {
        errorMessage = 'Gagal mengirim email. Jika menggunakan Custom SMTP, periksa kembali pengaturan Host, Port, dan App Password di dashboard Supabase.';
      }

      setError('email', {
        type: 'manual',
        message: errorMessage,
      });
      return;
    }

    setSubmittedEmail(data.email);
    setIsSuccess(true);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center px-4 pt-24 pb-12 relative overflow-hidden">
      {/* Background Image — blurred */}
      <div
        className="absolute inset-0 bg-[url('/images/backgroundspmb.png')] bg-cover bg-center bg-no-repeat"
        style={{ filter: 'blur(4px)', transform: 'scale(1.05)' }}
      />
      {/* Subtle dark overlay for contrast */}
      <div className="absolute inset-0 bg-black/25 z-0" />

      <div className="relative z-10 w-full max-w-md">
        {/* Card */}
        <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl p-8 sm:p-10">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative w-20 h-20 mb-5">
              <Image 
                src="/images/logo_wu.png" 
                alt="Logo SPMB SMK Widya Utama" 
                fill
                className="object-cover"
                sizes="80px"
              />
            </div>
            <h1 className="text-2xl font-extrabold text-rose-900 text-center">
              Masuk ke SPMB SMK Widya Utama
            </h1>
            <p className="text-slate-500 text-sm text-center mt-1">
              SMK Widya Utama — Penerimaan Murid Baru {tahunSingkat}
            </p>
          </div>

          {isSuccess ? (
            /* ===== State Sukses ===== */
            <div className="animate-fade-in text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">
                Link Login Terkirim!
              </h2>
              <p className="text-slate-500 text-sm leading-relaxed mb-6">
                Link login telah dikirim ke{' '}
                <strong className="text-rose-900">{submittedEmail}</strong>.
                Silakan cek inbox atau folder{' '}
                <span className="font-medium">spam/junk</span> kamu.
              </p>

              <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-left">
                <p className="text-xs text-amber-700 flex items-start gap-2">
                  <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  Link berlaku selama 1 jam. Jika tidak menerima email dalam beberapa menit, coba cek folder spam atau kirim ulang.
                </p>
              </div>

              <button
                onClick={() => { setIsSuccess(false); setSubmittedEmail(''); }}
                className="mt-4 text-sm text-rose-700 hover:text-rose-900 underline transition-colors"
              >
                Gunakan email berbeda
              </button>
            </div>
          ) : (
            /* ===== Form Login ===== */
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
              <div>
                <p className="text-sm text-slate-600 mb-5 leading-relaxed text-center">
                  Masukkan email kamu. Kami akan mengirimkan link login — tanpa password!
                </p>
                <Input
                  {...register('email')}
                  id="email-input"
                  type="email"
                  label="Alamat Email"
                  placeholder="contoh@email.com"
                  error={errors.email?.message}
                  autoComplete="email"
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                isLoading={isSubmitting}
                id="btn-kirim-link"
              >
                {isSubmitting ? 'Mengirim...' : 'Kirim Link Login'}
                {!isSubmitting && (
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                )}
              </Button>

              <p className="text-xs text-slate-400 text-center">
                Dengan masuk, kamu menyetujui syarat dan ketentuan SPMB SMK Widya Utama.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
