'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';

interface MusicianProfile {
  id: string;
  full_name?: string;
  avatar_url?: string;
  instrument?: string;
  genre?: string;
  location?: string;
}

export default function HomePage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState<boolean>(true);
  const [profiles, setProfiles] = useState<MusicianProfile[]>([]);

  useEffect(() => {
    async function initPage() {
      try {
        setLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          router.push('/discover');
          return;
        }

        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .limit(6);

        if (!error && Array.isArray(data)) {
          setProfiles(data as MusicianProfile[]);
        }
      } catch (err) {
        console.error('Error inicializando:', err);
      } finally {
        setLoading(false);
      }
    }

    initPage();
  }, [router, supabase]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="badge badge-amber" style={{ padding: '12px 24px', fontSize: '1rem' }}>
          Cargando TocaConmigo...
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '20px' }}>
      
      {/* Navegación Superior */}
      <header style={{ maxWidth: '1200px', width: '100%', margin: '0 auto 40px auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 className="text-gradient" style={{ fontSize: '1.8rem', fontWeight: 800 }}>
          TocaConmigo
        </h1>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => router.push('/login')} className="btn-secondary">
            Iniciar Sesión
          </button>
          <button onClick={() => router.push('/register')} className="btn-primary">
            Registrarse
          </button>
        </div>
      </header>

      {/* Hero Principal con Imagen de Banner */}
      <section style={{ maxWidth: '900px', margin: '0 auto 60px auto', textAlign: 'center' }}>
        <div className="badge badge-amber" style={{ marginBottom: '20px' }}>
          <span className="pulse-indicator"></span> Músicos aficionados en Barcelona
        </div>
        <h2 className="text-gradient" style={{ fontSize: '2.8rem', lineHeight: 1.2, marginBottom: '20px' }}>
          Conecta con músicos cerca de ti y organiza tu próxima sesión
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginBottom: '32px' }}>
          Encuentra bajistas, guitarristas, cantantes o baterías cerca de ti. Explora perfiles y empieza a tocar juntos.
        </p>

        {/* Renderizado de la imagen desde public/og-image.png */}
        <div 
          className="glass-panel" 
          style={{ 
            overflow: 'hidden', 
            borderRadius: 'var(--radius-lg)', 
            marginBottom: '32px',
            border: '1px solid var(--border-color)'
          }}
        >
          <img 
            src="/og-image.png" 
            alt="Músicos en Barcelona - TocaConmigo" 
            style={{ width: '100%', height: 'auto', display: 'block', objectFit: 'cover' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => router.push('/register')} className="btn-primary" style={{ padding: '16px 32px', fontSize: '1.1rem' }}>
            Unirse a la comunidad
          </button>
          <button onClick={() => router.push('/login')} className="btn-secondary" style={{ padding: '16px 32px', fontSize: '1.1rem' }}>
            Explorar plataforma
          </button>
        </div>
      </section>

      {/* Grid de Músicos / Comunidad */}
      <section style={{ maxWidth: '1100px', width: '100%', margin: '0 auto 60px auto' }}>
        <h3 style={{ fontSize: '1.3rem', marginBottom: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          Músicos destacados
        </h3>

        {(!profiles || profiles.length === 0) ? (
          <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Sé de los primeros en unirte a la red de músicos aficionados.
            </p>
            <button onClick={() => router.push('/register')} className="btn-primary">
              Crear mi Perfil
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            {profiles?.map((profile) => (
              <div 
                key={profile.id || Math.random().toString()} 
                className="glass-panel glass-panel-interactive"
                onClick={() => router.push('/login')}
                style={{ padding: '24px', textAlign: 'center', cursor: 'pointer' }}
              >
                <div style={{ width: '70px', height: '70px', borderRadius: 'var(--radius-full)', background: 'var(--bg-surface-hover)', margin: '0 auto 16px auto', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-color)', color: 'var(--accent-gold)', fontSize: '1.5rem', fontWeight: 700 }}>
                  {(profile.full_name || 'M')[0]}
                </div>
                <h4 style={{ fontSize: '1.2rem', marginBottom: '6px' }}>
                  {profile.full_name || 'Músico'}
                </h4>
                <div style={{ marginBottom: '12px' }}>
                  <span className="badge badge-indigo">
                    {profile.instrument || 'Instrumento'}
                  </span>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  {profile.location || 'Barcelona'}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Pie de página */}
      <footer style={{ borderTop: '1px solid var(--border-color)', paddingTop: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
        © {new Date().getFullYear()} TocaConmigo Barcelona. Todos los derechos reservados.
      </footer>
    </div>
  );
}