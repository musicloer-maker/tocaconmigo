import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TocaConmigo Barcelona | Conecta con músicos aficionados para tocar juntos',
  description: 'Plataforma sencilla y privada para conectar músicos aficionados en Barcelona. Encuentra personas con las que improvisar, hacer una jam o pasar la tarde tocando en tu barrio.',
  keywords: ['músicos Barcelona', 'jam session Barcelona', 'tocar música aficionado', 'buscar guitarrista Barcelona', 'tocar juntos'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
