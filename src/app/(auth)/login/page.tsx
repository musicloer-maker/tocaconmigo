'use client'

import { useState, Suspense } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const searchParams = useSearchParams()
  const isBanned = searchParams.get('banned') === 'true'

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Login tradicional con Email y Contraseña
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setMessage(`Error: ${error.message}`)
    } else {
      window.location.href = '/feed'
    }
    setLoading(false)
  }

  // Login con Google OAuth
  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  return (
    <div className="w-full max-w-md bg-stone-900 border border-stone-800 rounded-2xl p-8 shadow-2xl">
      <div className="text-center mb-6">
        <div className="flex justify-center items-center gap-2 text-2xl font-bold text-amber-500 mb-2">
          <span>TocaConmigo</span>
          <span className="text-amber-600 text-xl">»))</span>
        </div>
        <h1 className="text-xl font-bold text-stone-100">¡Hola de nuevo!</h1>
        <p className="text-stone-400 text-xs mt-1">Inicia sesión para conectar con músicos</p>
      </div>

      {/* Cartel de aviso si la cuenta fue suspendida */}
      {isBanned && (
        <div className="mb-6 p-3 bg-red-950/80 border border-red-800 rounded-xl text-red-200 text-xs font-medium text-center flex items-center justify-center gap-2">
          <span>🚫</span>
          <span>Tu cuenta ha sido suspendida permanentemente por incumplir las normas de conducta de la comunidad.</span>
        </div>
      )}

      {/* Botón de Google */}
      <button
        onClick={handleGoogleLogin}
        type="button"
        className="w-full bg-white hover:bg-stone-100 text-stone-900 font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-3 transition shadow-md mb-6 text-sm"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
        </svg>
        Continuar con Google
      </button>

      <div className="relative my-6 text-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-stone-800"></div>
        </div>
        <span className="relative bg-stone-900 px-3 text-xs text-stone-500 uppercase tracking-wider">
          o con tu correo
        </span>
      </div>

      {/* Formulario tradicional */}
      <form onSubmit={handleEmailLogin} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-stone-300 mb-1">
            Correo electrónico
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-2.5 text-stone-100 placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="block text-xs font-medium text-stone-300">Contraseña</label>
            <Link href="/forgot-password" className="text-xs text-amber-500 hover:underline">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-2.5 text-stone-100 placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
          />
        </div>

        {message && (
          <p className="text-xs text-red-400 bg-red-950/50 border border-red-900/50 p-2.5 rounded-lg text-center">
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold py-3 px-4 rounded-xl transition shadow-lg disabled:opacity-50 text-sm"
        >
          {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
        </button>
      </form>

      <div className="mt-6 text-center text-xs text-stone-400">
        ¿No tienes cuenta?{' '}
        <Link href="/register" className="text-amber-500 hover:underline font-medium">
          Regístrate aquí
        </Link>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-950 p-4">
      <Suspense fallback={<div className="text-stone-400 text-xs">Cargando...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  )
}