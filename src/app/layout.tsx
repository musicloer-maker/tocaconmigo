import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'TocaConmigo - Conecta con músicos',
  description: 'Encuentra otros músicos en tu zona y toca en directo',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className="bg-slate-950 text-slate-100 antialiased min-h-screen">
        {children}
      </body>
    </html>
  )
}