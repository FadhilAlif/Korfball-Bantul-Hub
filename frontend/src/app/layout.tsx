import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { ServiceWorkerRegister } from "@/shared/components/common";
import { TOAST_OPTIONS } from "@/shared/lib/toast";
import { QueryProvider } from "@/shared/providers/QueryProvider";

export const viewport: Viewport = {
  themeColor: "#3981f6",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Korfball Hub — Korfball Bantul",
  description: "Platform Presensi Kehadiran & Live Game Statistics Korfball Bantul",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Korfball Hub",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

const geistSans = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-screen antialiased">
        <QueryProvider>{children}</QueryProvider>
        <ServiceWorkerRegister />
        <Toaster position="top-right" theme="system" gap={8} offset={16} toastOptions={TOAST_OPTIONS} />
      </body>
    </html>
  );
}
