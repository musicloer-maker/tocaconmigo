'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [unreadCount, setUnreadCount] = useState<number>(0)

  useEffect(() => {
    async function loadUserData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Cargar foto de perfil para la barra
      const { data: profile } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', user.id)
        .single()

      if (profile) setAvatarUrl(profile.avatar_url)
    }

    loadUserData()
  }, [supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const navLinks = [
    { label: '🔥 Descubrir', href: '/feed' },
    { label: '💬 Matches', href: '/matches' },
    { label: '👤 Perfil', href: '/profile' },
  ]

  return (
    <header className="w-full bg-stone-900/80 backdrop-blur-md border-b border-stone-800 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
        
        {/* LOGO */}
        <Link href="/feed" className="flex items-center gap-2">
          <span className="text-2xl font-black bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent tracking-wider">
            TocaConmigo
          </span>
        </Link>

        {/* MENÚ NAVEGACIÓN */}
        <nav className="flex items-center gap-1 sm:gap-2">
          {navLinks.map((link) => {
            const isActive = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
                  isActive
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                    : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'
                }`}
              >
                {link.label}
              </Link>
            )
          })}
        </nav>

        {/* USUARIO & LOGOUT */}
        <div className="flex items-center gap-3">
          {avatarUrl && (
            <Link href="/profile" className="hidden sm:block">
              <img
                src={avatarUrl}
                alt="Mi Perfil"
                className="w-8 h-8 rounded-full object-cover border border-amber-500/40 hover:scale-105 transition"
              />
            </Link>
          )}

          <button
            onClick={handleLogout}
            className="text-xs font-semibold text-stone-400 hover:text-red-400 border border-stone-800 hover:border-red-950 px-3 py-1.5 rounded-lg transition"
          >
            Salir
          </button>
        </div>

      </div>
    </header>
  )
}