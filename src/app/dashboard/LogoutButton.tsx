'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { LogOut } from 'lucide-react';

export function LogoutButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignOut = async () => {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <button
      onClick={handleSignOut}
      disabled={loading}
      className="btn-secondary"
      style={{
        padding: '8px 16px',
        fontSize: '0.85rem',
        borderColor: 'rgba(224, 86, 56, 0.4)',
        color: '#fca5a5',
      }}
    >
      <LogOut size={16} />
      <span>{loading ? 'Cerrando sesión...' : 'Cerrar sesión'}</span>
    </button>
  );
}
