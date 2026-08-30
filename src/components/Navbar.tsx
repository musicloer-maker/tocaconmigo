'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Music, Search, Users, Video, MessageSquare, User, LogIn } from 'lucide-react';

interface NavbarProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  unreadMessagesCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab = 'explore',
  onTabChange,
  unreadMessagesCount = 1,
}) => {
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) {
        setUserEmail(user.email);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      backgroundColor: 'rgba(11, 12, 16, 0.85)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border-color)',
      padding: '0.8rem 1.5rem',
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
      }}>
        {/* Logo */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, var(--accent-amber), var(--accent-orange))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#000',
            boxShadow: '0 4px 15px rgba(245, 158, 11, 0.3)',
          }}>
            <Music size={22} strokeWidth={2.5} />
          </div>
          <div>
            <span style={{
              fontSize: '1.25rem',
              fontWeight: 800,
              fontFamily: 'var(--font-heading)',
              letterSpacing: '-0.03em',
            }}>
              Toca<span style={{ color: 'var(--accent-amber)' }}>Conmigo</span>
            </span>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span>Barcelona</span>
              <span style={{ fontSize: '0.5rem' }}>•</span>
              <span style={{ color: 'var(--accent-emerald)', fontWeight: 600 }}>Músicos Aficionados</span>
            </div>
          </div>
        </Link>

        {/* Navigation Tabs */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => onTabChange?.('explore')}
            className={`btn-secondary ${activeTab === 'explore' ? 'active-tab' : ''}`}
            style={{
              padding: '8px 16px',
              fontSize: '0.9rem',
              borderColor: activeTab === 'explore' ? 'var(--accent-amber)' : 'var(--border-color)',
              color: activeTab === 'explore' ? 'var(--accent-amber)' : 'var(--text-primary)',
            }}
          >
            <Search size={16} />
            <span>Buscar Músicos</span>
          </button>

          <button
            onClick={() => onTabChange?.('jams')}
            className="btn-secondary"
            style={{
              padding: '8px 16px',
              fontSize: '0.9rem',
              borderColor: activeTab === 'jams' ? 'var(--accent-amber)' : 'var(--border-color)',
              color: activeTab === 'jams' ? 'var(--accent-amber)' : 'var(--text-primary)',
            }}
          >
            <Users size={16} />
            <span>Quedadas (Jams)</span>
          </button>

          <button
            onClick={() => onTabChange?.('my-video')}
            className="btn-secondary"
            style={{
              padding: '8px 16px',
              fontSize: '0.9rem',
              borderColor: activeTab === 'my-video' ? 'var(--accent-amber)' : 'var(--border-color)',
              color: activeTab === 'my-video' ? 'var(--accent-amber)' : 'var(--text-primary)',
            }}
          >
            <Video size={16} />
            <span>Mi Vídeo "Así toco"</span>
          </button>

          <button
            onClick={() => onTabChange?.('messages')}
            className="btn-secondary"
            style={{
              padding: '8px 16px',
              fontSize: '0.9rem',
              position: 'relative',
              borderColor: activeTab === 'messages' ? 'var(--accent-amber)' : 'var(--border-color)',
              color: activeTab === 'messages' ? 'var(--accent-amber)' : 'var(--text-primary)',
            }}
          >
            <MessageSquare size={16} />
            <span>Mensajes</span>
            {unreadMessagesCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                backgroundColor: 'var(--accent-orange)',
                color: '#fff',
                fontSize: '0.7rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {unreadMessagesCount}
              </span>
            )}
          </button>
        </nav>

        {/* Dynamic Auth Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {userEmail ? (
            <Link
              href="/dashboard"
              className="btn-secondary"
              style={{
                padding: '8px 14px',
                fontSize: '0.85rem',
                borderColor: 'var(--accent-emerald)',
                color: 'var(--accent-emerald)',
              }}
            >
              <User size={16} />
              <span>Zona Privada</span>
            </Link>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Link
                href="/login"
                className="btn-secondary"
                style={{ padding: '8px 14px', fontSize: '0.85rem' }}
              >
                <LogIn size={16} />
                <span>Entrar</span>
              </Link>

              <Link
                href="/register"
                className="btn-primary"
                style={{ padding: '8px 14px', fontSize: '0.85rem' }}
              >
                <span>Crear Cuenta</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

