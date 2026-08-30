'use client';

import React, { useState, useMemo } from 'react';
import { Navbar } from '@/components/Navbar';
import { MusicianCard } from '@/components/MusicianCard';
import { JamCard } from '@/components/JamCard';
import { VideoModal } from '@/components/VideoModal';
import { ChatModal } from '@/components/ChatModal';
import { BARCELONA_ZONES, getZoneById, calculateHaversineDistanceKm } from '@/lib/zones';
import { SAMPLE_MUSICIAN_PROFILES, SAMPLE_INSTRUMENTS, SAMPLE_STYLES, SAMPLE_JAMS } from '@/lib/mockData';
import { MusicianProfile } from '@/types';
import { Search, MapPin, Music, Sparkles, Plus } from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState<string>('explore');
  const [selectedZoneId, setSelectedZoneId] = useState<string>('all');
  const [selectedInstrumentId, setSelectedInstrumentId] = useState<string>('all');
  const [selectedStyleId, setSelectedStyleId] = useState<string>('all');
  const [onlyAvailableNow, setOnlyAvailableNow] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [activeVideoMusician, setActiveVideoMusician] = useState<MusicianProfile | null>(null);
  const [isMyVideoOpen, setIsMyVideoOpen] = useState<boolean>(false);
  const [activeChatMusician, setActiveChatMusician] = useState<MusicianProfile | null>(null);

  // Mi zona como usuario actual (ej. Gràcia)
  const currentUserZoneId = 'z-gracia';
  const currentUserZone = getZoneById(currentUserZoneId);
  const currentUserLat = currentUserZone?.centroid_lat || 41.4036;
  const currentUserLng = currentUserZone?.centroid_lng || 2.1568;

  // Algoritmo de descubrimiento equilibrado (Afinidad musical + Disponibilidad + Proximidad)
  const filteredAndSortedMusicians = useMemo(() => {
    const list = SAMPLE_MUSICIAN_PROFILES.filter((m) => {
      if (selectedZoneId !== 'all' && m.zone_id !== selectedZoneId) return false;

      if (selectedInstrumentId !== 'all') {
        const hasInst = m.instruments.some((i) => i.id === selectedInstrumentId);
        if (!hasInst) return false;
      }

      if (selectedStyleId !== 'all') {
        const hasStyle = m.styles.some((s) => s.id === selectedStyleId);
        if (!hasStyle) return false;
      }

      if (onlyAvailableNow && !m.is_currently_available) return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchName = m.display_name.toLowerCase().includes(query);
        const matchBio = (m.bio || '').toLowerCase().includes(query);
        const matchLooking = m.looking_for.toLowerCase().includes(query);
        if (!matchName && !matchBio && !matchLooking) return false;
      }

      return true;
    });

    return list.sort((a, b) => {
      let scoreA = 0;
      let scoreB = 0;

      if (a.is_currently_available) scoreA += 15;
      if (b.is_currently_available) scoreB += 15;

      if (a.video_url) scoreA += 10;
      if (b.video_url) scoreB += 10;

      const distA = a.zone ? calculateHaversineDistanceKm(currentUserLat, currentUserLng, a.zone.centroid_lat, a.zone.centroid_lng) : 5;
      const distB = b.zone ? calculateHaversineDistanceKm(currentUserLat, currentUserLng, b.zone.centroid_lat, b.zone.centroid_lng) : 5;

      if (distA <= 2.0) scoreA += 10;
      else if (distA <= 5.0) scoreA += 5;

      if (distB <= 2.0) scoreB += 10;
      else if (distB <= 5.0) scoreB += 5;

      return scoreB - scoreA;
    });
  }, [selectedZoneId, selectedInstrumentId, selectedStyleId, onlyAvailableNow, searchQuery, currentUserLat, currentUserLng]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        onTabChange={(tab) => {
          if (tab === 'my-video') {
            setIsMyVideoOpen(true);
          } else {
            setActiveTab(tab);
          }
        }}
      />

      {/* Main Content */}
      <main style={{ flex: 1, maxWidth: '1200px', width: '100%', margin: '0 auto', padding: '2rem 1.5rem' }}>
        
        {/* Banner de Bienvenida y Principios del Producto */}
        <section style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.25)',
            color: 'var(--accent-gold)',
            padding: '6px 16px',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.85rem',
            fontWeight: 600,
            marginBottom: '1rem',
          }}>
            <Sparkles size={16} />
            <span>Músicos aficionados en Barcelona • Sin clasificaciones ni puntuaciones</span>
          </div>

          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '0.75rem' }} className="text-gradient">
            Encuentra con quién tocar música en tu barrio
          </h1>

          <p style={{ maxWidth: '680px', margin: '0 auto', color: 'var(--text-secondary)', fontSize: '1.05rem' }}>
            Conecta con otros músicos en Barcelona por instrumentos, estilos y disponibilidad. Sin rankings ni presiones.
          </p>

          {/* User Location Selector (Privacy Aware) */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            padding: '8px 16px',
            borderRadius: 'var(--radius-md)',
            marginTop: '1.25rem',
            fontSize: '0.9rem',
          }}>
            <MapPin size={16} style={{ color: 'var(--accent-amber)' }} />
            <span>Tu zona elegida:</span>
            <strong style={{ color: 'var(--accent-gold)' }}>{currentUserZone?.name}</strong>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>(Ubicación imprecisa de barrio para proteger tu privacidad)</span>
          </div>
        </section>

        {/* TAB 1: EXPLORAR MÚSICOS */}
        {activeTab === 'explore' && (
          <div>
            {/* Search & Filter Bar */}
            <div className="glass-panel" style={{ padding: '1.25rem', marginBottom: '2rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', alignItems: 'center' }}>
                
                {/* Search Input */}
                <div style={{ position: 'relative' }}>
                  <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    placeholder="Buscar por nombre, texto..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      width: '100%',
                      backgroundColor: 'var(--bg-surface)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      padding: '10px 12px 10px 36px',
                      color: 'var(--text-primary)',
                      fontSize: '0.9rem',
                      outline: 'none',
                    }}
                  />
                </div>

                {/* Zone Filter */}
                <select
                  value={selectedZoneId}
                  onChange={(e) => setSelectedZoneId(e.target.value)}
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    padding: '10px 12px',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem',
                    outline: 'none',
                  }}
                >
                  <option value="all">📍 Todas las zonas de Barcelona (20)</option>
                  {BARCELONA_ZONES.map((zone) => (
                    <option key={zone.id} value={zone.id}>
                      {zone.name} ({zone.district})
                    </option>
                  ))}
                </select>

                {/* Instrument Filter */}
                <select
                  value={selectedInstrumentId}
                  onChange={(e) => setSelectedInstrumentId(e.target.value)}
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    padding: '10px 12px',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem',
                    outline: 'none',
                  }}
                >
                  <option value="all">🎸 Todos los instrumentos</option>
                  {SAMPLE_INSTRUMENTS.map((inst) => (
                    <option key={inst.id} value={inst.id}>
                      {inst.name}
                    </option>
                  ))}
                </select>

                {/* Style Filter */}
                <select
                  value={selectedStyleId}
                  onChange={(e) => setSelectedStyleId(e.target.value)}
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    padding: '10px 12px',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem',
                    outline: 'none',
                  }}
                >
                  <option value="all">🎶 Todos los estilos</option>
                  {SAMPLE_STYLES.map((style) => (
                    <option key={style.id} value={style.id}>
                      {style.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Toggle "Disponible ahora" */}
              <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px solid var(--border-color)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
                  <input
                    type="checkbox"
                    checked={onlyAvailableNow}
                    onChange={(e) => setOnlyAvailableNow(e.target.checked)}
                    style={{ accentColor: 'var(--accent-amber)', width: '16px', height: '16px' }}
                  />
                  <span>Mostrar solo músicos con <strong>"Estoy disponible"</strong> activo</span>
                </label>

                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Mostrando {filteredAndSortedMusicians.length} músico(s) en Barcelona
                </span>
              </div>
            </div>

            {/* Musicians Grid */}
            {filteredAndSortedMusicians.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem' }}>
                {filteredAndSortedMusicians.map((musician) => (
                  <MusicianCard
                    key={musician.id}
                    musician={musician}
                    currentUserZoneId={currentUserZoneId}
                    currentUserLat={currentUserLat}
                    currentUserLng={currentUserLng}
                    onOpenVideo={(m) => setActiveVideoMusician(m)}
                    onStartChat={(m) => setActiveChatMusician(m)}
                  />
                ))}
              </div>
            ) : (
              <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <Music size={40} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
                <h3>No se encontraron músicos con los filtros seleccionados</h3>
                <p style={{ fontSize: '0.9rem', marginTop: '6px' }}>
                  Prueba cambiando el instrumento, la zona de Barcelona o eliminando filtros.
                </p>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: QUEDADAS (JAMS) */}
        {activeTab === 'jams' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Quedadas Musicales en Barcelona</h2>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  Propón o únete a quedadas espontáneas para tocar en locales de ensayo o parques.
                </p>
              </div>

              <button
                onClick={() => alert('Creación de quedada: abre el formulario de nueva jam.')}
                className="btn-primary"
              >
                <Plus size={18} />
                <span>Crear Quedada</span>
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.5rem' }}>
              {SAMPLE_JAMS.map((jam) => (
                <JamCard key={jam.id} jam={jam} />
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: MENSAJERÍA DIRECTA LIST */}
        {activeTab === 'messages' && (
          <div className="glass-panel" style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '1rem' }}>Tus Conversaciones Privadas</h2>
            
            <div
              onClick={() => setActiveChatMusician(SAMPLE_MUSICIAN_PROFILES[1])}
              className="glass-panel-interactive"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                border: '1px solid var(--border-glow)',
                backgroundColor: 'rgba(245, 158, 11, 0.05)',
              }}
            >
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--accent-amber), var(--accent-orange))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                color: '#000',
              }}>
                L
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ margin: 0, fontWeight: 700 }}>Laura Soler (@laurabass_bcn)</h4>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>17:34</span>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--accent-gold)', margin: '4px 0 0 0' }}>
                  ¡Hola Marc! He visto que tocas guitarra acústica en Gràcia...
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--border-color)',
        padding: '1.5rem',
        textAlign: 'center',
        color: 'var(--text-muted)',
        fontSize: '0.85rem',
        marginTop: '3rem',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <strong>TocaConmigo Barcelona</strong> — Plataforma respetuosa con la privacidad para conectar músicos aficionados.
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span>Sin rankings</span>
            <span>•</span>
            <span>Sin estrellas</span>
            <span>•</span>
            <span>100% Privado</span>
          </div>
        </div>
      </footer>

      {/* MODALS */}
      {(activeVideoMusician || isMyVideoOpen) && (
        <VideoModal
          musician={activeVideoMusician}
          isMyVideoMode={isMyVideoOpen}
          onClose={() => {
            setActiveVideoMusician(null);
            setIsMyVideoOpen(false);
          }}
          onSaveVideo={(url, dur) => {
            alert(`¡Vídeo guardado con éxito! Duración: ${dur} segundos.`);
          }}
        />
      )}

      {activeChatMusician && (
        <ChatModal
          recipient={activeChatMusician}
          onClose={() => setActiveChatMusician(null)}
        />
      )}
    </div>
  );
}

