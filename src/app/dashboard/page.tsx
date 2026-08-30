import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { LogoutButton } from './LogoutButton';
import { Music, ShieldCheck, Mail, Key, User, ArrowLeft } from 'lucide-react';

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-primary)', padding: '2rem 1.5rem' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        
        {/* Header navigation back to home */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <Link href="/" style={{ color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
            <ArrowLeft size={16} />
            <span>Volver a la portada de TocaConmigo</span>
          </Link>

          <LogoutButton />
        </div>

        {/* Protected Area Glass Panel */}
        <div className="glass-panel" style={{ padding: '2.5rem 2rem', border: '1px solid var(--border-glow)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '1.5rem' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, var(--accent-emerald), var(--accent-indigo))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
            }}>
              <ShieldCheck size={26} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Zona Privada de Usuario</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--accent-emerald)' }}>
                <span className="pulse-indicator" style={{ width: '8px', height: '8px' }} />
                <span>Sesión Autenticada de Forma Segura mediante Supabase SSR</span>
              </div>
            </div>
          </div>

          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '2rem', lineHeight: 1.6 }}>
            ¡Enhorabuena! Has accedido correctamente a la zona privada de TocaConmigo. Esta página verifica la sesión en el servidor antes de renderizar cualquier contenido.
          </p>

          {/* User Details Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            
            <div style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '1.25rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-gold)', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 700 }}>
                <Mail size={16} />
                <span>EMAIL AUTENTICADO</span>
              </div>
              <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', wordBreak: 'break-all' }}>
                {user.email}
              </p>
            </div>

            <div style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '1.25rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#a5b4fc', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 700 }}>
                <Key size={16} />
                <span>ID ÚNICO DE USUARIO (UUID)</span>
              </div>
              <p style={{ fontSize: '0.85rem', fontFamily: 'monospace', color: 'var(--text-primary)', wordBreak: 'break-all' }}>
                {user.id}
              </p>
            </div>

          </div>

          {/* Notice about Next Phase */}
          <div style={{
            backgroundColor: 'rgba(245, 158, 11, 0.08)',
            border: '1px solid rgba(245, 158, 11, 0.2)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem 1.25rem',
            fontSize: '0.85rem',
            color: 'var(--accent-gold)',
          }}>
            <strong>Nota de la Fase 2:</strong> En la siguiente fase conectaremos este usuario autenticado con la tabla `profiles` para gestionar tu perfil musical, tus instrumentos y tu vídeo "Así toco" en Barcelona.
          </div>
        </div>
      </div>
    </div>
  );
}
