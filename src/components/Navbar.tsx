'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Search, Send, User, LogOut, Video } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface NavbarProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export default function Navbar({ activeTab, onTabChange }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  const navItems = [
    { id: 'discover', label: 'Explorar', href: '/discover', icon: Search },
    { id: 'connections', label: 'Propuestas', href: '/connections', icon: Send },
    { id: 'profile', label: 'Mi Perfil', href: '/profile', icon: User },
  ];

  const handleItemClick = (href: string, id: string) => {
    if (onTabChange) {
      onTabChange(id);
    }
    router.push(href);
  };

  return (
    <header style={{
      backgroundColor: '#181818',
      borderBottom: '1px solid #2a2a2a',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{
        maxWidth: '1000px',
        margin: '0 auto',
        padding: '0.85rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {/* Logo */}
        <Link href="/discover" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.3rem', fontWeight: 900, color: '#e05638', letterSpacing: '-0.5px' }}>
            TocaConmigo
          </span>
        </Link>

        {/* Links de Navegación */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || activeTab === item.id;
            return (
              <button
                key={item.href}
                onClick={() => handleItemClick(item.href, item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '0.5rem 0.85rem',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '0.9rem',
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? '#fff' : '#aaa',
                  backgroundColor: isActive ? '#262626' : 'transparent',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <Icon size={16} color={isActive ? '#e05638' : '#aaa'} />
                <span>{item.label}</span>
              </button>
            );
          })}

          {/* Botón opcional para activar 'my-video' si existe callback */}
          {onTabChange && (
            <button
              onClick={() => onTabChange('my-video')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '0.5rem 0.85rem',
                borderRadius: '8px',
                border: '1px solid #333',
                fontSize: '0.9rem',
                fontWeight: activeTab === 'my-video' ? 700 : 500,
                color: activeTab === 'my-video' ? '#fff' : '#aaa',
                backgroundColor: activeTab === 'my-video' ? '#262626' : 'transparent',
                cursor: 'pointer',
              }}
            >
              <Video size={16} color={activeTab === 'my-video' ? '#e05638' : '#aaa'} />
              <span>Mi Vídeo</span>
            </button>
          )}

          <button
            onClick={handleLogout}
            title="Cerrar sesión"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '0.5rem 0.85rem',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: 'transparent',
              color: '#888',
              cursor: 'pointer',
              fontSize: '0.9rem',
            }}
          >
            <LogOut size={16} />
          </button>
        </nav>
      </div>
    </header>
  );
}
