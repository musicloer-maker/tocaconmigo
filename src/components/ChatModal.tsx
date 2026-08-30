'use client';

import React, { useState } from 'react';
import { MusicianProfile, Message } from '@/types';
import { X, Send, Lock, CheckCheck } from 'lucide-react';

interface ChatModalProps {
  recipient: MusicianProfile;
  onClose: () => void;
}

export const ChatModal: React.FC<ChatModalProps> = ({ recipient, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm-1',
      conversation_id: 'conv-1',
      sender_id: recipient.id,
      content: `¡Hola Marc! He visto que tocas guitarra acústica en Gràcia. Yo toco el bajo en Poblenou. ¿Sigues buscando gente para improvisar temas sencillos?`,
      is_read: true,
      created_at: '17:30',
    },
    {
      id: 'm-2',
      conversation_id: 'conv-1',
      sender_id: 'current-user-id',
      content: `¡Hola ${recipient.display_name}! Sí, totalmente. Me apetece mucho hacer una jam relajada de blues o pop. ¿Qué tal te viene este fin de semana?`,
      is_read: true,
      created_at: '17:34',
    },
  ]);

  const [inputContent, setInputContent] = useState('');

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputContent.trim()) return;

    const newMessage: Message = {
      id: `m-${Date.now()}`,
      conversation_id: 'conv-1',
      sender_id: 'current-user-id',
      content: inputContent,
      is_read: false,
      created_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputContent('');

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: `m-reply-${Date.now()}`,
          conversation_id: 'conv-1',
          sender_id: recipient.id,
          content: '¡Genial! Me va super bien el sábado a partir de las 17:00h.',
          is_read: true,
          created_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }, 1500);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0,0,0,0.8)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '1rem',
    }}>
      <div className="glass-panel" style={{
        maxWidth: '520px',
        width: '100%',
        height: '600px',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        border: '1px solid var(--border-glow)',
      }}>
        <div style={{
          padding: '1rem 1.25rem',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--accent-amber), var(--accent-orange))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              color: '#000',
            }}>
              {recipient.display_name.charAt(0)}
            </div>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>
                {recipient.display_name}
              </h3>
              <div style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span className="pulse-indicator" style={{ width: '6px', height: '6px' }} />
                <span>Mensajería Privada Segura</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{ color: 'var(--text-secondary)', padding: '6px', borderRadius: '50%' }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.02)',
          padding: '6px 12px',
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          borderBottom: '1px solid var(--border-color)',
        }}>
          <Lock size={12} />
          <span>Conversación privada. Solo los participantes tienen acceso a este chat.</span>
        </div>

        <div style={{
          flex: 1,
          padding: '1.25rem',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}>
          {messages.map((msg) => {
            const isMe = msg.sender_id === 'current-user-id';
            return (
              <div
                key={msg.id}
                style={{
                  alignSelf: isMe ? 'flex-end' : 'flex-start',
                  maxWidth: '80%',
                  backgroundColor: isMe ? 'rgba(245, 158, 11, 0.18)' : 'var(--bg-surface-hover)',
                  border: `1px solid ${isMe ? 'rgba(245, 158, 11, 0.3)' : 'var(--border-color)'}`,
                  borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  padding: '10px 14px',
                }}
              >
                <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', margin: 0, lineHeight: 1.4 }}>
                  {msg.content}
                </p>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  gap: '4px',
                  marginTop: '4px',
                  fontSize: '0.7rem',
                  color: 'var(--text-muted)',
                }}>
                  <span>{msg.created_at}</span>
                  {isMe && <CheckCheck size={14} style={{ color: 'var(--accent-amber)' }} />}
                </div>
              </div>
            );
          })}
        </div>

        <form
          onSubmit={handleSendMessage}
          style={{
            padding: '1rem 1.25rem',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            gap: '8px',
          }}
        >
          <input
            type="text"
            placeholder={`Escribe un mensaje privado a ${recipient.display_name}...`}
            value={inputContent}
            onChange={(e) => setInputContent(e.target.value)}
            style={{
              flex: 1,
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '10px 14px',
              color: 'var(--text-primary)',
              fontSize: '0.9rem',
              outline: 'none',
            }}
          />
          <button type="submit" className="btn-primary" style={{ padding: '10px 18px' }}>
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
};

