'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Navbar from '@/components/Navbar';
import { User, MessageSquare, Send, Check } from 'lucide-react';

type AcceptedConnection = {
  id: string;
  partner_id: string;
  partner_name: string;
  partner_avatar: string | null;
  last_message?: string;
  updated_at: string;
};

export default function MessagesPage() {
  const router = useRouter();
  const [connections, setConnections] = useState<AcceptedConnection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchAcceptedConnections = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          router.push('/login');
          return;
        }

        // Buscar conexiones aceptadas donde el usuario sea sender o receiver
        const { data, error } = await supabase
          .from('connections')
          .select('*')
          .eq('status', 'accepted')
          .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);

        if (error) console.error('Error fetching connections:', error);

        if (data && data.length > 0) {
          const partnerIds = data.map(c => (c.sender_id === user.id ? c.receiver_id : c.sender_id));

          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, display_name, username, avatar_url')
            .in('id', partnerIds);

          const profilesMap = Object.fromEntries((profiles || []).map(p => [p.id, p]));

          const formatted: AcceptedConnection[] = data.map(c => {
            const partnerId = c.sender_id === user.id ? c.receiver_id : c.sender_id;
            const profile = profilesMap[partnerId];
            return {
              id: c.id,
              partner_id: partnerId,
              partner_name: profile?.display_name || 'Músico',
              partner_avatar: profile?.avatar_url || null,
              last_message: c.message || '¡Conexión de Jam aceptada!',
              updated_at: c.created_at,
            };
          });

          if (isMounted) setConnections(formatted);
        }
      } catch (err) {
        console.error('Error:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchAcceptedConnections();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#121212', color: '#fff', fontFamily: 'system-ui, sans-serif' }}>
      <Navbar />

      <main style={{ maxWidth: '750px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.5rem' }}>
          Mensajes & Jams Confirmadas
        </h1>
        <p style={{ color: '#aaa', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
          Músicos con los que tienes una propuesta de Jam aceptada.
        </p>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#888' }}>
            Cargando conversaciones...
          </div>
        ) : connections.length === 0 ? (
          <div style={{ padding: '3rem 2rem', textAlign: 'center', color: '#888', border: '1px dashed #333', borderRadius: '12px' }}>
            <MessageSquare size={36} style={{ marginBottom: '0.75rem', opacity: 0.5 }} />
            <p>Aún no tienes ninguna Jam confirmada. Cuando acepten tus solicitudes o aceptes una recibida, aparecerán aquí.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {connections.map((item) => (
              <div
                key={item.id}
                style={{
                  backgroundColor: '#1e1e1e',
                  border: '1px solid #2e2e2e',
                  borderRadius: '12px',
                  padding: '1rem 1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '46px', height: '46px', borderRadius: '50%', backgroundColor: '#2a2a2a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <User size={22} color="#e05638" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>
                      {item.partner_name}
                    </h3>
                    <p style={{ color: '#888', fontSize: '0.85rem', margin: '3px 0 0 0', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Check size={14} color="#4ade80" /> Jam aceptada
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => router.push(`/profile/${item.partner_id}`)}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#e05638',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  Ver Perfil
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
