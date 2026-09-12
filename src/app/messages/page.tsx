'use client'

import { useEffect, useState, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/Navbar'
import { User, MessageSquare, Send, AlertTriangle } from 'lucide-react'
import { checkContentSafety } from '@/lib/moderation'

type Profile = {
  id: string
  display_name: string
  full_name?: string
  username: string
  avatar_url: string | null
}

type Conversation = {
  id: string
  user1_id: string
  user2_id: string
  created_at: string
  partner?: Profile
}

type Message = {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  created_at: string
}

function MessagesContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const targetUserId = searchParams.get('user')
  const supabase = createClient()

  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // 1. Cargar usuario, conversaciones y gestionar inicio directo via ?user=ID
  useEffect(() => {
    let isMounted = true

    const fetchConversationsAndInitialize = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          router.push('/login')
          return
        }

        if (isMounted) setCurrentUserId(user.id)

        // Cargar conversaciones existentes
        const { data: convs, error } = await supabase
          .from('conversations')
          .select('*')
          .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
          .order('created_at', { ascending: false })

        if (error) console.error('Error al cargar conversaciones:', error)

        let loadedConvs: Conversation[] = []

        if (convs && convs.length > 0) {
          const partnerIds = convs.map((c) =>
            c.user1_id === user.id ? c.user2_id : c.user1_id
          )

          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, display_name, full_name, username, avatar_url')
            .in('id', partnerIds)

          const profilesMap = Object.fromEntries(
            (profiles || []).map((p) => [p.id, p])
          )

          loadedConvs = convs.map((c) => {
            const partnerId = c.user1_id === user.id ? c.user2_id : c.user1_id
            return {
              ...c,
              partner: profilesMap[partnerId],
            }
          })
        }

        // Si venimos del Feed con ?user=targetUserId
        if (targetUserId && targetUserId !== user.id) {
          let existingConv = loadedConvs.find(
            (c) =>
              (c.user1_id === user.id && c.user2_id === targetUserId) ||
              (c.user1_id === targetUserId && c.user2_id === user.id)
          )

          if (!existingConv) {
            // Crear nueva conversación si no existía
            const { data: newConvData, error: createErr } = await supabase
              .from('conversations')
              .insert({
                user1_id: user.id,
                user2_id: targetUserId,
              })
              .select('*')
              .single()

            if (!createErr && newConvData) {
              const { data: targetProfile } = await supabase
                .from('profiles')
                .select('id, display_name, full_name, username, avatar_url')
                .eq('id', targetUserId)
                .single()

              existingConv = {
                ...newConvData,
                partner: targetProfile || undefined,
              }
              loadedConvs = [existingConv, ...loadedConvs]
            }
          }

          if (isMounted) {
            setConversations(loadedConvs)
            if (existingConv) setSelectedConv(existingConv)
          }
        } else if (isMounted) {
          setConversations(loadedConvs)
          if (loadedConvs.length > 0) setSelectedConv(loadedConvs[0])
        }
      } catch (err) {
        console.error('Error:', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchConversationsAndInitialize()

    return () => {
      isMounted = false
    }
  }, [router, supabase, targetUserId])

  // 2. Cargar mensajes y suscripción Realtime
  useEffect(() => {
    if (!selectedConv) return

    const fetchMessages = async () => {
      const { data } = await supabase
        .from('direct_messages')
        .select('*')
        .eq('conversation_id', selectedConv.id)
        .order('created_at', { ascending: true })

      if (data) setMessages(data)
    }

    fetchMessages()

    const channel = supabase
      .channel(`chat:${selectedConv.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
          filter: `conversation_id=eq.${selectedConv.id}`,
        },
        (payload) => {
          const newMsg = payload.new as Message
          setMessages((prev) => [...prev, newMsg])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [selectedConv, supabase])

  // Scroll automático
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // 3. Enviar mensaje con filtro de moderación
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedConv || !currentUserId) return

    const textToSend = newMessage.trim()
    setSending(true)

    // Moderación automática
    const safetyCheck = checkContentSafety(textToSend)

    if (!safetyCheck.isSafe) {
      await supabase.from('banned_users').insert({
        user_id: currentUserId,
        reason: safetyCheck.reason || 'Vocabulario o contenido inapropiado en chat privado.',
      })

      await supabase.from('profiles').update({ is_configured: false }).eq('id', currentUserId)
      await supabase.auth.signOut()

      alert('⚠️ Tu cuenta ha sido suspendida permanentemente por incumplir las normas de conducta.')
      router.push('/login')
      return
    }

    try {
      const { error } = await supabase.from('direct_messages').insert({
        conversation_id: selectedConv.id,
        sender_id: currentUserId,
        content: textToSend,
      })

      if (error) throw error
      setNewMessage('')
    } catch (err: any) {
      alert('Error al enviar el mensaje: ' + err.message)
    } finally {
      setSending(false)
    }
  }

  return (
    <main className="max-w-5xl mx-auto w-full p-4 flex-1 flex flex-col space-y-4">
      {/* Banner de convivencia */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3.5 flex items-center gap-3 text-xs text-amber-200">
        <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
        <span>
          <strong>Comunidad Exclusiva para Músicos:</strong> Prohibido el contenido inapropiado o mensajes ajenos a la colaboración musical. El incumplimiento conlleva la <strong>expulsión permanente</strong>.
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 bg-stone-900 border border-stone-800 rounded-2xl min-h-[550px] overflow-hidden flex-1 shadow-2xl">
        {/* COLUMNA IZQUIERDA: LISTA DE CONVERSACIONES */}
        <div className="border-b md:border-b-0 md:border-r border-stone-800 flex flex-col">
          <div className="p-4 border-b border-stone-800">
            <h2 className="text-sm font-bold text-stone-100">Mensajes Directos</h2>
            <p className="text-[11px] text-stone-400">Músicos interesados en conectar</p>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <p className="p-4 text-xs text-stone-500">Cargando conversaciones...</p>
            ) : conversations.length === 0 ? (
              <div className="p-6 text-center text-stone-500 text-xs flex flex-col items-center gap-2">
                <MessageSquare className="w-8 h-8 opacity-40" />
                <p>No tienes conversaciones aún. Encuentra músicos en el directorio y escríbeles.</p>
              </div>
            ) : (
              conversations.map((c) => {
                const isSelected = selectedConv?.id === c.id
                const partnerName =
                  c.partner?.display_name || c.partner?.full_name || 'Músico'

                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedConv(c)}
                    className={`p-3 border-b border-stone-800/60 cursor-pointer flex items-center gap-3 transition ${
                      isSelected
                        ? 'bg-stone-800 border-l-4 border-l-amber-500'
                        : 'hover:bg-stone-800/40 border-l-4 border-l-transparent'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-stone-800 flex items-center justify-center shrink-0 overflow-hidden border border-stone-700">
                      {c.partner?.avatar_url ? (
                        <img
                          src={c.partner.avatar_url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-5 h-5 text-amber-500" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-stone-200 truncate">
                        {partnerName}
                      </h4>
                      <p className="text-[11px] text-stone-400 truncate">
                        @{c.partner?.username || 'usuario'}
                      </p>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* COLUMNA DERECHA: SALA DE CHAT */}
        <div className="col-span-1 md:col-span-2 flex flex-col bg-stone-950">
          {selectedConv ? (
            <>
              {/* CABECERA CHAT */}
              <div className="p-3.5 border-b border-stone-800 bg-stone-900 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-stone-800 flex items-center justify-center overflow-hidden border border-stone-700">
                    {selectedConv.partner?.avatar_url ? (
                      <img
                        src={selectedConv.partner.avatar_url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-4 h-4 text-amber-500" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-stone-100 leading-tight">
                      {selectedConv.partner?.display_name ||
                        selectedConv.partner?.full_name}
                    </h3>
                    <p className="text-[10px] text-amber-500">
                      @{selectedConv.partner?.username}
                    </p>
                  </div>
                </div>
              </div>

              {/* HISTORIAL MENSAJES */}
              <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-2.5">
                {messages.map((m) => {
                  const isMe = m.sender_id === currentUserId
                  return (
                    <div
                      key={m.id}
                      className={`max-w-[75%] p-3 rounded-2xl text-xs leading-relaxed ${
                        isMe
                          ? 'self-end bg-amber-600 text-white rounded-br-none'
                          : 'self-start bg-stone-800 text-stone-200 rounded-bl-none border border-stone-700'
                      }`}
                    >
                      <p className="break-words">{m.content}</p>
                      <span
                        className={`block text-[9px] mt-1 text-right ${
                          isMe ? 'text-amber-200' : 'text-stone-400'
                        }`}
                      >
                        {new Date(m.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* FORMULARIO DE ENVÍO */}
              <form
                onSubmit={handleSendMessage}
                className="p-3 border-t border-stone-800 bg-stone-900 flex gap-2"
              >
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Propón un ensayo o colaboración..."
                  className="flex-1 bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2 text-xs text-stone-100 focus:outline-none focus:border-amber-500 placeholder-stone-500"
                />
                <button
                  type="submit"
                  disabled={sending || !newMessage.trim()}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-stone-950 font-bold text-xs rounded-xl transition flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  Enviar
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-stone-500 text-xs p-8 text-center">
              Selecciona una conversación a la izquierda para comenzar a chatear.
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

export default function MessagesPage() {
  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans">
      <Navbar />
      <Suspense fallback={<p className="p-4 text-xs text-stone-500">Cargando chat...</p>}>
        <MessagesContent />
      </Suspense>
    </div>
  )
}