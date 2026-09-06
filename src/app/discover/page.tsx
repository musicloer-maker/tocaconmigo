'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Navbar from '@/components/Navbar';
import { User, MapPin, Music, Award, Send, X, CheckCircle, AlertCircle, Search } from 'lucide-react';

type Profile = {
  id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  instruments: string[] | null;
  genres: string[] | null;
  experience_level: string | null;
  location_zone: string | null;
};

export default function DiscoverPage() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Estado para la Modal de Propuesta
  const [selectedMusician, setSelectedMusician] = useState<Profile | null>(null);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (isMounted) setCurrentUser(user);

        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) console.error('Error fetching profiles:', error);
        if (isMounted && data) {
          // Filtrar al propio usuario logueado de la lista
          const otherProfiles = user ? data.filter(p => p.id !== user.id) : data;
          setProfiles(otherProfiles);
        }
      } catch (err) {
        console.error('Error:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSendJamRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      router.push('/login');
      return;
    }
    if (!selectedMusician) return;

    setSending(true);
    setFeedback(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.from('connections').insert({
        sender_id: currentUser.id,
        receiver_id: selectedMusician.id,
        message: message.trim() || null,
        status: 'pending',
      });

      if (error) {
        if (error.code === '23505') {
          setFeedback({ type: 'error', msg: 'Ya le habías enviado una propuesta a este músico.' });
        } else {
          setFeedback({ type: 'error', msg: 'No se pudo enviar la propuesta. Inténtalo de nuevo.' });
        }
      } else {
        setFeedback({ type: 'success', msg: '¡Propuesta enviada con éxito!' });
        setTimeout(() => {
          setSelectedMusician(null);
          setMessage('');
          setFeedback(null);
        }, 1600);
      }
    } catch (err) {
      setFeedback({ type: 'error', msg: 'Error de conexión.' });
    } finally {
      setSending(false);
    }
  };

  const filteredProfiles = profiles.filter(p => {
    const q = searchQuery.toLowerCase();
    const nameMatch = p.display_name?.toLowerCase().includes(q) || p.username?.toLowerCase().includes(q);
    const instMatch = p.instruments?.some(i => i.toLowerCase().includes(q));
    const locationMatch = p.location_zone?.toLowerCase().includes(q);
    return nameMatch || instMatch || locationMatch;
  });

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#121212', color: '#fff', fontFamily: 'system-ui, sans-serif' }}>
      <Navbar />

      <main style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>
          Encuentra músicos cerca de ti
        </h1>
        <p style={{ color: '#aaa', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
          Conecta, organiza jams y comparte música.
        </p>

        {/* Buscador */}
        <div style={{ position: 'relative', marginBottom: '2rem' }}>
          <Search size={18} color="#888" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Buscar por nombre, instrumento o ciudad..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '0.85rem 1rem 0.85rem 2.6rem',
              backgroundColor: '#1e1e1e',
              border: '1px solid #333',
              borderRadius: '10px',
              color: '#fff',
              fontSize: '0.95rem',
              boxSizing: 'border-box',
              outline: 'none',
            }}
          />
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#888' }}>
            Cargando músicos...
          </div>
        ) : filteredProfiles.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#888', border: '1px dashed #333', borderRadius: '12px' }}>
            No se encontraron músicos con ese criterio de búsqueda.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
            {filteredProfiles.map((p) => (
              <div
                key={p.id}
                style={{
                  backgroundColor: '#1e1e1e',
                  border: '1px solid #2e2e2e',
                  borderRadius: '14px',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1rem' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#2a2a2a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <User size={24} color="#e05638" />
                    </div>
                    <div>
                      <h3
                        onClick={() => router.push(`/profile/${p.id}`)}
                        style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, cursor: 'pointer', color: '#fff' }}
                      >
                        {p.display_name || 'Músico de TocaConmigo'}
                      </h3>
                      {p.location_zone && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#888', fontSize: '0.8rem', marginTop: '3px' }}>
                          <MapPin size={12} /> {p.location_zone}
                        </div>
                      )}
                    </div>
                  </div>

                  {p.instruments && p.instruments.length > 0 && (
                    <div style={{ marginBottom: '0.85rem' }}>
                      <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#777', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Music size={12} /> Instrumentos
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {p.instruments.map((inst, idx) => (
                          <span key={idx} style={{ backgroundColor: '#2a2a2a', padding: '3px 8px', borderRadius: '10px', fontSize: '0.75rem', color: '#ddd' }}>
                            {inst}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {p.experience_level && (
                    <div style={{ marginBottom: '1rem' }}>
                      <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#777', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Award size={12} /> Nivel
                      </div>
                      <span style={{ fontSize: '0.8rem', color: '#e05638', fontWeight: 600 }}>
                        {p.experience_level}
                      </span>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #2a2a2a' }}>
                  <button
                    onClick={() => router.push(`/profile/${p.id}`)}
                    style={{
                      flex: 1,
                      padding: '0.55rem',
                      borderRadius: '8px',
                      border: '1px solid #333',
                      backgroundColor: 'transparent',
                      color: '#ccc',
                      fontSize: '0.825rem',
                      cursor: 'pointer',
                    }}
                  >
                    Ver Perfil
                  </button>
                  <button
                    onClick={() => setSelectedMusician(p)}
                    style={{
                      flex: 1,
                      padding: '0.55rem',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: '#e05638',
                      color: '#fff',
                      fontWeight: 600,
                      fontSize: '0.825rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                    }}
                  >
                    <Send size={14} /> Jam
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal Proponer Jam */}
      {selectedMusician && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', zIndex: 100 }}>
          <div style={{ backgroundColor: '#1e1e1e', borderRadius: '16px', border: '1px solid #444', width: '100%', maxWidth: '460px', padding: '1.5rem', position: 'relative' }}>
            <button
              onClick={() => setSelectedMusician(null)}
              style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>

            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              Proponer Jam a {selectedMusician.display_name || 'este músico'}
            </h2>
            <p style={{ color: '#aaa', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              Cuéntale qué tipo de música te gustaría tocar o coordinen una fecha.
            </p>

            {feedback && (
              <div style={{ padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: feedback.type === 'success' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)', color: feedback.type === 'success' ? '#4ade80' : '#f87171' }}>
                {feedback.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                {feedback.msg}
              </div>
            )}

            <form onSubmit={handleSendJamRequest}>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ej: ¡Hola! Me interesa armar algo de Jazz/Blues. ¿Te gustaría quedar un día a improvisar?"
                rows={4}
                style={{ width: '100%', backgroundColor: '#121212', border: '1px solid #333', borderRadius: '8px', color: '#fff', padding: '0.75rem', fontSize: '0.875rem', marginBottom: '1.25rem', resize: 'vertical', boxSizing: 'border-box' }}
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setSelectedMusician(null)}
                  style={{ padding: '0.55rem 1rem', borderRadius: '8px', border: '1px solid #444', backgroundColor: 'transparent', color: '#ccc', cursor: 'pointer', fontSize: '0.85rem' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={sending}
                  style={{ padding: '0.55rem 1.2rem', borderRadius: '8px', border: 'none', backgroundColor: '#e05638', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem', opacity: sending ? 0.7 : 1 }}
                >
                  {sending ? 'Enviando...' : 'Enviar propuesta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
