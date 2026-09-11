'use client'

import { useEffect, useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/Navbar'
import { addContact } from '@/app/actions/contacts'

interface Profile {
  id: string
  full_name: string
  display_name?: string
  username: string
  avatar_url: string
  bio: string
  video_url: string
  zone: string
  location_zone?: string
  instruments: string[]
  genres: string[]
}

export default function FeedPage() {
  const supabase = createClient()
  const [myProfile, setMyProfile] = useState<Profile | null>(null)
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [savedContactIds, setSavedContactIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  // Estados para los filtros
  const [searchTerm, setSearchTerm] = useState('')
  const [instrumentFilter, setInstrumentFilter] = useState('')
  const [zoneFilter, setZoneFilter] = useState('')

  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    async function fetchData() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return
      setCurrentUserId(user.id)

      // 1. Obtener mi propio perfil
      const { data: userSelfProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (userSelfProfile) {
        setMyProfile(userSelfProfile)
      }

      // 2. Obtener lista de IDs de contactos que ya tengo guardados
      const { data: contactsData } = await supabase
        .from('contacts')
        .select('contact_id')
        .eq('user_id', user.id)

      if (contactsData) {
        setSavedContactIds(contactsData.map((c) => c.contact_id))
      }

      // 3. Obtener todos los músicos configurados (directorio permanente)
      const { data: availableProfiles } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', user.id)
        .eq('is_configured', true)

      if (availableProfiles) {
        setProfiles(availableProfiles)
      }
      setLoading(false)
    }

    fetchData()
  }, [supabase])

  // Función para guardar contacto llamando a la Server Action del Paso 2
  const handleSaveContact = async (contactId: string) => {
    try {
      await addContact(contactId)
      setSavedContactIds((prev) => [...prev, contactId])
    } catch (err) {
      console.error('Error al guardar contacto:', err)
    }
  }

  // Filtrado local instantáneo de los músicos
  const filteredProfiles = profiles.filter((p) => {
    const name = p.display_name || p.full_name || ''
    const matchesSearch =
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.bio?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesInstrument = instrumentFilter
      ? p.instruments?.some((inst) =>
          inst.toLowerCase().includes(instrumentFilter.toLowerCase())
        )
      : true

    const zoneText = p.location_zone || p.zone || ''
    const matchesZone = zoneFilter
      ? zoneText.toLowerCase().includes(zoneFilter.toLowerCase())
      : true

    return matchesSearch && matchesInstrument && matchesZone
  })

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto w-full p-4 space-y-6">
        {/* --- SECCIÓN: MI PERFIL (ASÍ TE VEN LOS OTROS) --- */}
        {myProfile && (
          <section className="bg-stone-900 border border-amber-500/30 rounded-2xl p-4 shadow-xl space-y-3">
            <div className="flex justify-between items-center border-b border-stone-800 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-500">
                Así te ven otros músicos en el directorio
              </span>
              <a href="/profile" className="text-xs text-stone-400 hover:text-white underline">
                Editar perfil
              </a>
            </div>

            <div className="flex items-center gap-3">
              {myProfile.avatar_url ? (
                <img
                  src={myProfile.avatar_url}
                  alt={myProfile.full_name}
                  className="w-14 h-14 rounded-full object-cover border-2 border-amber-500"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-stone-800 flex items-center justify-center text-amber-500 font-bold text-lg border border-stone-700">
                  {myProfile.full_name?.charAt(0) || 'M'}
                </div>
              )}

              <div>
                <h3 className="font-bold text-stone-100 text-lg leading-tight">
                  {myProfile.full_name}
                </h3>
                <p className="text-xs text-amber-500">@{myProfile.username}</p>
                {(myProfile.location_zone || myProfile.zone) && (
                  <p className="text-[11px] text-stone-400">
                    📍 {myProfile.location_zone || myProfile.zone}
                  </p>
                )}
              </div>
            </div>
          </section>
        )}

        {/* --- SECCIÓN: BARRA DE BÚSQUEDA Y FILTROS --- */}
        <div className="bg-stone-900 border border-stone-800 p-4 rounded-2xl flex flex-wrap gap-3 items-center shadow-lg">
          <input
            type="text"
            placeholder="Buscar por nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-stone-950 text-stone-100 px-4 py-2.5 rounded-xl border border-stone-800 flex-1 min-w-[200px] text-sm focus:outline-none focus:border-amber-500 placeholder-stone-500"
          />
          <input
            type="text"
            placeholder="Instrumento (ej. Guitarra)"
            value={instrumentFilter}
            onChange={(e) => setInstrumentFilter(e.target.value)}
            className="bg-stone-950 text-stone-100 px-4 py-2.5 rounded-xl border border-stone-800 w-full sm:w-48 text-sm focus:outline-none focus:border-amber-500 placeholder-stone-500"
          />
          <input
            type="text"
            placeholder="Zona o Ciudad"
            value={zoneFilter}
            onChange={(e) => setZoneFilter(e.target.value)}
            className="bg-stone-950 text-stone-100 px-4 py-2.5 rounded-xl border border-stone-800 w-full sm:w-48 text-sm focus:outline-none focus:border-amber-500 placeholder-stone-500"
          />
        </div>

        {/* --- SECCIÓN: DIRECTORIO PÚBLICO PERMANENTE --- */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-stone-200">
            Directorio de Músicos ({filteredProfiles.length})
          </h2>

          {loading ? (
            <p className="text-stone-400 text-center py-8">Cargando directorio de músicos...</p>
          ) : filteredProfiles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredProfiles.map((profile) => {
                const isSaved = savedContactIds.includes(profile.id)

                return (
                  <div
                    key={profile.id}
                    className="bg-stone-900 border border-stone-800 rounded-2xl p-5 flex flex-col justify-between shadow-xl space-y-4"
                  >
                    <div className="space-y-3">
                      {/* Cabecera del perfil */}
                      <div className="flex items-center gap-3">
                        {profile.avatar_url ? (
                          <img
                            src={profile.avatar_url}
                            alt={profile.full_name}
                            className="w-14 h-14 rounded-full object-cover border border-amber-500/40"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-full bg-stone-800 flex items-center justify-center text-amber-500 font-bold text-lg border border-stone-700">
                            {(profile.full_name || 'M').charAt(0)}
                          </div>
                        )}
                        <div>
                          <h3 className="font-bold text-stone-100 text-base leading-tight">
                            {profile.display_name || profile.full_name}
                          </h3>
                          <p className="text-xs text-amber-500">@{profile.username}</p>
                          <p className="text-xs text-stone-400 mt-0.5">
                            📍 {profile.location_zone || profile.zone || 'Sin ubicación'}
                          </p>
                        </div>
                      </div>

                      {/* Bio */}
                      {profile.bio && (
                        <p className="text-xs text-stone-300 line-clamp-2 leading-relaxed">
                          {profile.bio}
                        </p>
                      )}

                      {/* Instrumentos */}
                      {profile.instruments && profile.instruments.length > 0 && (
                        <div>
                          <span className="text-[10px] uppercase font-bold text-stone-500 tracking-wider">
                            Instrumentos
                          </span>
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {profile.instruments.map((inst) => (
                              <span
                                key={inst}
                                className="bg-stone-800 text-stone-200 text-xs px-2.5 py-0.5 rounded-md border border-stone-700"
                              >
                                {inst}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Vídeo de presentación si existe */}
                      {profile.video_url && (
                        <div className="rounded-xl overflow-hidden border border-stone-800 bg-stone-950 max-h-36">
                          <video
                            src={profile.video_url}
                            controls
                            className="w-full h-36 object-cover"
                          />
                        </div>
                      )}
                    </div>

                    {/* BOTONES DIRECTOS (SIN MATCH) */}
                    <div className="pt-3 border-t border-stone-800 flex gap-2">
                      <button
                        onClick={() => handleSaveContact(profile.id)}
                        disabled={isSaved}
                        className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                          isSaved
                            ? 'bg-stone-800 text-stone-500 cursor-not-allowed border border-stone-700'
                            : 'bg-stone-800 hover:bg-stone-700 text-amber-500 border border-amber-500/30'
                        }`}
                      >
                        {isSaved ? '✓ En tu Agenda' : '➕ Guardar Contacto'}
                      </button>

                      <a
                        href={`/messages?user=${profile.id}`}
                        className="flex-1 bg-amber-500 hover:bg-amber-400 text-stone-950 py-2 px-3 rounded-xl text-xs font-bold text-center transition flex items-center justify-center gap-1.5"
                      >
                        💬 Contactar
                      </a>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12 bg-stone-900 border border-stone-800 rounded-2xl">
              <p className="text-stone-300 font-semibold">No se encontraron músicos.</p>
              <p className="text-xs text-stone-500 mt-1">Prueba a cambiar tus filtros de búsqueda.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}