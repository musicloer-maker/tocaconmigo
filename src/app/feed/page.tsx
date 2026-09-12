'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/Navbar'
import { Search, MessageSquare, MapPin, Music, User, UserPlus, Check, AlertCircle } from 'lucide-react'

type Profile = {
  id: string
  display_name: string
  full_name?: string
  username: string
  location?: string
  instrument?: string
  genres?: string
  bio?: string
  avatar_url?: string
  video_url?: string
}

export default function FeedPage() {
  const router = useRouter()
  const supabase = createClient()

  const [profiles, setProfiles] = useState<Profile[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  // Estado para gestionar los IDs de los contactos agregados y en proceso
  const [contactIds, setContactIds] = useState<Set<string>>(new Set())
  const [addingContactId, setAddingContactId] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    const fetchUserAndProfiles = async () => {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        if (userError || !user) {
          router.push('/login')
          return
        }

        if (isMounted) setCurrentUserId(user.id)

        // 1. Cargar la lista de contactos del usuario actual
        const { data: contactsData, error: contactsError } = await supabase
          .from('contacts')
          .select('contact_id')
          .eq('user_id', user.id)

        if (!contactsError && contactsData && isMounted) {
          const ids = new Set(contactsData.map((c: { contact_id: string }) => c.contact_id))
          setContactIds(ids)
        }

        // 2. Cargar todos los perfiles de músicos
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) {
          console.error('Error al consultar Supabase:', error)
          if (isMounted) {
            setErrorMessage('Error de lectura en la base de datos (verifica las políticas RLS en Supabase).')
          }
        } else if (data && isMounted) {
          setProfiles(data)
        }
      } catch (err: any) {
        console.error('Error inesperado:', err)
        if (isMounted) setErrorMessage(err.message || 'Error inesperado al cargar perfiles.')
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchUserAndProfiles()

    return () => {
      isMounted = false
    }
  }, [router, supabase])

  // Función para añadir a un músico a la lista de contactos
  const handleAddContact = async (contactId: string) => {
    if (!currentUserId || contactIds.has(contactId) || addingContactId) return

    setAddingContactId(contactId)
    try {
      const { error } = await supabase.from('contacts').insert([
        {
          user_id: currentUserId,
          contact_id: contactId,
        },
      ])

      if (error) {
        console.error('Error al agregar contacto:', error)
      } else {
        setContactIds((prev) => new Set(prev).add(contactId))
      }
    } catch (err) {
      console.error('Error al intentar guardar contacto:', err)
    } finally {
      setAddingContactId(null)
    }
  }

  const filteredProfiles = profiles.filter((p) => {
    const query = search.toLowerCase()
    return (
      (p.display_name && p.display_name.toLowerCase().includes(query)) ||
      (p.username && p.username.toLowerCase().includes(query)) ||
      (p.location && p.location.toLowerCase().includes(query)) ||
      (p.instrument && p.instrument.toLowerCase().includes(query)) ||
      (p.genres && p.genres.toLowerCase().includes(query))
    )
  })

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans">
      <Navbar />

      <main className="max-w-6xl mx-auto w-full p-4 md:p-6 flex-1 flex flex-col space-y-6">
        {/* Cabecera y Buscador */}
        <div className="bg-stone-900 p-4 md:p-6 rounded-2xl border border-stone-800 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center shadow-xl">
          <div>
            <h1 className="text-xl font-black text-amber-500 tracking-tight">
              Directorio de Músicos
            </h1>
            <p className="text-xs text-stone-400 mt-1">
              Conecta, guarda contactos e inicia conversación directa con músicos cerca de ti.
            </p>
          </div>

          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por instrumento, ciudad o estilo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-stone-950 border border-stone-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-stone-200 focus:outline-none focus:border-amber-500 placeholder-stone-500"
            />
          </div>
        </div>

        {/* Mensaje de Error en caso de fallo de permisos/RLS */}
        {errorMessage && (
          <div className="bg-red-950/40 border border-red-800/60 p-4 rounded-xl flex items-center gap-3 text-red-300 text-xs">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Lista permanente de usuarios */}
        {loading ? (
          <div className="text-center py-20 text-xs text-stone-500">
            Cargando directorio de músicos...
          </div>
        ) : filteredProfiles.length === 0 ? (
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-12 text-center text-stone-400 text-xs flex flex-col items-center gap-3">
            <User className="w-8 h-8 opacity-40 text-amber-500" />
            <p>
              {search
                ? 'No se encontraron músicos con esos criterios de búsqueda.'
                : 'No se encontraron perfiles registrados en la base de datos.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProfiles.map((p) => {
              const isMe = p.id === currentUserId
              const isContact = contactIds.has(p.id)
              const isAdding = addingContactId === p.id

              return (
                <div
                  key={p.id}
                  className={`bg-stone-900 border rounded-2xl p-5 flex flex-col justify-between space-y-4 transition shadow-lg ${
                    isMe
                      ? 'border-amber-500/50 bg-stone-900/90'
                      : 'border-stone-800 hover:border-amber-500/40'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-stone-800 border border-stone-700 overflow-hidden flex items-center justify-center shrink-0">
                        {p.avatar_url ? (
                          <img
                            src={p.avatar_url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-6 h-6 text-amber-500" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-stone-100 truncate">
                            {p.display_name || p.full_name || 'Músico'}
                          </h3>
                          {isMe && (
                            <span className="text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded font-semibold shrink-0">
                              Tú
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-amber-500 truncate">
                          @{p.username || 'usuario'}
                        </p>
                        {p.location && (
                          <p className="text-[10px] text-stone-400 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-stone-500 shrink-0" />
                            <span className="truncate">{p.location}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {p.instrument && (
                      <div className="flex items-center gap-1.5 text-xs text-stone-300 bg-stone-950 p-2.5 rounded-xl border border-stone-800/80">
                        <Music className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span className="font-semibold truncate">{p.instrument}</span>
                        {p.genres && (
                          <span className="text-stone-500 truncate">• {p.genres}</span>
                        )}
                      </div>
                    )}

                    {p.bio && (
                      <p className="text-xs text-stone-400 line-clamp-3 leading-relaxed">
                        {p.bio}
                      </p>
                    )}

                    {p.video_url && (
                      <div className="rounded-xl overflow-hidden bg-black aspect-video border border-stone-800 mt-2">
                        <video
                          src={p.video_url}
                          controls
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>

                  {/* Acciones de la tarjeta */}
                  {!isMe ? (
                    <div className="flex gap-2 mt-2">
                      {/* Botón Guardar Contacto */}
                      <button
                        onClick={() => handleAddContact(p.id)}
                        disabled={isContact || isAdding}
                        className={`flex-1 py-2.5 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 border ${
                          isContact
                            ? 'bg-stone-950 text-emerald-400 border-emerald-900/50 cursor-default'
                            : 'bg-stone-800 hover:bg-stone-700 text-stone-200 border-stone-700'
                        }`}
                      >
                        {isContact ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Contacto</span>
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-3.5 h-3.5 text-stone-400" />
                            <span>{isAdding ? 'Añadiendo...' : 'Añadir'}</span>
                          </>
                        )}
                      </button>

                      {/* Botón Enviar Mensaje */}
                      <button
                        onClick={() => router.push(`/messages?user=${p.id}`)}
                        className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Mensaje</span>
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => router.push('/profile')}
                      className="w-full py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-xs rounded-xl transition text-center mt-2 border border-stone-700"
                    >
                      Editar mi perfil
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}