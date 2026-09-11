// src/app/layout.tsx
import type { Metadata, Viewport } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: 'TocaConmigo Barcelona | Conecta con músicos aficionados para tocar juntos',
  description: 'Plataforma sencilla y privada para conectar músicos aficionados en Barcelona.',
  keywords: ['músicos Barcelona', 'jam session Barcelona', 'tocar música aficionado'],
  metadataBase: new URL('https://tocaconmigo.vercel.app'),
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: 'TocaConmigo Barcelona | Conecta con músicos aficionados',
    description: 'Plataforma sencilla y privada para conectar músicos aficionados en Barcelona.',
    url: 'https://tocaconmigo.vercel.app',
    siteName: 'TocaConmigo',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'TocaConmigo Barcelona',
      },
    ],
    locale: 'es_ES',
    type: 'website',
  },
  verification: {
    google: 'P_a6Ry1i16DeOrTTvWtwGwb6mp8k4ZA0aAI8VlaLNiE',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="overflow-x-hidden">
      <body className="overflow-x-hidden max-w-full m-0 p-0">
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  );
}