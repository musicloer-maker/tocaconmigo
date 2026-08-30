'use client';

import React, { useState } from 'react';
import { JamSession } from '@/types';
import { Users, Calendar, MapPin, CheckCircle } from 'lucide-react';

interface JamCardProps {
  jam: JamSession;
}

export const JamCard: React.FC<JamCardProps> = ({ jam }) => {
  const [hasJoined, setHasJoined] = useState(false);
  const [currentCount, setCurrentCount] = useState(jam.current_participants_count);

  const handleToggleJoin = () => {
    if (hasJoined) {
      setHasJoined(false);
      setCurrentCount((prev) => prev - 1);
    } else {
      setHasJoined(true);
      setCurrentCount((prev) => prev + 1);
    }
  };

  const formattedDate = new Date(jam.event_date).toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="glass-panel glass-panel-interactive" style={{
      padding: '1.5rem',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
    }}>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              {jam.title}
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Organizada por <strong style={{ color: 'var(--accent-gold)' }}>{jam.creator?.display_name}</strong>
            </span>
          </div>

          <div className="badge badge-amber" style={{ fontSize: '0.85rem' }}>
            <Users size={14} />
            <span>{currentCount} / {jam.max_capacity} plazas</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.8rem',
            color: 'var(--accent-gold)',
            backgroundColor: 'rgba(245, 158, 11, 0.08)',
            padding: '4px 10px',
            borderRadius: 'var(--radius-sm)',
          }}>
            <MapPin size={14} />
            <span>{jam.zone?.name || 'Barcelona'}</span>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.8rem',
            color: '#a5b4fc',
            backgroundColor: 'rgba(99, 102, 241, 0.1)',
            padding: '4px 10px',
            borderRadius: 'var(--radius-sm)',
          }}>
            <Calendar size={14} />
            <span style={{ textTransform: 'capitalize' }}>{formattedDate}</span>
          </div>
        </div>

        <p style={{
          fontSize: '0.9rem',
          color: 'var(--text-secondary)',
          lineHeight: 1.5,
          marginBottom: '16px',
        }}>
          {jam.description}
        </p>
      </div>

      <div style={{
        paddingTop: '12px',
        borderTop: '1px solid var(--border-color)',
        display: 'flex',
        justifyContent: 'flex-end',
      }}>
        <button
          onClick={handleToggleJoin}
          className={hasJoined ? 'btn-secondary' : 'btn-primary'}
          style={{
            fontSize: '0.85rem',
            padding: '8px 18px',
            borderColor: hasJoined ? 'var(--accent-emerald)' : undefined,
            color: hasJoined ? 'var(--accent-emerald)' : undefined,
          }}
        >
          {hasJoined ? (
            <>
              <CheckCircle size={16} />
              <span>Solicitud enviada (Participando)</span>
            </>
          ) : (
            <>
              <Users size={16} />
              <span>Unirme a la Quedada</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
