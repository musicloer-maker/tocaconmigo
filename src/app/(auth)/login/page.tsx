
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Music,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  Chrome,
  Apple,
  Phone,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);

  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email || !password) {
      setErrorMsg('Por favor introduce tu email y contraseña.');
      return;
    }

    setLoading(true);

    const supabase = createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMsg(
        error.message === 'Invalid login credentials'
          ? 'Email o contraseña incorrectos. Por favor compruébalos.'
          : error.message
      );
      setLoading(false);
      return;
    }

    router.push('/dashboard');
    router.refresh();
  };

  const handleGoogle = async () => {
    setErrorMsg(null);
    setSocialLoading('google');

    const supabase = createClient();

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
      },
    });

    if (error) {
      setErrorMsg(error.message);
      setSocialLoading(null);
    }
  };

  const handleApple = async () => {
    setErrorMsg(null);
    setSocialLoading('apple');

    const supabase = createClient();

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
      },
    });

    if (error) {
      setErrorMsg(error.message);
      setSocialLoading(null);
    }
  };

  const handlePhone = () => {
    router.push('/login/phone');
  };

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1rem',
        background:
          'radial-gradient(circle at top, rgba(245,158,11,0.08), transparent 35%), var(--bg-primary)',
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '430px',
          padding: '2.5rem 2rem',
          border: '1px solid var(--border-glow)',
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div
            style={{
              width: '54px',
              height: '54px',
              borderRadius: '16px',
              background:
                'linear-gradient(135deg, var(--accent-amber), var(--accent-orange))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#000',
              margin: '0 auto 1rem',
              boxShadow: '0 6px 24px rgba(245,158,11,0.28)',
            }}
          >
            <Music size={28} strokeWidth={2.5} />
          </div>

          <h1
            style={{
              fontSize: '1.65rem',
              fontWeight: 800,
              margin: 0,
              letterSpacing: '-0.02em',
            }}
          >
            Bienvenido a TocaConmigo
          </h1>

          <p
            style={{
              fontSize: '0.9rem',
              color: 'var(--text-secondary)',
              marginTop: '0.55rem',
              lineHeight: 1.5,
            }}
          >
            Conecta con músicos y encuentra tu próxima quedada en Barcelona.
          </p>
        </div>

        {/* Social login */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.7rem',
          }}
        >
          <button
            type="button"
            onClick={handleGoogle}
            disabled={socialLoading !== null || loading}
            style={{
              width: '100%',
              minHeight: '46px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-surface)',
              color: 'var(--text-primary)',
              fontSize: '0.9rem',
              fontWeight: 650,
              cursor: 'pointer',
            }}
          >
            <Chrome size={18} />
            {socialLoading === 'google'
              ? 'Conectando...'
              : 'Continuar con Google'}
          </button>

          <button
            type="button"
            onClick={handleApple}
            disabled={socialLoading !== null || loading}
            style={{
              width: '100%',
              minHeight: '46px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-surface)',
              color: 'var(--text-primary)',
              fontSize: '0.9rem',
              fontWeight: 650,
              cursor: 'pointer',
            }}
          >
            <Apple size={19} />
            {socialLoading === 'apple'
              ? 'Conectando...'
              : 'Continuar con Apple'}
          </button>

          <button
            type="button"
            onClick={handlePhone}
            disabled={socialLoading !== null || loading}
            style={{
              width: '100%',
              minHeight: '46px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-surface)',
              color: 'var(--text-primary)',
              fontSize: '0.9rem',
              fontWeight: 650,
              cursor: 'pointer',
            }}
          >
            <Phone size={18} />
            Continuar con teléfono
          </button>
        </div>

        {/* Separator */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            margin: '1.5rem 0',
            color: 'var(--text-muted)',
            fontSize: '0.75rem',
          }}
        >
          <div
            style={{
              flex: 1,
              height: '1px',
              background: 'var(--border-color)',
            }}
          />
          <span>o continúa con tu email</span>
          <div
            style={{
              flex: 1,
              height: '1px',
              background: 'var(--border-color)',
            }}
          />
        </div>

        {/* Error */}
        {errorMsg && (
          <div
            style={{
              backgroundColor: 'rgba(224,86,56,0.15)',
              border: '1px solid var(--accent-terracotta)',
              color: '#fca5a5',
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.85rem',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Email login */}
        <form
          onSubmit={handleLogin}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1.15rem',
          }}
        >
          <div>
            <label
              style={{
                fontSize: '0.85rem',
                fontWeight: 600,
                display: 'block',
                marginBottom: '6px',
              }}
            >
              Correo electrónico
            </label>

            <div style={{ position: 'relative' }}>
              <Mail
                size={18}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                }}
              />

              <input
                type="email"
                required
                autoComplete="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 12px 12px 40px',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '6px',
              }}
            >
              <label
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 600,
                }}
              >
                Contraseña
              </label>

              <Link
                href="/forgot-password"
                style={{
                  fontSize: '0.8rem',
                  color: 'var(--accent-amber)',
                }}
              >
                ¿La has olvidado?
              </Link>
            </div>

            <div style={{ position: 'relative' }}>
              <Lock
                size={18}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                }}
              />

              <input
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 12px 12px 40px',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || socialLoading !== null}
            className="btn-primary"
            style={{
              width: '100%',
              justifyContent: 'center',
              padding: '12px',
              marginTop: '4px',
            }}
          >
            {loading ? (
              <span>Iniciando sesión...</span>
            ) : (
              <>
                <span>Iniciar sesión</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Register */}
        <div
          style={{
            textAlign: 'center',
            marginTop: '1.75rem',
            paddingTop: '1.25rem',
            borderTop: '1px solid var(--border-color)',
            fontSize: '0.85rem',
            color: 'var(--text-secondary)',
          }}
        >
          ¿Aún no tienes cuenta?{' '}
          <Link
            href="/register"
            style={{
              color: 'var(--accent-gold)',
              fontWeight: 700,
            }}
          >
            Regístrate gratis
          </Link>
        </div>
      </div>
    </main>
  );
}