import { Navbar } from '@/components/layout/Navbar';

/**
 * Layout untuk halaman publik (/, /login, /daftar, /status).
 * Menyertakan Navbar dan Footer.
 */
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <main className="flex-1">{children}</main>
    </>
  );
}
