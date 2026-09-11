'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/Navbar'

interface Profile {
  id: string
  full_name: string
  username: string
  avatar_url: string
}

interface MatchItem {
  id: string
  partner: Profile
}

interface Message {
  id: string
  match_id: string
  sender_id: string
  content: string
  created_at: string
}

export default function MatchesPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  
  const [matches, setMatches] = useState<MatchItem[]>([])
  const [selectedMatch, setSelectedMatch] = useState<MatchItem | null>(null)
  
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  // Autoscroll al último mensaje
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // 1. Cargar usuario actual y sus matches
  useEffect(() => {
    async function loadMatches() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setCurrentUserId(user.id)

      // Obtener matches donde participe el usuario
      const { data: matchesData } = await supabase
        .from('matches')
        .select(`
          id,
          user1_id,
          user2_id
        `)
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)

      if (matchesData) {
        // Cargar los datos de los perfiles opuestos
        const formattedMatches: MatchItem[] = []

        for (const m of matchesData) {
          const partnerId = m.user1_id === user.id ? m.user2_id : m.user1_id
          const { data: partnerProfile } = await supabase
            .from('profiles')
            .select('id, full_name, username, avatar_url')
            .eq('id', partnerId)
            .single()

          if (partnerProfile) {
            formattedMatches.push({
              id: m.id,
              partner: partnerProfile
            })
          }
        }
        setMatches(formattedMatches)
      }
      setLoading(false)
    }

    loadMatches()
  }, [supabase])

  // 2. Cargar mensajes del match seleccionado y suscribirse a Supabase Realtime
  useEffect(() => {
    if (!selectedMatch) return

    async function fetchMessages() {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('match_id', selectedMatch!.id)
        .order('created_at', { ascending: true })

      if (data) setMessages(data)
    }

    fetchMessages()

    // Suscripción Realtime a nuevos mensajes
    const channel = supabase
      .channel(`chat:${selectedMatch.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `match_id=eq.${selectedMatch.id}`
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [selectedMatch, supabase])

  // Enviar mensaje
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedMatch || !currentUserId) return

    const contentToSend = newMessage.trim()
    setNewMessage('')

    await supabase.from('messages').insert({
      match_id: selectedMatch.id,
      sender_id: currentUserId,
      content: contentToSend
    })
  }

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto p-4 flex gap-4 h-[calc(100vh-80px)]">
        {/* Panel Izquierdo: Lista de Matches */}
        <div className="w-1/3 bg-stone-900 border border-stone-800 rounded-2xl flex flex-col overflow-hidden">
          <div className="p-4 border-b border-stone-800 font-bold text-lg text-amber-500">
            Tus Matches ({matches.length})
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-stone-800/50">
            {loading ? (
              <p className="p-4 text-xs text-stone-500">Cargando...</p>
            ) : matches.length === 0 ? (
              <p className="p-4 text-xs text-stone-500">Aún no tienes matches. ¡Sigue dando Me Gusta!</p>
            ) : (
              matches.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelectedMatch(item)}
                  className={`w-full p-3 flex items-center gap-3 hover:bg-stone-800/50 transition text-left ${
                    selectedMatch?.id === item.id ? 'bg-stone-800 border-l-4 border-amber-500' : ''
                  }`}
                >
                  <img
                    src={item.partner.avatar_url || '/placeholder.jpg'}
                    alt={item.partner.full_name}
                    className="w-10 h-10 rounded-full object-cover border border-stone-700"
                  />
                  <div className="truncate">
                    <p className="text-sm font-semibold truncate text-stone-200">{item.partner.full_name}</p>
                    <p className="text-xs text-amber-500 truncate">@{item.partner.username}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Panel Derecho: Chat */}
        <div className="flex-1 bg-stone-900 border border-stone-800 rounded-2xl flex flex-col overflow-hidden">
          {selectedMatch ? (
            <>
              {/* Cabecera del Chat */}
              <div className="p-4 border-b border-stone-800 flex items-center gap-3 bg-stone-950/40">
                <img
                  src={selectedMatch.partner.avatar_url || '/placeholder.jpg'}
                  alt={selectedMatch.partner.full_name}
                  className="w-9 h-9 rounded-full object-cover border border-stone-700"
                />
                <div>
                  <h3 className="text-sm font-bold text-stone-100">{selectedMatch.partner.full_name}</h3>
                  <span className="text-[10px] text-amber-500">@{selectedMatch.partner.username}</span>
                </div>
              </div>

              {/* Contenedor de Mensajes */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((msg) => {
                  const isMe = msg.sender_id === currentUserId
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                          isMe
                            ? 'bg-amber-500 text-stone-950 font-medium rounded-br-none'
                            : 'bg-stone-800 text-stone-200 rounded-bl-none border border-stone-700'
                        }`}
                      >
                        {msg.content}
                      </div>
                      <span className="text-[10px] text-stone-500 mt-1 px-1">
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input para enviar mensajes */}
              <form onSubmit={handleSendMessage} className="p-3 border-t border-stone-800 flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Escribe un mensaje..."
                  className="flex-1 bg-stone-950 border border-stone-800 rounded-xl px-4 py-2.5 text-sm text-stone-100 focus:outline-none focus:border-amber-500"
                />
                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold px-5 py-2.5 rounded-xl transition text-sm"
                >
                  Enviar
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-stone-500 space-y-2">
              <span className="text-4xl">💬</span>
              <p className="text-sm">Selecciona un match para iniciar la conversación</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}