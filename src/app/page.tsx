import Image from 'next/image'
import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col justify-between">
      {/* Header Público */}
      <header className="px-6 py-5 border-b border-stone-800 flex justify-between items-center max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2 text-2xl font-bold tracking-tight text-amber-500">
          <span>TocaConmigo</span>
          <span className="text-amber-600 text-xl">»))</span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-sm font-medium text-stone-300 hover:text-amber-400 transition"
          >
            Iniciar Sesión
          </Link>
          <Link
            href="/register"
            className="text-sm font-semibold bg-amber-600 hover:bg-amber-500 text-stone-950 px-4 py-2 rounded-full transition"
          >
            Crear Cuenta
          </Link>
        </div>
      </header>

      {/* Hero Section con la Imagen Oficial */}
      <main className="max-w-7xl mx-auto px-6 py-12 flex-1 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          {/* Texto Descriptivo y Propósito */}
          <div className="space-y-6">
            <span className="inline-block px-3 py-1 bg-amber-950/80 border border-amber-800/50 text-amber-400 text-xs font-semibold uppercase tracking-wider rounded-full">
              Comunidad de Músicos
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-stone-100 leading-tight">
              Encuentra otros músicos y toca en directo.
            </h1>
            <p className="text-stone-400 text-lg leading-relaxed">
              El objetivo de <strong className="text-stone-200">TocaConmigo</strong> es conectar a personas que buscan armar una Jam, formar una banda o simplemente juntarse y divertirse haciendo música.
            </p>
            
            <div className="space-y-3 text-sm text-stone-300">
              <div className="flex items-center gap-3">
                <span className="text-amber-500 font-bold">✓</span>
                <span>Ubicación aproximada por zona para cuidar al 100% tu privacidad.</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-amber-500 font-bold">✓</span>
                <span>Sube tu video de presentación tocando tu instrumento.</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-amber-500 font-bold">✓</span>
                <span>Conecta por estilos musicales e instrumentos compatibles.</span>
              </div>
            </div>

            <div className="pt-4 flex flex-wrap gap-4">
              <Link
                href="/register"
                className="bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold px-8 py-3.5 rounded-xl shadow-lg transition text-center"
              >
                Unirme a la comunidad
              </Link>
              <Link
                href="/login"
                className="border border-stone-700 hover:border-stone-500 text-stone-200 font-semibold px-8 py-3.5 rounded-xl transition text-center"
              >
                Ya tengo cuenta
              </Link>
            </div>
          </div>

          {/* Imagen Promocional */}
          <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-stone-800">
            <Image
              src="/og-image.png"
              alt="Músicos tocando juntos en Barcelona"
              width={1200}
              height={675}
              priority
              className="w-full h-auto object-cover"
            />
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-900 py-6 text-center text-xs text-stone-500">
        © {new Date().getFullYear()} TocaConmigo. Privacidad garantizada para todos los músicos.
      </footer>
    </div>
  )
}