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

  // Estados para los filtros dinámicos (Opción 1: Cliente)
  const [searchTerm, setSearchTerm] = useState('')
  const [instrumentFilter, setInstrumentFilter] = useState('')
  const [genreFilter, setGenreFilter] = useState('')
  const [zoneFilter, setZoneFilter] = useState('')

  // Modal de reporte / moderación
  const [reportingUser, setReportingUser] = useState<Profile | null>(null)
  const [reportReason, setReportReason] = useState('Lenguaje inapropiado / soez')
  const [reportDetails, setReportDetails] = useState('')
  const [reportSending, setReportSending] = useState(false)
  const [reportSuccess, setReportSuccess] = useState(false)

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

      // 2. Obtener lista de IDs de contactos guardados
      const { data: contactsData } = await supabase
        .from('contacts')
        .select('contact_id')
        .eq('user_id', user.id)

      if (contactsData) {
        setSavedContactIds(contactsData.map((c) => c.contact_id))
      }

      // 3. Obtener todos los músicos (directorio permanente)
      const { data: availableProfiles } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', user.id)

      if (availableProfiles) {
        setProfiles(availableProfiles)
      }
      setLoading(false)
    }

    fetchData()
  }, [supabase])

  // Guardar contacto
  const handleSaveContact = async (contactId: string) => {
    try {
      await addContact(contactId)
      setSavedContactIds((prev) => [...prev, contactId])
    } catch (err) {
      console.error('Error al guardar contacto:', err)
    }
  }

  // Enviar denuncia a moderación
  const handleSendReport = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reportingUser || !currentUserId) return

    setReportSending(true)
    const { error } = await supabase.from('reports').insert([
      {
        reporter_id: currentUserId,
        reported_user_id: reportingUser.id,
        reason: reportReason,
        details: reportDetails,
      },
    ])

    setReportSending(false)
    if (!error) {
      setReportSuccess(true)
      setTimeout(() => {
        setReportingUser(null)
        setReportSuccess(false)
        setReportDetails('')
      }, 2000)
    } else {
      alert('Error al enviar la denuncia. Inténtalo de nuevo.')
    }
  }

  // Función para resetear todos los filtros
  const handleResetFilters = () => {
    setSearchTerm('')
    setInstrumentFilter('')
    setGenreFilter('')
    setZoneFilter('')
  }

  // Filtrado local en tiempo real (Opción 1)
  const filteredProfiles = profiles.filter((p) => {
    const name = p.display_name || p.full_name || ''
    const username = p.username || ''
    const matchesSearch =
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.bio?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesInstrument = instrumentFilter
      ? p.instruments?.some((inst) =>
          inst.toLowerCase().includes(instrumentFilter.toLowerCase())
        )
      : true

    const matchesGenre = genreFilter
      ? p.genres?.some((g) =>
          g.toLowerCase().includes(genreFilter.toLowerCase())
        )
      : true

    const zoneText = p.location_zone || p.zone || ''
    const matchesZone = zoneFilter
      ? zoneText.toLowerCase().includes(zoneFilter.toLowerCase())
      : true

    return matchesSearch && matchesInstrument && matchesGenre && matchesZone
  })

  const hasActiveFilters = searchTerm || instrumentFilter || genreFilter || zoneFilter

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto w-full p-4 space-y-6">
        {/* --- BANNER: NORMAS DE LA COMUNIDAD --- */}
        <section className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 text-xs text-amber-200/90 leading-relaxed">
          <p className="font-bold text-amber-400 text-sm mb-1">
            📜 Normas de la Comunidad TocaConmigo
          </p>
          Espacio exclusivo para músicos y colaboración musical. Se prohíbe estrictamente el lenguaje soez, despectivo, de naturaleza sexual, así como fotos o vídeos de desnudez explícita. El incumplimiento conlleva la **expulsión inmediata y permanente** de la plataforma.
        </section>

        {/* --- SECCIÓN: MI PERFIL --- */}
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

        {/* --- BARRA DE FILTROS AVANZADOS --- */}
        <section className="bg-stone-900 border border-stone-800 p-4 rounded-2xl space-y-3 shadow-lg">
          <div className="flex justify-between items-center">
            <h2 className="text-xs font-bold text-stone-400 uppercase tracking-wider">
              🔍 Filtrar Directorio de Músicos
            </h2>
            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="text-xs text-amber-500 hover:text-amber-400 font-semibold underline"
              >
                Limpiar filtros
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <input
              type="text"
              placeholder="Buscar por nombre o @user..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-stone-950 text-stone-100 px-4 py-2.5 rounded-xl border border-stone-800 text-sm focus:outline-none focus:border-amber-500 placeholder-stone-500"
            />
            <input
              type="text"
              placeholder="Instrumento (ej. Batería)"
              value={instrumentFilter}
              onChange={(e) => setInstrumentFilter(e.target.value)}
              className="bg-stone-950 text-stone-100 px-4 py-2.5 rounded-xl border border-stone-800 text-sm focus:outline-none focus:border-amber-500 placeholder-stone-500"
            />
            <input
              type="text"
              placeholder="Género (ej. Rock, Jazz)"
              value={genreFilter}
              onChange={(e) => setGenreFilter(e.target.value)}
              className="bg-stone-950 text-stone-100 px-4 py-2.5 rounded-xl border border-stone-800 text-sm focus:outline-none focus:border-amber-500 placeholder-stone-500"
            />
            <input
              type="text"
              placeholder="Ciudad / Zona"
              value={zoneFilter}
              onChange={(e) => setZoneFilter(e.target.value)}
              className="bg-stone-950 text-stone-100 px-4 py-2.5 rounded-xl border border-stone-800 text-sm focus:outline-none focus:border-amber-500 placeholder-stone-500"
            />
          </div>
        </section>

        {/* --- DIRECTORIO PÚBLICO --- */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-stone-200">
              Directorio de Músicos
            </h2>
            <span className="text-xs font-semibold bg-stone-800 border border-stone-700 text-amber-500 px-3 py-1 rounded-full">
              {filteredProfiles.length} {filteredProfiles.length === 1 ? 'músico' : 'músicos'}
            </span>
          </div>

          {loading ? (
            <p className="text-stone-400 text-center py-8">Cargando directorio de músicos...</p>
          ) : filteredProfiles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredProfiles.map((profile) => {
                const isSaved = savedContactIds.includes(profile.id)

                return (
                  <div
                    key={profile.id}
                    className="bg-stone-900 border border-stone-800 rounded-2xl p-5 flex flex-col justify-between shadow-xl space-y-4 relative"
                  >
                    <div className="space-y-3">
                      {/* Cabecera del perfil */}
                      <div className="flex items-start justify-between">
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

                        {/* Botón de Denuncia (Moderación) */}
                        <button
                          onClick={() => setReportingUser(profile)}
                          title="Reportar usuario por incumplir normas"
                          className="text-stone-500 hover:text-red-400 text-xs p-1 rounded transition"
                        >
                          🚩
                        </button>
                      </div>

                      {/* Bio */}
                      {profile.bio && (
                        <p className="text-xs text-stone-300 line-clamp-2 leading-relaxed">
                          {profile.bio}
                        </p>
                      )}

                      {/* Instrumentos y Géneros */}
                      <div className="space-y-2">
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

                        {profile.genres && profile.genres.length > 0 && (
                          <div>
                            <span className="text-[10px] uppercase font-bold text-stone-500 tracking-wider">
                              Estilos
                            </span>
                            <div className="flex flex-wrap gap-1.5 mt-1">
                              {profile.genres.map((g) => (
                                <span
                                  key={g}
                                  className="bg-amber-500/10 text-amber-400 text-xs px-2 py-0.5 rounded-md border border-amber-500/20"
                                >
                                  {g}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Vídeo de presentación */}
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

                    {/* BOTONES DIRECTOS */}
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
            <div className="text-center py-12 bg-stone-900 border border-stone-800 rounded-2xl space-y-2">
              <p className="text-stone-300 font-semibold">No se encontraron músicos.</p>
              <p className="text-xs text-stone-500">Prueba a cambiar tus filtros o limpiar la búsqueda.</p>
              {hasActiveFilters && (
                <button
                  onClick={handleResetFilters}
                  className="mt-2 text-xs bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold px-4 py-2 rounded-xl transition inline-block"
                >
                  Limpiar Filtros
                </button>
              )}
            </div>
          )}
        </div>
      </main>

      {/* --- MODAL DE DENUNCIA A MODERACIÓN --- */}
      {reportingUser && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-stone-100">
              Reportar a @{reportingUser.username}
            </h3>
            
            {reportSuccess ? (
              <p className="text-green-400 text-sm py-4 text-center">
                ✓ Denuncia enviada al equipo de moderación.
              </p>
            ) : (
              <form onSubmit={handleSendReport} className="space-y-4">
                <div>
                  <label className="text-xs text-stone-400 block mb-1">Motivo</label>
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-full bg-stone-950 text-stone-100 border border-stone-800 rounded-xl p-2.5 text-sm"
                  >
                    <option value="Lenguaje inapropiado / soez">Lenguaje inapropiado / soez</option>
                    <option value="Contenido de naturaleza sexual">Contenido de naturaleza sexual</option>
                    <option value="Fotos o vídeos explícitos">Fotos o vídeos explícitos</option>
                    <option value="Spam / No es un perfil de músico">Spam / No es músico</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-stone-400 block mb-1">Detalles opcionales</label>
                  <textarea
                    rows={3}
                    value={reportDetails}
                    onChange={(e) => setReportDetails(e.target.value)}
                    placeholder="Describe brevemente el problema..."
                    className="w-full bg-stone-950 text-stone-100 border border-stone-800 rounded-xl p-2.5 text-sm"
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setReportingUser(null)}
                    className="px-4 py-2 text-xs font-bold text-stone-400 hover:text-white"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={reportSending}
                    className="px-4 py-2 text-xs font-bold bg-red-600 hover:bg-red-500 text-white rounded-xl"
                  >
                    {reportSending ? 'Enviando...' : 'Enviar Denuncia'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}