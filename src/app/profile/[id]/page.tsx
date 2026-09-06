'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { User, Music, MapPin, ArrowLeft, Send, Check, AlertCircle } from 'lucide-react';

type ProfileDetail = {
  id: string;
  display_name: string | null;
  username: string | null;
  bio: string | null;
  avatar_url: string | null;
  location_zone: string | null;
  instruments: { name: string }[];
  music_styles: { name: string }[];
  looking_for: { name: string }[];
};

export default function PublicProfilePage() {
  const params = useParams();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const profileId = params?.id as string;

  const [profile, setProfile] = useState<ProfileDetail | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [connectStatus, setConnectStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [connectMessage, setConnectMessage] = useState('');

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!profileId) return;

      setLoading(true);
      setErrorMsg(null);

      // Obtener usuario autenticado si existe
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }

      // Consulta base del perfil
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profileId)
        .maybeSingle();

      if (profileError || !profileData) {
        console.error('Error cargando perfil:', profileError);
        setErrorMsg('No se ha podido encontrar el perfil de este músico.');
        setLoading(false);
        return;
      }

      // Consultar relaciones por separado para mayor fiabilidad
      const [instRes, stylesRes, lookingRes] = await Promise.all([
        supabase
          .from('profile_instruments')
          .select('instruments ( name )')
          .eq('profile_id', profileId),
        supabase
          .from('profile_styles')
          .select('music_styles ( name )')
          .eq('profile_id', profileId),
        supabase
          .from('profile_looking_for')
          .select('looking_for ( name )')
          .eq('profile_id', profileId),
      ]);

      const instruments = (instRes.data || [])
        .map((i: any) => i.instruments)
        .filter(Boolean);

      const music_styles = (stylesRes.data || [])
        .map((s: any) => s.music_styles)
        .filter(Boolean);

      const looking_for = (lookingRes.data || [])
        .map((l: any) => l.looking_for)
        .filter(Boolean);

      setProfile({
        id: profileData.id,
        display_name: profileData.display_name,
        username: profileData.username,
        bio: profileData.bio,
        avatar_url: profileData.avatar_url,
        location_zone: profileData.location_zone,
        instruments,
        music_styles,
        looking_for,
      });

      setLoading(false);
    };

    fetchProfileData();
  }, [profileId, supabase]);

  const handleConnect = async () => {
    if (!currentUserId || !profileId) return;

    setConnectStatus('sending');

    const { error } = await supabase.from('connections').insert({
      sender_id: currentUserId,
      receiver_id: profileId,
      status: 'pending',
      message: connectMessage.trim() || '¡Hola! Me gustaría conectar contigo para tocar.',
    });

    if (error) {
      console.error('Error enviando conexión:', error.message);
    }

    setConnectStatus('sent');
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-primary)', padding: '2rem 1.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--text-secondary)' }}>
        Cargando perfil del músico...
      </div>
    );
  }

  if (errorMsg || !profile) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-primary)', padding: '2rem 1.5rem' }}>
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          <button
            onClick={() => router.back()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              marginBottom: '1.5rem',
            }}
          >
            <ArrowLeft size={18} /> Volver a la búsqueda
          </button>
          <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <AlertCircle size={32} style={{ marginBottom: '1rem', color: 'var(--accent-terracotta, #e05638)' }} />
            <p>{errorMsg || 'Perfil no encontrado.'}</p>
          </div>
        </div>
      </div>
    );
  }

  const isOwnProfile = currentUserId === profile.id;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-primary)', padding: '2rem 1.5rem' }}>
      <div style={{ maxWidth: '700px', margin: '0 auto' }}>
        <button
          onClick={() => router.back()}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            marginBottom: '1.5rem',
            fontSize: '0.9rem',
          }}
        >
          <ArrowLeft size={18} /> Volver a la búsqueda
        </button>

        <div className="glass-panel" style={{ padding: '2rem', border: '1px solid var(--border-glow, rgba(255,255,255,0.1))', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.25rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.display_name || ''}
                style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover' }}
              />
            ) : (
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                backgroundColor: 'var(--bg-surface, #1e1e1e)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid var(--border-color, #333)',
              }}>
                <User size={36} />
              </div>
            )}

            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '4px' }}>
                {profile.display_name || 'Músico de TocaConmigo'}
              </h1>
              {profile.username && (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted, #888)', marginBottom: '8px' }}>
                  @{profile.username.replace(/^@/, '')}
                </p>
              )}
              {profile.location_zone && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary, #ccc)', fontSize: '0.85rem' }}>
                  <MapPin size={16} />
                  <span>{profile.location_zone}</span>
                </div>
              )}
            </div>
          </div>

          {profile.bio && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '0.85rem', color: 'var(--text-muted, #888)', marginBottom: '6px' }}>Sobre mí</h3>
              <p style={{ color: 'var(--text-primary, #fff)', fontSize: '0.92rem', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                {profile.bio}
              </p>
            </div>
          )}

          {profile.instruments.length > 0 && (
            <div style={{ marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '0.85rem', color: 'var(--text-muted, #888)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Music size={15} /> Instrumentos
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {profile.instruments.map((inst, idx) => (
                  <span key={idx} style={{ padding: '5px 10px', borderRadius: '999px', backgroundColor: 'var(--bg-surface, #2a2a2a)', border: '1px solid var(--border-color, #444)', fontSize: '0.8rem' }}>
                    {inst.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {profile.music_styles.length > 0 && (
            <div style={{ marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '0.85rem', color: 'var(--text-muted, #888)', marginBottom: '6px' }}>Estilos musicales</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {profile.music_styles.map((style, idx) => (
                  <span key={idx} style={{ padding: '5px 10px', borderRadius: '999px', backgroundColor: 'var(--bg-surface, #2a2a2a)', border: '1px solid var(--border-color, #444)', fontSize: '0.8rem' }}>
                    {style.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {profile.looking_for.length > 0 && (
            <div>
              <h3 style={{ fontSize: '0.85rem', color: 'var(--text-muted, #888)', marginBottom: '6px' }}>Busca</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {profile.looking_for.map((item, idx) => (
                  <span key={idx} style={{ padding: '5px 10px', borderRadius: '999px', backgroundColor: 'var(--bg-surface, #2a2a2a)', border: '1px solid var(--border-color, #444)', fontSize: '0.8rem' }}>
                    {item.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {!isOwnProfile && (
          <div className="glass-panel" style={{ padding: '1.5rem', border: '1px solid var(--border-glow, rgba(255,255,255,0.1))' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '8px' }}>
              ¿Quieres tocar con {profile.display_name || 'este músico'}?
            </h2>
            <p style={{ color: 'var(--text-secondary, #ccc)', fontSize: '0.85rem', marginBottom: '1rem' }}>
              Envíale una propuesta para poneros en contacto o coordinar una jam session.
            </p>

            {connectStatus === 'sent' ? (
              <div style={{ padding: '12px', backgroundColor: 'rgba(34, 197, 94, 0.15)', border: '1px solid #22c55e', borderRadius: '8px', color: '#4ade80', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem' }}>
                <Check size={18} />
                <span>¡Solicitud enviada con éxito! Le notificaremos a {profile.display_name}.</span>
              </div>
            ) : (
              <div>
                <textarea
                  placeholder="Escribe un mensaje corto (ej. '¡Hola! Toco la guitarra y me gustaría improvisar algo de funk contigo...')"
                  value={connectMessage}
                  onChange={(e) => setConnectMessage(e.target.value)}
                  rows={3}
                  style={{
                    width: '100%',
                    backgroundColor: 'var(--bg-surface, #1e1e1e)',
                    border: '1px solid var(--border-color, #333)',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    color: 'var(--text-primary, #fff)',
                    fontSize: '0.85rem',
                    marginBottom: '1rem',
                    outline: 'none',
                    resize: 'none',
                  }}
                />
                <button
                  onClick={handleConnect}
                  disabled={connectStatus === 'sending'}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    backgroundColor: 'var(--accent-terracotta, #e05638)',
                    color: '#fff',
                    border: 'none',
                    padding: '10px 18px',
                    borderRadius: '8px',
                    fontWeight: 600,
                    fontSize: '0.88rem',
                    cursor: connectStatus === 'sending' ? 'not-allowed' : 'pointer',
                    opacity: connectStatus === 'sending' ? 0.7 : 1,
                  }}
                >
                  <Send size={16} />
                  {connectStatus === 'sending' ? 'Enviando...' : 'Enviar propuesta de jam'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}