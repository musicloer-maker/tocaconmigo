'use client';

import React, { useState } from 'react';
import { MusicianProfile } from '@/types';
import { calculateHaversineDistanceKm, getProximityBucket } from '@/lib/zones';
import { MapPin, Video, MessageSquare, ShieldAlert } from 'lucide-react';

interface MusicianCardProps {
  musician: MusicianProfile;
  currentUserZoneId: string;
  currentUserLat?: number;
  currentUserLng?: number;
  onOpenVideo?: (musician: MusicianProfile) => void;
  onStartChat?: (musician: MusicianProfile) => void;
}

export const MusicianCard: React.FC<MusicianCardProps> = ({
  musician,
  currentUserZoneId,
  currentUserLat = 41.4036,
  currentUserLng = 2.1568,
  onOpenVideo,
  onStartChat,
}) => {
  const [showSecurityMenu, setShowSecurityMenu] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);

  const distKm = musician.zone
    ? calculateHaversineDistanceKm(
        currentUserLat,
        currentUserLng,
        musician.zone.centroid_lat,
        musician.zone.centroid_lng
      )
    : 1.5;

  const proximityInfo = getProximityBucket(distKm);

  if (isBlocked) {
    return (
      <div className="glass-panel" style={{ padding: '1.5rem', opacity: 0.5, textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Músico ocultado ({musician.display_name}). Has bloqueado a este usuario.
        </p>
        <button
          onClick={() => setIsBlocked(false)}
          style={{ fontSize: '0.8rem', color: 'var(--accent-amber)', marginTop: '8px', textDecoration: 'underline' }}
        >
          Desbloquear
        </button>
      </div>
    );
  }

  return (
    <div className="glass-panel glass-panel-interactive" style={{
      padding: '1.5rem',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      position: 'relative',
    }}>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--bg-surface-hover), var(--border-glow))',
              border: '2px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.1rem',
              fontWeight: 700,
              color: 'var(--accent-gold)',
            }}>
              {musician.display_name.charAt(0)}
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>
                {musician.display_name}
              </h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                @{musician.username}
              </span>
            </div>
          </div>

          {musician.is_currently_available ? (
            <div className="badge badge-emerald">
              <span className="pulse-indicator" />
              <span>Disponible</span>
            </div>
          ) : (
            <div className="badge" style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>
              <span>Buscando jam</span>
            </div>
          )}
        </div>

        {/* Location & Proximity */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '0.85rem',
          color: 'var(--accent-gold)',
          backgroundColor: 'rgba(245, 158, 11, 0.08)',
          padding: '6px 12px',
          borderRadius: 'var(--radius-sm)',
          marginBottom: '14px',
          width: 'fit-content',
        }}>
          <MapPin size={14} />
          <span style={{ fontWeight: 600 }}>{musician.zone?.name || 'Barcelona'}</span>
          <span style={{ opacity: 0.5 }}>•</span>
          <span>{proximityInfo.label}</span>
        </div>

        {musician.bio && (
          <p style={{
            fontSize: '0.9rem',
            color: 'var(--text-secondary)',
            marginBottom: '14px',
            lineHeight: 1.5,
          }}>
            "{musician.bio}"
          </p>
        )}

        <div style={{ marginBottom: '12px' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
            Instrumento(s)
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {musician.instruments.map((inst) => (
              <span key={inst.id} className="badge badge-amber">
                {inst.name}
              </span>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
            Estilos Musicales
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {musician.styles.map((style) => (
              <span key={style.id} className="badge badge-indigo">
                {style.name}
              </span>
            ))}
          </div>
        </div>

        <div style={{
          backgroundColor: 'var(--bg-surface)',
          padding: '10px 14px',
          borderRadius: 'var(--radius-md)',
          marginBottom: '16px',
          fontSize: '0.85rem',
          borderLeft: '3px solid var(--accent-orange)',
        }}>
          <strong style={{ color: 'var(--text-primary)' }}>Qué busca: </strong>
          <span style={{ color: 'var(--text-secondary)' }}>{musician.looking_for}</span>
        </div>
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: '12px',
        borderTop: '1px solid var(--border-color)',
        gap: '8px',
      }}>
        {musician.video_url ? (
          <button
            onClick={() => onOpenVideo?.(musician)}
            className="btn-secondary"
            style={{
              padding: '8px 14px',
              fontSize: '0.85rem',
              borderColor: 'rgba(245, 158, 11, 0.4)',
              color: 'var(--accent-gold)',
            }}
          >
            <Video size={16} />
            <span>Ver vídeo ({musician.video_duration_seconds || 45}s)</span>
          </button>
        ) : (
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
            Sin vídeo publicado
          </span>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setShowSecurityMenu(!showSecurityMenu)}
            style={{
              padding: '8px',
              color: 'var(--text-muted)',
              borderRadius: 'var(--radius-sm)',
            }}
            title="Opciones de seguridad"
          >
            <ShieldAlert size={16} />
          </button>

          <button
            onClick={() => onStartChat?.(musician)}
            className="btn-primary"
            style={{ padding: '8px 16px', fontSize: '0.85rem' }}
          >
            <MessageSquare size={16} />
            <span>Contactar</span>
          </button>
        </div>

        {showSecurityMenu && (
          <div style={{
            position: 'absolute',
            bottom: '60px',
            right: '16px',
            backgroundColor: 'var(--bg-surface-hover)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '8px',
            zIndex: 20,
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
          }}>
            <button
              onClick={() => {
                setIsBlocked(true);
                setShowSecurityMenu(false);
              }}
              style={{
                color: 'var(--accent-terracotta)',
                fontSize: '0.8rem',
                textAlign: 'left',
                padding: '6px 12px',
                borderRadius: '4px',
              }}
            >
              Bloquear a {musician.display_name}
            </button>
            <button
              onClick={() => {
                alert(`Reporte enviado sobre el usuario @${musician.username}. Nuestro equipo revisará el caso.`);
                setShowSecurityMenu(false);
              }}
              style={{
                color: 'var(--text-secondary)',
                fontSize: '0.8rem',
                textAlign: 'left',
                padding: '6px 12px',
                borderRadius: '4px',
              }}
            >
              Reportar comportamiento o contenido
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
