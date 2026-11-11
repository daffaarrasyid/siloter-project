import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "SILOTER - Sistem Pemantauan Angkot Ngetem Kota Bogor",
  description: "Sistem Informasi dan Deteksi Loitering Angkutan Umum Terpadu - Dishub Kota Bogor",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col font-sans text-slate-900 bg-white">
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
