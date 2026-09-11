'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { User, ArrowLeft, MessageSquare, Send, Inbox, Check, X, MapPin } from 'lucide-react';

type ConnectionRequest = {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  message: string | null;
  created_at: string;
  profile: {
    id: string;
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
    location_zone: string | null;
  } | null;
};

export default function ConnectionsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');
  const [receivedRequests, setReceivedRequests] = useState<ConnectionRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<ConnectionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchConnections = async () => {
      try {
        const supabase = createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
          if (isMounted) {
            router.push('/login');
          }
          return;
        }

        // 1. Recibidas
        const { data: receivedData, error: recErr } = await supabase
          .from('connections')
          .select('*')
          .eq('receiver_id', user.id)
          .order('created_at', { ascending: false });

        if (recErr) console.error('Error fetching received:', recErr);

        if (receivedData && receivedData.length > 0) {
          const senderIds = Array.from(new Set(receivedData.map(r => r.sender_id)));
          const { data: pData } = await supabase
            .from('profiles')
            .select('id, display_name, username, avatar_url, location_zone')
            .in('id', senderIds);

          const profilesMap = Object.fromEntries((pData || []).map(p => [p.id, p]));
          if (isMounted) {
            setReceivedRequests(receivedData.map(r => ({ ...r, profile: profilesMap[r.sender_id] || null })));
          }
        }

        // 2. Enviadas
        const { data: sentData, error: sentErr } = await supabase
          .from('connections')
          .select('*')
          .eq('sender_id', user.id)
          .order('created_at', { ascending: false });

        if (sentErr) console.error('Error fetching sent:', sentErr);

        if (sentData && sentData.length > 0) {
          const receiverIds = Array.from(new Set(sentData.map(r => r.receiver_id)));
          const { data: pData } = await supabase
            .from('profiles')
            .select('id, display_name, username, avatar_url, location_zone')
            .in('id', receiverIds);

          const profilesMap = Object.fromEntries((pData || []).map(p => [p.id, p]));
          if (isMounted) {
            setSentRequests(sentData.map(r => ({ ...r, profile: profilesMap[r.receiver_id] || null })));
          }
        }
      } catch (err: any) {
        console.error('Error en fetchConnections:', err);
        if (isMounted) setErrorMessage(err.message || 'Error desconocido');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchConnections();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: 'accepted' | 'rejected') => {
    const supabase = createClient();
    const { error } = await supabase
      .from('connections')
      .update({ status: newStatus })
      .eq('id', id);

    if (!error) {
      setReceivedRequests(prev =>
        prev.map(item => (item.id === id ? { ...item, status: newStatus } : item))
      );
    }
  };

  const requestsToDisplay = activeTab === 'received' ? receivedRequests : sentRequests;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#121212', padding: '2rem 1.5rem', color: '#fff', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: '750px', margin: '0 auto' }}>
        <button
          onClick={() => router.push('/discover')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'none',
            border: 'none',
            color: '#aaa',
            cursor: 'pointer',
            marginBottom: '1.5rem',
            fontSize: '0.95rem',
          }}
        >
          <ArrowLeft size={18} /> Volver al buscador
        </button>

        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.5rem' }}>
          Propuestas de Jam
        </h1>
        <p style={{ color: '#aaa', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
          Gestiona las invitaciones y conexiones con otros músicos.
        </p>

        <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid #333', marginBottom: '1.5rem' }}>
          <button
            onClick={() => setActiveTab('received')}
            style={{
              padding: '0.75rem 1rem',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'received' ? '2px solid #e05638' : '2px solid transparent',
              color: activeTab === 'received' ? '#fff' : '#888',
              fontWeight: activeTab === 'received' ? 700 : 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Inbox size={18} /> Recibidas ({receivedRequests.length})
          </button>

          <button
            onClick={() => setActiveTab('sent')}
            style={{
              padding: '0.75rem 1rem',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'sent' ? '2px solid #e05638' : '2px solid transparent',
              color: activeTab === 'sent' ? '#fff' : '#888',
              fontWeight: activeTab === 'sent' ? 700 : 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Send size={18} /> Enviadas ({sentRequests.length})
          </button>
        </div>

        {errorMessage ? (
          <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: '#1e1e1e', borderRadius: '12px', border: '1px solid #444' }}>
            <p style={{ color: '#f87171', marginBottom: '1rem' }}>{errorMessage}</p>
            <button
              onClick={() => router.push('/login')}
              style={{ padding: '0.5rem 1rem', backgroundColor: '#e05638', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
            >
              Ir a Iniciar Sesión
            </button>
          </div>
        ) : loading ? (
          <div style={{ padding: '3rem 2rem', textAlign: 'center', color: '#888' }}>
            Cargando solicitudes...
          </div>
        ) : requestsToDisplay.length === 0 ? (
          <div style={{ padding: '3rem 2rem', textAlign: 'center', color: '#888', border: '1px dashed #333', borderRadius: '12px' }}>
            <MessageSquare size={36} style={{ marginBottom: '0.75rem', opacity: 0.5 }} />
            <p>
              {activeTab === 'received'
                ? 'No has recibido ninguna propuesta de jam por ahora.'
                : 'No has enviado ninguna propuesta de jam todavía.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {requestsToDisplay.map((item) => (
              <div key={item.id} style={{ padding: '1.25rem', borderRadius: '12px', backgroundColor: '#1e1e1e', border: '1px solid #333' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <User size={22} color="#e05638" />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>
                        {item.profile?.display_name || 'Músico de TocaConmigo'}
                      </h3>
                      {item.profile?.location_zone && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#888', fontSize: '0.825rem', marginTop: '2px' }}>
                          <MapPin size={13} /> {item.profile.location_zone}
                        </div>
                      )}
                    </div>
                  </div>

                  <span style={{
                    fontSize: '0.75rem',
                    padding: '4px 10px',
                    borderRadius: '20px',
                    fontWeight: 600,
                    backgroundColor: item.status === 'accepted' ? 'rgba(34, 197, 94, 0.15)' : item.status === 'rejected' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(234, 179, 8, 0.15)',
                    color: item.status === 'accepted' ? '#4ade80' : item.status === 'rejected' ? '#f87171' : '#facc15',
                  }}>
                    {item.status === 'accepted' ? 'Aceptada' : item.status === 'rejected' ? 'Rechazada' : 'Pendiente'}
                  </span>
                </div>

                {item.message && (
                  <p style={{ backgroundColor: '#141414', padding: '0.85rem 1rem', borderRadius: '8px', fontSize: '0.9rem', color: '#ddd', margin: '0.75rem 0', borderLeft: '3px solid #e05638' }}>
                    "{item.message}"
                  </p>
                )}

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid #2a2a2a' }}>
                  <span style={{ fontSize: '0.8rem', color: '#666' }}>
                    {new Date(item.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                  </span>

                  {activeTab === 'received' && item.status === 'pending' && (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => handleUpdateStatus(item.id, 'rejected')}
                        style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '0.4rem 0.8rem', borderRadius: '6px', border: '1px solid #444', backgroundColor: 'transparent', color: '#ccc', cursor: 'pointer', fontSize: '0.85rem' }}
                      >
                        <X size={15} /> Rechazar
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(item.id, 'accepted')}
                        style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '0.4rem 0.8rem', borderRadius: '6px', border: 'none', backgroundColor: '#e05638', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}
                      >
                        <Check size={15} /> Aceptar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
