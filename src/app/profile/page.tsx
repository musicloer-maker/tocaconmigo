'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/Navbar'

const AVAILABLE_INSTRUMENTS = ['Guitarra Eléctrica', 'Guitarra Acústica', 'Bajo', 'Batería', 'Teclado/Piano', 'Voz', 'Sintetizador', 'Saxofón', 'Violín', 'Percusión']
const AVAILABLE_GENRES = ['Rock', 'Jazz', 'Blues', 'Pop', 'Indie', 'Funk', 'Flamenco', 'Heavy Metal', 'Reggae', 'Electrónica']
const ZONES = ['Gràcia', 'Eixample', 'Poblenou', 'Sants', 'Ciutat Vella', 'Sarrià-Sant Gervasi', 'Horta-Guinardó', 'Sant Andreu', 'Barcelona Centro']

export default function ProfilePage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [uploadingVideo, setUploadingVideo] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const [userId, setUserId] = useState<string | null>(null)
  const [username, setUsername] = useState('')
  const [fullName, setFullName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [bio, setBio] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [zone, setZone] = useState(ZONES[0])
  const [selectedInstruments, setSelectedInstruments] = useState<string[]>([])
  const [selectedGenres, setSelectedGenres] = useState<string[]>([])

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (data) {
        setUsername(data.username || '')
        setFullName(data.full_name || '')
        setAvatarUrl(data.avatar_url || '')
        setBio(data.bio || '')
        setVideoUrl(data.video_url || '')
        setZone(data.zone || ZONES[0])
        setSelectedInstruments(data.instruments || [])
        setSelectedGenres(data.genres || [])
      }
      setLoading(false)
    }

    loadProfile()
  }, [supabase])

  // Subir Avatar (Fotos de archivo o cámara)
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploadingAvatar(true)
      if (!e.target.files || e.target.files.length === 0 || !userId) return

      const file = e.target.files[0]
      const fileExt = file.name.split('.').pop()
      const filePath = `${userId}/avatar-${Math.random()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
      setAvatarUrl(data.publicUrl)
      setMessage('¡Foto de perfil cargada correctamente!')
    } catch (error: any) {
      setMessage('Error subiendo imagen: ' + error.message)
    } finally {
      setUploadingAvatar(false)
    }
  }

  // Subir Video (Desde almacenamiento o cámara)
  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploadingVideo(true)
      if (!e.target.files || e.target.files.length === 0 || !userId) return

      const file = e.target.files[0]
      const fileExt = file.name.split('.').pop()
      const filePath = `${userId}/video-${Math.random()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('videos')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('videos').getPublicUrl(filePath)
      setVideoUrl(data.publicUrl)
      setMessage('¡Video de presentación cargado con éxito!')
    } catch (error: any) {
      setMessage('Error subiendo video: ' + error.message)
    } finally {
      setUploadingVideo(false)
    }
  }

  const toggleItem = (list: string[], item: string, setter: (val: string[]) => void) => {
    if (list.includes(item)) {
      setter(list.filter(i => i !== item))
    } else {
      setter([...list, item])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    if (!userId) return

    const { error } = await supabase.from('profiles').upsert({
      id: userId,
      username,
      full_name: fullName,
      avatar_url: avatarUrl,
      bio,
      video_url: videoUrl,
      zone,
      instruments: selectedInstruments,
      genres: selectedGenres,
      is_configured: true,
      updated_at: new Date().toISOString(),
    })

    setSaving(false)
    if (error) {
      setMessage('Error al guardar: ' + error.message)
    } else {
      setMessage('¡Perfil actualizado con éxito!')
    }
  }

  if (loading) return <div className="min-h-screen bg-stone-950 text-stone-200 p-8">Cargando perfil...</div>

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">
      <Navbar />
      
      <main className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold mb-2 text-stone-100">Configurar mi Perfil</h1>
        <p className="text-stone-400 text-sm mb-8">Sube tu contenido local o usa la cámara de tu dispositivo.</p>

        {message && (
          <div className="bg-amber-950/80 border border-amber-800 text-amber-200 p-4 rounded-xl mb-6 text-sm">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-stone-400 mb-1">Nombre Completo / Apodo</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-stone-900 border border-stone-800 rounded-xl px-4 py-2.5 text-sm text-stone-100"
              />
            </div>

            <div>
              <label className="block text-xs text-stone-400 mb-1">Nombre de Usuario (@usuario)</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-stone-900 border border-stone-800 rounded-xl px-4 py-2.5 text-sm text-stone-100"
                placeholder="ej: marc_rock"
              />
            </div>
          </div>

          {/* Subida de Avatar desde Dispositivo / Cámara */}
          <div className="bg-stone-900/50 border border-stone-800 p-4 rounded-xl space-y-3">
            <label className="block text-xs font-medium text-stone-300">Foto de Perfil (PC / Móvil / Cámara)</label>
            <div className="flex items-center gap-4">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar Preview" className="w-16 h-16 rounded-full object-cover border border-amber-500" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-stone-800 border border-stone-700 flex items-center justify-center text-xs text-stone-500">
                  Sin Foto
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                disabled={uploadingAvatar}
                className="text-xs text-stone-400 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-stone-800 file:text-stone-200 hover:file:bg-stone-700"
              />
            </div>
            {uploadingAvatar && <p className="text-xs text-amber-500">Subiendo imagen...</p>}
          </div>

          {/* Selección de Ubicación */}
          <div>
            <label className="block text-xs text-stone-400 mb-1">Ubicación Aproximada (Barrio/Zona)</label>
            <select
              value={zone}
              onChange={(e) => setZone(e.target.value)}
              className="w-full bg-stone-900 border border-stone-800 rounded-xl px-4 py-2.5 text-sm text-stone-100"
            >
              {ZONES.map(z => <option key={z} value={z}>{z}</option>)}
            </select>
          </div>

          {/* Subida de Video desde Dispositivo / Cámara */}
          <div className="bg-stone-900/50 border border-stone-800 p-4 rounded-xl space-y-3">
            <label className="block text-xs font-medium text-stone-300">Video de Presentación (Subir desde archivo o Grabar)</label>
            <input
              type="file"
              accept="video/*"
              onChange={handleVideoUpload}
              disabled={uploadingVideo}
              className="w-full text-xs text-stone-400 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-stone-800 file:text-stone-200 hover:file:bg-stone-700"
            />
            {uploadingVideo && <p className="text-xs text-amber-500">Subiendo video, por favor espera...</p>}
            {videoUrl && (
              <div className="mt-2">
                <video src={videoUrl} controls className="w-full max-h-48 rounded-lg border border-stone-800" />
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs text-stone-400 mb-1">Presentación Personal</label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full bg-stone-900 border border-stone-800 rounded-xl px-4 py-2.5 text-sm text-stone-100"
              placeholder="Cuéntanos sobre tus preferencias de ensayo, disponibilidad, etc."
            />
          </div>

          {/* Instrumentos */}
          <div>
            <label className="block text-xs text-stone-400 mb-2">Instrumentos que tocas</label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_INSTRUMENTS.map(item => {
                const active = selectedInstruments.includes(item)
                return (
                  <button
                    type="button"
                    key={item}
                    onClick={() => toggleItem(selectedInstruments, item, setSelectedInstruments)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                      active ? 'bg-amber-500 text-stone-950 border-amber-500' : 'bg-stone-900 text-stone-400 border-stone-800'
                    }`}
                  >
                    {item}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Estilos */}
          <div>
            <label className="block text-xs text-stone-400 mb-2">Estilos Musicales</label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_GENRES.map(item => {
                const active = selectedGenres.includes(item)
                return (
                  <button
                    type="button"
                    key={item}
                    onClick={() => toggleItem(selectedGenres, item, setSelectedGenres)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                      active ? 'bg-amber-500 text-stone-950 border-amber-500' : 'bg-stone-900 text-stone-400 border-stone-800'
                    }`}
                  >
                    {item}
                  </button>
                )
              })}
            </div>
          </div>

          <button
            type="submit"
            disabled={saving || uploadingAvatar || uploadingVideo}
            className="w-full bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold py-3 rounded-xl transition disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Guardar Perfil'}
          </button>
        </form>
      </main>
    </div>
  )
}