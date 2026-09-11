'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Navbar from '@/components/Navbar';
import { User, MessageSquare, Send, AlertTriangle } from 'lucide-react';
import { checkContentSafety } from '@/lib/moderation';

type Profile = {
  id: string;
  display_name: string;
  username: string;
  avatar_url: string | null;
};

type Conversation = {
  id: string;
  user1_id: string;
  user2_id: string;
  created_at: string;
  partner?: Profile;
};

type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
};

export default function MessagesPage() {
  const router = useRouter();
  const supabase = createClient();

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Cargar usuario y conversaciones activas
  useEffect(() => {
    let isMounted = true;

    const fetchConversations = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          router.push('/login');
          return;
        }

        if (isMounted) setCurrentUserId(user.id);

        const { data: convs, error } = await supabase
          .from('conversations')
          .select('*')
          .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
          .order('created_at', { ascending: false });

        if (error) console.error('Error fetching conversations:', error);

        if (convs && convs.length > 0) {
          const partnerIds = convs.map(c => (c.user1_id === user.id ? c.user2_id : c.user1_id));

          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, display_name, username, avatar_url')
            .in('id', partnerIds);

          const profilesMap = Object.fromEntries((profiles || []).map(p => [p.id, p]));

          const formatted: Conversation[] = convs.map(c => {
            const partnerId = c.user1_id === user.id ? c.user2_id : c.user1_id;
            return {
              ...c,
              partner: profilesMap[partnerId],
            };
          });

          if (isMounted) {
            setConversations(formatted);
            setSelectedConv(formatted[0]); // Selecciona la primera conversación por defecto
          }
        }
      } catch (err) {
        console.error('Error:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchConversations();

    return () => {
      isMounted = false;
    };
  }, [router, supabase]);

  // 2. Cargar mensajes de la conversación activa y escuchar en tiempo real
  useEffect(() => {
    if (!selectedConv) return;

    const fetchMessages = async () => {
      const { data } = await supabase
        .from('direct_messages')
        .select('*')
        .eq('conversation_id', selectedConv.id)
        .order('created_at', { ascending: true });

      if (data) setMessages(data);
    };

    fetchMessages();

    // Suscripción Realtime
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
          const newMsg = payload.new as Message;
          setMessages(prev => [...prev, newMsg]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedConv, supabase]);

  // Auto-scroll al final del chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 3. Enviar mensaje con filtro de moderación y expulsión
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConv || !currentUserId) return;

    const textToSend = newMessage.trim();
    setSending(true);

    // MODERACIÓN DE CONTENIDO
    const safetyCheck = checkContentSafety(textToSend);

    if (!safetyCheck.isSafe) {
      // Registrar expulsión en la base de datos
      await supabase.from('banned_users').insert({
        user_id: currentUserId,
        reason: safetyCheck.reason || 'Contenido o vocabulario inapropiado en chat privado.',
      });

      await supabase.from('profiles').update({ is_configured: false }).eq('id', currentUserId);
      await supabase.auth.signOut();

      alert('⚠️ Tu cuenta ha sido suspendida permanentemente por incumplir las normas de conducta de la comunidad.');
      router.push('/login');
      return;
    }

    try {
      const { error } = await supabase.from('direct_messages').insert({
        conversation_id: selectedConv.id,
        sender_id: currentUserId,
        content: textToSend,
      });

      if (error) throw error;
      setNewMessage('');
    } catch (err: any) {
      alert('Error al enviar el mensaje: ' + err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#121212', color: '#fff', fontFamily: 'system-ui, sans-serif', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <main style={{ maxWidth: '1000px', width: '100%', margin: '0 auto', padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Banner de convivencia */}
        <div style={{ backgroundColor: '#2a1a16', border: '1px solid #5c2619', borderRadius: '10px', padding: '0.85rem 1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.85rem', color: '#fca5a5' }}>
          <AlertTriangle size={20} color="#e05638" style={{ flexShrink: 0 }} />
          <span>
            <strong>Comunidad Exclusiva para Músicos:</strong> Queda prohibido el contenido inapropiado o mensajes ajenos a la colaboración musical. El incumplimiento conlleva la <strong>expulsión automática</strong> de la plataforma.
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '1rem', backgroundColor: '#1e1e1e', border: '1px solid #2e2e2e', borderRadius: '12px', minHeight: '520px', overflow: 'hidden', flex: 1 }}>
          
          {/* COLUMNA IZQUIERDA: LISTA DE CONVERSACIONES */}
          <div style={{ borderRight: '1px solid #2e2e2e', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '1rem', borderBottom: '1px solid #2e2e2e' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>Mensajes Directos</h2>
              <p style={{ color: '#888', fontSize: '0.8rem', margin: '2px 0 0 0' }}>Músicos interesados en tocar</p>
            </div>

            <div style={{ flex: 1, overflowY: 'auto' }}>
              {loading ? (
                <p style={{ padding: '1rem', color: '#888', fontSize: '0.85rem' }}>Cargando conversaciones...</p>
              ) : conversations.length === 0 ? (
                <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#888', fontSize: '0.85rem' }}>
                  <MessageSquare size={28} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
                  <p>No tienes conversaciones aún. Encuentra músicos en el directorio y envíales un mensaje.</p>
                </div>
              ) : (
                conversations.map((c) => {
                  const isSelected = selectedConv?.id === c.id;
                  return (
                    <div
                      key={c.id}
                      onClick={() => setSelectedConv(c)}
                      style={{
                        padding: '0.85rem 1rem',
                        borderBottom: '1px solid #2a2a2a',
                        backgroundColor: isSelected ? '#2a2a2a' : 'transparent',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        borderLeft: isSelected ? '4px solid #e05638' : '4px solid transparent',
                      }}
                    >
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                        {c.partner?.avatar_url ? (
                          <img src={c.partner.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <User size={20} color="#e05638" />
                        )}
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <h4 style={{ fontSize: '0.9rem', fontWeight: 600, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {c.partner?.display_name || 'Músico'}
                        </h4>
                        <p style={{ color: '#888', fontSize: '0.75rem', margin: '2px 0 0 0' }}>
                          @{c.partner?.username || 'usuario'}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* COLUMNA DERECHA: SALA DE CHAT */}
          <div style={{ display: 'flex', flexDirection: 'column', backgroundColor: '#161616' }}>
            {selectedConv ? (
              <>
                {/* CABECERA CHAT */}
                <div style={{ padding: '0.85rem 1.25rem', borderBottom: '1px solid #2e2e2e', backgroundColor: '#1e1e1e', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                      {selectedConv.partner?.avatar_url ? (
                        <img src={selectedConv.partner.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <User size={18} color="#e05638" />
                      )}
                    </div>
                    <div>
                      <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>
                        {selectedConv.partner?.display_name}
                      </h3>
                      <p style={{ color: '#888', fontSize: '0.75rem', margin: 0 }}>
                        @{selectedConv.partner?.username}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => router.push(`/profile/${selectedConv.partner?.id}`)}
                    style={{ padding: '0.35rem 0.75rem', backgroundColor: '#2a2a2a', color: '#ccc', border: '1px solid #3d3d3d', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer' }}
                  >
                    Ver Perfil
                  </button>
                </div>

                {/* HISTORIAL MENSAJES */}
                <div style={{ flex: 1, padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {messages.map((m) => {
                    const isMe = m.sender_id === currentUserId;
                    return (
                      <div
                        key={m.id}
                        style={{
                          alignSelf: isMe ? 'flex-end' : 'flex-start',
                          maxWidth: '70%',
                          backgroundColor: isMe ? '#e05638' : '#2a2a2a',
                          color: '#fff',
                          padding: '0.65rem 0.9rem',
                          borderRadius: '12px',
                          fontSize: '0.85rem',
                          lineHeight: '1.4',
                        }}
                      >
                        <p style={{ margin: 0, wordBreak: 'break-word' }}>{m.content}</p>
                        <span style={{ display: 'block', fontSize: '0.65rem', color: isMe ? '#ffcdcd' : '#888', marginTop: '4px', textAlign: 'right' }}>
                          {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* FORMULARIO DE ENVÍO */}
                <form onSubmit={handleSendMessage} style={{ padding: '0.85rem', borderTop: '1px solid #2e2e2e', backgroundColor: '#1e1e1e', display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Escribe un mensaje proponiendo un ensayo o colaboración..."
                    style={{
                      flex: 1,
                      backgroundColor: '#121212',
                      border: '1px solid #333',
                      borderRadius: '8px',
                      padding: '0.6rem 0.85rem',
                      color: '#fff',
                      fontSize: '0.85rem',
                      outline: 'none',
                    }}
                  />
                  <button
                    type="submit"
                    disabled={sending || !newMessage.trim()}
                    style={{
                      padding: '0.6rem 1rem',
                      backgroundColor: '#e05638',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      opacity: sending || !newMessage.trim() ? 0.5 : 1,
                    }}
                  >
                    <Send size={15} />
                    Enviar
                  </button>
                </form>
              </>
            ) : (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666', fontSize: '0.85rem', textAlign: 'center', padding: '2rem' }}>
                Selecciona una conversación a la izquierda para ver los mensajes.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}