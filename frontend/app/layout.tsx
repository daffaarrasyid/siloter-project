import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SILOTER - Sistem Pemantauan Angkot Ngetem Kota Bogor",
  description: "Sistem Informasi dan Deteksi Loitering Angkutan Umum Terpadu - Dishub Kota Bogor",
  icons: {
    icon: "/logo.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`h-full antialiased ${poppins.variable} ${poppins.className}`}>
      <body className={`${poppins.className} min-h-full flex flex-col text-slate-900 bg-white`}>
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
