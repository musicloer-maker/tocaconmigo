'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/Navbar'

interface Profile {
  id: string
  full_name: string
  username: string
  avatar_url: string
  bio: string
  video_url: string
  zone: string
  instruments: string[]
  genres: string[]
}

export default function FeedPage() {
  const supabase = createClient()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [matchNotification, setMatchNotification] = useState<Profile | null>(null)

  useEffect(() => {
    async function fetchProfiles() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setCurrentUserId(user.id)

      // Obtener perfiles que el usuario actual aún no ha evaluado (swiped)
      const { data: swipedData } = await supabase
        .from('swipes')
        .select('receiver_id')
        .eq('sender_id', user.id)

      const swipedIds = swipedData ? swipedData.map(s => s.receiver_id) : []
      const excludeIds = [...swipedIds, user.id]

      const { data: availableProfiles } = await supabase
        .from('profiles')
        .select('*')
        .not('id', 'in', `(${excludeIds.join(',')})`)
        .eq('is_configured', true)

      if (availableProfiles) {
        setProfiles(availableProfiles)
      }
      setLoading(false)
    }

    fetchProfiles()
  }, [supabase])

  const handleSwipe = async (type: 'like' | 'pass') => {
    if (!currentUserId || currentIndex >= profiles.length) return

    const targetProfile = profiles[currentIndex]

    // 1. Guardar el swipe en Supabase
    await supabase.from('swipes').insert({
      sender_id: currentUserId,
      receiver_id: targetProfile.id,
      type
    })

    // 2. Si es LIKE, verificar si hay MATCH mutuo
    if (type === 'like') {
      const { data: reciprocalLike } = await supabase
        .from('swipes')
        .select('*')
        .eq('sender_id', targetProfile.id)
        .eq('receiver_id', currentUserId)
        .eq('type', 'like')
        .single()

      if (reciprocalLike) {
        // Registrar el match
        await supabase.from('matches').insert({
          user1_id: currentUserId,
          user2_id: targetProfile.id
        })
        setMatchNotification(targetProfile)
      }
    }

    // Avanzar a la siguiente tarjeta
    setCurrentIndex(prev => prev + 1)
  }

  const currentProfile = profiles[currentIndex]

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col">
      <Navbar />

      <main className="flex-1 flex flex-col items-center justify-center p-4">
        {loading ? (
          <p className="text-stone-400">Cargando músicos cercanos...</p>
        ) : matchNotification ? (
          /* Modal o Pantalla de Match */
          <div className="bg-stone-900 border border-amber-500/40 p-8 rounded-2xl max-w-sm w-full text-center space-y-4 animate-in fade-in zoom-in duration-300">
            <h2 className="text-3xl font-black text-amber-500">¡ES UN MATCH! 🎉</h2>
            <p className="text-sm text-stone-300">
              Tú y <span className="font-semibold text-white">{matchNotification.full_name}</span> se han dado Me Gusta mutuamente.
            </p>
            <div className="w-24 h-24 mx-auto rounded-full overflow-hidden border-2 border-amber-500">
              <img src={matchNotification.avatar_url || '/placeholder.jpg'} alt="Match" className="w-full h-full object-cover" />
            </div>
            <button
              onClick={() => setMatchNotification(null)}
              className="w-full bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold py-3 rounded-xl transition"
            >
              Seguir explorando
            </button>
          </div>
        ) : currentProfile ? (
          /* Tarjeta de Músico */
          <div className="max-w-md w-full bg-stone-900 border border-stone-800 rounded-3xl overflow-hidden shadow-2xl space-y-4 pb-6">
            
            {/* Contenedor Multimedia: Foto o Video */}
            <div className="relative w-full h-80 bg-stone-950">
              {currentProfile.video_url ? (
                <video
                  src={currentProfile.video_url}
                  controls
                  className="w-full h-full object-cover"
                />
              ) : currentProfile.avatar_url ? (
                <img
                  src={currentProfile.avatar_url}
                  alt={currentProfile.full_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-stone-600">
                  Sin Archivos Multimedia
                </div>
              )}
              <div className="absolute bottom-3 left-3 bg-stone-950/80 backdrop-blur-md px-3 py-1 rounded-full border border-stone-800 text-xs font-semibold text-stone-300">
                📍 {currentProfile.zone}
              </div>
            </div>

            {/* Detalles del Usuario */}
            <div className="px-6 space-y-3">
              <div>
                <h2 className="text-2xl font-bold">{currentProfile.full_name}</h2>
                <p className="text-xs text-amber-500">@{currentProfile.username}</p>
              </div>

              {currentProfile.bio && (
                <p className="text-xs text-stone-400 line-clamp-3">{currentProfile.bio}</p>
              )}

              {/* Instrumentos */}
              <div>
                <span className="text-[10px] uppercase font-bold text-stone-500 tracking-wider">Instrumentos</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {currentProfile.instruments?.map((inst) => (
                    <span key={inst} className="bg-stone-800 text-stone-200 text-xs px-2.5 py-1 rounded-md">
                      {inst}
                    </span>
                  ))}
                </div>
              </div>

              {/* Géneros */}
              <div>
                <span className="text-[10px] uppercase font-bold text-stone-500 tracking-wider">Estilos</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {currentProfile.genres?.map((g) => (
                    <span key={g} className="bg-amber-950/60 border border-amber-800/50 text-amber-300 text-xs px-2.5 py-1 rounded-md">
                      {g}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Botones de Acción */}
            <div className="flex justify-center items-center gap-6 pt-2">
              <button
                onClick={() => handleSwipe('pass')}
                className="w-14 h-14 rounded-full bg-stone-800 hover:bg-red-950/50 border border-stone-700 hover:border-red-500 text-red-500 text-xl font-bold transition flex items-center justify-center shadow-lg"
              >
                ✕
              </button>
              <button
                onClick={() => handleSwipe('like')}
                className="w-14 h-14 rounded-full bg-amber-500 hover:bg-amber-400 text-stone-950 text-2xl font-bold transition flex items-center justify-center shadow-lg"
              >
                ♥
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center space-y-3">
            <p className="text-xl font-semibold text-stone-300">¡Has visto todos los perfiles disponibles!</p>
            <p className="text-xs text-stone-500">Vuelve más tarde para descubrir más músicos cerca de ti.</p>
          </div>
        )}
      </main>
    </div>
  )
}