
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Music,
  Phone,
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  CheckCircle,
  ShieldCheck,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function PhoneLoginPage() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const router = useRouter();

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();

    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanPhone = phone.replace(/\s/g, '');

    if (!cleanPhone) {
      setErrorMsg('Introduce tu número de teléfono.');
      return;
    }

    if (!/^\+[1-9]\d{7,14}$/.test(cleanPhone)) {
      setErrorMsg(
        'Introduce el número con prefijo internacional. Ejemplo: +34600123456'
      );
      return;
    }

    setLoading(true);

    const supabase = createClient();

    const { error } = await supabase.auth.signInWithOtp({
      phone: cleanPhone,
    });

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
      return;
    }

    setStep('otp');
    setSuccessMsg(
      'Te hemos enviado un código de verificación por SMS.'
    );
    setLoading(false);
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();

    setErrorMsg(null);
    setSuccessMsg(null);

    if (!/^\d{6}$/.test(otp)) {
      setErrorMsg('Introduce el código de 6 dígitos que has recibido.');
      return;
    }

    setLoading(true);

    const cleanPhone = phone.replace(/\s/g, '');

    const supabase = createClient();

    const { error } = await supabase.auth.verifyOtp({
      phone: cleanPhone,
      token: otp,
      type: 'sms',
    });

    if (error) {
      setErrorMsg(
        error.message === 'Token has expired or is invalid'
          ? 'El código no es válido o ha caducado. Solicita uno nuevo.'
          : error.message
      );
      setLoading(false);
      return;
    }

    router.push('/dashboard');
    router.refresh();
  };

  const handleBack = () => {
    setStep('phone');
    setOtp('');
    setErrorMsg(null);
    setSuccessMsg(null);
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
        {/* Header */}
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
              fontSize: '1.55rem',
              fontWeight: 800,
              margin: 0,
              letterSpacing: '-0.02em',
            }}
          >
            {step === 'phone'
              ? 'Entra con tu teléfono'
              : 'Introduce tu código'}
          </h1>

          <p
            style={{
              fontSize: '0.9rem',
              color: 'var(--text-secondary)',
              marginTop: '0.55rem',
              lineHeight: 1.5,
            }}
          >
            {step === 'phone'
              ? 'Te enviaremos un código SMS para acceder a TocaConmigo.'
              : `Hemos enviado un código de 6 dígitos a ${phone}.`}
          </p>
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

        {/* Success */}
        {successMsg && (
          <div
            style={{
              backgroundColor: 'rgba(16,185,129,0.12)',
              border: '1px solid var(--accent-emerald)',
              color: '#6ee7b7',
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.85rem',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <CheckCircle size={16} style={{ flexShrink: 0 }} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Phone step */}
        {step === 'phone' && (
          <form
            onSubmit={handleSendCode}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1.2rem',
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
                Número de teléfono
              </label>

              <div style={{ position: 'relative' }}>
                <Phone
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
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="+34 600 123 456"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={{
                    width: '100%',
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px 12px 12px 40px',
                    color: 'var(--text-primary)',
                    fontSize: '0.95rem',
                    outline: 'none',
                  }}
                />
              </div>

              <p
                style={{
                  marginTop: '7px',
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                }}
              >
                Utiliza el formato internacional, por ejemplo +34 para
                España.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{
                width: '100%',
                justifyContent: 'center',
                padding: '12px',
              }}
            >
              {loading ? (
                <span>Enviando código...</span>
              ) : (
                <>
                  <span>Enviar código</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        )}

        {/* OTP step */}
        {step === 'otp' && (
          <form
            onSubmit={handleVerifyCode}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1.2rem',
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
                Código de verificación
              </label>

              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="123456"
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))
                }
                style={{
                  width: '100%',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '14px',
                  color: 'var(--text-primary)',
                  fontSize: '1.4rem',
                  letterSpacing: '0.35em',
                  textAlign: 'center',
                  outline: 'none',
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{
                width: '100%',
                justifyContent: 'center',
                padding: '12px',
              }}
            >
              {loading ? (
                <span>Verificando...</span>
              ) : (
                <>
                  <ShieldCheck size={17} />
                  <span>Verificar código</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleBack}
              disabled={loading}
              style={{
                border: 'none',
                background: 'transparent',
                color: 'var(--accent-amber)',
                cursor: 'pointer',
                fontSize: '0.82rem',
              }}
            >
              Usar otro número
            </button>
          </form>
        )}

        {/* Back to login */}
        <div
          style={{
            textAlign: 'center',
            marginTop: '1.75rem',
            paddingTop: '1.25rem',
            borderTop: '1px solid var(--border-color)',
          }}
        >
          <Link
            href="/login"
            style={{
              color: 'var(--text-secondary)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.85rem',
            }}
          >
            <ArrowLeft size={16} />
            <span>Volver al inicio de sesión</span>
          </Link>
        </div>
      </div>
    </main>
  );
}