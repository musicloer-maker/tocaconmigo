'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/Navbar'
import { ArrowLeft, MessageSquare, Trash2, MapPin, UserCheck } from 'lucide-react'

interface SavedContact {
  id: string
  contact_id: string
  created_at: string
  profile: {
    id: string
    full_name: string | null
    display_name: string | null
    username: string | null
    avatar_url: string | null
    location_zone: string | null
    zone: string | null
    bio: string | null
    instruments: string[] | null
  } | null
}

export default function ConnectionsPage() {
  const router = useRouter()
  const [contacts, setContacts] = useState<SavedContact[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    let isMounted = true

    const fetchSavedContacts = async () => {
      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser()

        if (authError || !user) {
          if (isMounted) router.push('/login')
          return
        }

        // 1. Consultar contactos guardados
        const { data: contactsData, error: contactsErr } = await supabase
          .from('contacts')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (contactsErr) throw contactsErr

        if (contactsData && contactsData.length > 0) {
          const contactUserIds = contactsData.map((c) => c.contact_id)

          // 2. Obtener perfiles de los contactos
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('id, full_name, display_name, username, avatar_url, location_zone, zone, bio, instruments')
            .in('id', contactUserIds)

          const profilesMap = Object.fromEntries((profilesData || []).map((p) => [p.id, p]))

          if (isMounted) {
            setContacts(
              contactsData.map((c) => ({
                ...c,
                profile: profilesMap[c.contact_id] || null,
              }))
            )
          }
        }
      } catch (err: any) {
        console.error('Error en fetchSavedContacts:', err)
        if (isMounted) setErrorMessage(err.message || 'Error al cargar contactos')
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchSavedContacts()

    return () => {
      isMounted = false
    }
  }, [router, supabase])

  // Eliminar un contacto de la agenda
  const handleRemoveContact = async (contactId: string) => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('user_id', user.id)
      .eq('contact_id', contactId)

    if (!error) {
      setContacts((prev) => prev.filter((c) => c.contact_id !== contactId))
    } else {
      console.error('Error al eliminar contacto:', error)
    }
  }

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-6 space-y-6">
        <div>
          <button
            onClick={() => router.push('/feed')}
            className="flex items-center gap-2 text-stone-400 hover:text-stone-200 text-xs font-semibold mb-4 transition"
          >
            <ArrowLeft size={16} /> Volver al directorio
          </button>

          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-500">
              <UserCheck size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-stone-100">Mi Agenda de Músicos</h1>
              <p className="text-xs text-stone-400">
                Contactos guardados para futuras jam sessions o proyectos
              </p>
            </div>
          </div>
        </div>

        {errorMessage ? (
          <div className="p-6 text-center bg-stone-900 border border-red-500/30 rounded-2xl">
            <p className="text-red-400 text-sm mb-3">{errorMessage}</p>
            <button
              onClick={() => router.push('/login')}
              className="px-4 py-2 bg-amber-500 text-stone-950 font-bold rounded-xl text-xs hover:bg-amber-400 transition"
            >
              Ir a Iniciar Sesión
            </button>
          </div>
        ) : loading ? (
          <div className="py-12 text-center text-stone-500 text-sm">
            Cargando tu agenda de contactos...
          </div>
        ) : contacts.length === 0 ? (
          <div className="py-16 text-center border border-dashed border-stone-800 rounded-2xl bg-stone-900/50 space-y-3">
            <MessageSquare size={36} className="mx-auto text-stone-600" />
            <p className="text-stone-300 font-semibold text-sm">Aún no tienes contactos guardados.</p>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              Explora el directorio de músicos y guarda aquellos con los que te interese conectar.
            </p>
            <button
              onClick={() => router.push('/feed')}
              className="mt-2 inline-block px-4 py-2 bg-amber-500 text-stone-950 font-bold rounded-xl text-xs hover:bg-amber-400 transition"
            >
              Explorar directorio
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {contacts.map((item) => {
              const p = item.profile
              if (!p) return null

              const name = p.display_name || p.full_name || 'Músico'
              const location = p.location_zone || p.zone

              return (
                <div
                  key={item.id}
                  className="bg-stone-900 border border-stone-800 rounded-2xl p-5 flex flex-col justify-between shadow-xl space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {p.avatar_url ? (
                          <img
                            src={p.avatar_url}
                            alt={name}
                            className="w-12 h-12 rounded-full object-cover border border-amber-500/40"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-stone-800 flex items-center justify-center text-amber-500 font-bold border border-stone-700">
                            {name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <h3 className="font-bold text-stone-100 text-base leading-tight">
                            {name}
                          </h3>
                          {p.username && <p className="text-xs text-amber-500">@{p.username}</p>}
                          {location && (
                            <div className="flex items-center gap-1 text-[11px] text-stone-400 mt-0.5">
                              <MapPin size={12} /> {location}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {p.bio && (
                      <p className="text-xs text-stone-300 line-clamp-2 leading-relaxed">
                        {p.bio}
                      </p>
                    )}

                    {p.instruments && p.instruments.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {p.instruments.map((inst) => (
                          <span
                            key={inst}
                            className="bg-stone-800 text-stone-300 text-[11px] px-2 py-0.5 rounded-md border border-stone-700"
                          >
                            {inst}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-stone-800 flex items-center gap-2">
                    <a
                      href={`/messages?user=${p.id}`}
                      className="flex-1 bg-amber-500 hover:bg-amber-400 text-stone-950 py-2 px-3 rounded-xl text-xs font-bold text-center transition flex items-center justify-center gap-1.5"
                    >
                      <MessageSquare size={14} /> Contactar
                    </a>

                    <button
                      onClick={() => handleRemoveContact(p.id)}
                      title="Eliminar de mi agenda"
                      className="p-2 text-stone-500 hover:text-red-400 bg-stone-950 hover:bg-red-500/10 border border-stone-800 hover:border-red-500/30 rounded-xl transition"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}