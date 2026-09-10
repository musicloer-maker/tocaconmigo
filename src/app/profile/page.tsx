'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  User,
  MapPin,
  Save,
  LogOut,
  AlertCircle,
  CheckCircle,
  Music,
  Search,
  ArrowLeft,
  Video,
  Upload,
  Trash2,
} from 'lucide-react';

type Profile = {
  id: string;
  username: string | null;
  display_name: string | null;
  bio: string | null;
  location_zone: string | null;
  latitude_approx: number | null;
  longitude_approx: number | null;
  travel_radius_km: number;
  video_url: string | null;
};

type Instrument = {
  id: number;
  name: string;
  slug: string;
};

type MusicStyle = {
  id: number;
  name: string;
  slug: string;
};

type LookingFor = {
  id: number;
  name: string;
  slug: string;
};

const BARCELONA_ZONES = [
  { name: 'Ciutat Vella', lat: 41.3809, lng: 2.1730 },
  { name: 'Eixample', lat: 41.3917, lng: 2.1649 },
  { name: 'Gràcia', lat: 41.4036, lng: 2.1564 },
  { name: 'Sants-Montjuïc', lat: 41.3728, lng: 2.1490 },
  { name: 'Les Corts', lat: 41.3862, lng: 2.1348 },
  { name: 'Sarrià-Sant Gervasi', lat: 41.4010, lng: 2.1395 },
  { name: 'Horta-Guinardó', lat: 41.4214, lng: 2.1670 },
  { name: 'Nou Barris', lat: 41.4416, lng: 2.1770 },
  { name: 'Sant Andreu', lat: 41.4369, lng: 2.1900 },
  { name: 'Sant Martí', lat: 41.4100, lng: 2.2000 },
];

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [latitudeApprox, setLatitudeApprox] = useState<number | null>(null);
  const [longitudeApprox, setLongitudeApprox] = useState<number | null>(null);
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [locationZone, setLocationZone] = useState('');
  const [travelRadius, setTravelRadius] = useState('5');

  // Estado del vídeo
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [uploadingVideo, setUploadingVideo] = useState(false);

  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [musicStyles, setMusicStyles] = useState<MusicStyle[]>([]);
  const [lookingForOptions, setLookingForOptions] = useState<LookingFor[]>([]);

  const [selectedInstrumentIds, setSelectedInstrumentIds] = useState<number[]>([]);
  const [selectedStyleIds, setSelectedStyleIds] = useState<number[]>([]);
  const [selectedLookingForIds, setSelectedLookingForIds] = useState<number[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const router = useRouter();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    setErrorMsg(null);

    const supabase = createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      router.push('/login');
      return;
    }

    const [
      { data: profileData, error: profileError },
      { data: instrumentsData, error: instrumentsError },
      { data: stylesData, error: stylesError },
      { data: lookingForData, error: lookingForError },
      { data: profileInstrumentsData, error: profileInstrumentsError },
      { data: profileStylesData, error: profileStylesError },
      { data: profileLookingForData, error: profileLookingForError },
    ] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('instruments').select('id, name, slug').order('id'),
      supabase.from('music_styles').select('id, name, slug').order('id'),
      supabase.from('looking_for').select('id, name, slug').order('id'),
      supabase.from('profile_instruments').select('instrument_id').eq('profile_id', user.id),
      supabase.from('profile_styles').select('style_id').eq('profile_id', user.id),
      supabase.from('profile_looking_for').select('looking_for_id').eq('profile_id', user.id),
    ]);

    if (profileError) {
      setErrorMsg('No hemos podido cargar tu perfil.');
      setLoading(false);
      return;
    }

    if (instrumentsError || stylesError || lookingForError || profileInstrumentsError || profileStylesError || profileLookingForError) {
      setErrorMsg('Error al cargar datos del perfil.');
      setLoading(false);
      return;
    }

    setProfile(profileData);
    setUsername(profileData.username ?? '');
    setDisplayName(profileData.display_name ?? '');
    setBio(profileData.bio ?? '');
    setLocationZone(profileData.location_zone ?? '');
    setLatitudeApprox(profileData.latitude_approx ?? null);
    setLongitudeApprox(profileData.longitude_approx ?? null);
    setTravelRadius(String(profileData.travel_radius_km ?? 5));
    setVideoUrl(profileData.video_url ?? null);

    setInstruments(instrumentsData ?? []);
    setMusicStyles(stylesData ?? []);
    setLookingForOptions(lookingForData ?? []);

    setSelectedInstrumentIds((profileInstrumentsData ?? []).map((i) => i.instrument_id));
    setSelectedStyleIds((profileStylesData ?? []).map((s) => s.style_id));
    setSelectedLookingForIds((profileLookingForData ?? []).map((l) => l.looking_for_id));

    setLoading(false);
  };

  // Función para subir el vídeo a Supabase Storage
  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);
    setSuccessMsg(null);

    // Validación básica del formato y tamaño (ejemplo: max 50MB)
    if (!file.type.startsWith('video/')) {
      setErrorMsg('Por favor selecciona un archivo de vídeo válido.');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setErrorMsg('El vídeo no debe superar los 50MB.');
      return;
    }

    setUploadingVideo(true);
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push('/login');
      return;
    }

    const fileExt = file.name.split('.').pop();
    const filePath = `${user.id}/presentation-${Date.now()}.${fileExt}`;

    // Subir vídeo al Bucket "videos"
    const { error: uploadError } = await supabase.storage
      .from('videos')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      setErrorMsg(`Error al subir el vídeo: ${uploadError.message}`);
      setUploadingVideo(false);
      return;
    }

    // Obtener la URL pública del vídeo subido
    const { data: publicUrlData } = supabase.storage
      .from('videos')
      .getPublicUrl(filePath);

    setVideoUrl(publicUrlData.publicUrl);
    setUploadingVideo(false);
    setSuccessMsg('Vídeo cargado correctamente. Recuerda guardar los cambios.');
  };

  const handleRemoveVideo = () => {
    setVideoUrl(null);
  };

  const toggleInstrument = (id: number) => {
    setSelectedInstrumentIds((curr) =>
      curr.includes(id) ? curr.filter((i) => i !== id) : [...curr, id]
    );
  };

  const toggleStyle = (id: number) => {
    setSelectedStyleIds((curr) =>
      curr.includes(id) ? curr.filter((s) => s !== id) : [...curr, id]
    );
  };

  const toggleLookingFor = (id: number) => {
    setSelectedLookingForIds((curr) =>
      curr.includes(id) ? curr.filter((l) => l !== id) : [...curr, id]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!displayName.trim()) {
      setErrorMsg('Introduce un nombre visible.');
      return;
    }

    const radius = Number(travelRadius);
    if (!Number.isFinite(radius) || radius < 1 || radius > 100) {
      setErrorMsg('El radio debe estar entre 1 y 100 km.');
      return;
    }

    if (selectedInstrumentIds.length === 0) {
      setErrorMsg('Selecciona al menos un instrumento.');
      return;
    }

    if (selectedStyleIds.length === 0) {
      setErrorMsg('Selecciona al menos un estilo musical.');
      return;
    }

    if (selectedLookingForIds.length === 0) {
      setErrorMsg('Selecciona al menos una opción en «¿Qué buscas?».');
      return;
    }

    setSaving(true);
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push('/login');
      return;
    }

    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .update({
        username: username.trim() || null,
        display_name: displayName.trim(),
        bio: bio.trim() || null,
        location_zone: locationZone ? locationZone.trim() : null,
        latitude_approx: latitudeApprox,
        longitude_approx: longitudeApprox,
        travel_radius_km: radius,
        video_url: videoUrl, // Guardamos la URL pública del vídeo
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select()
      .single();

    if (profileError) {
      setErrorMsg(profileError.message);
      setSaving(false);
      return;
    }

    // Actualizar relaciones (instrumentos, estilos, que busca)
    await supabase.from('profile_instruments').delete().eq('profile_id', user.id);
    await supabase.from('profile_styles').delete().eq('profile_id', user.id);
    await supabase.from('profile_looking_for').delete().eq('profile_id', user.id);

    if (selectedInstrumentIds.length > 0) {
      await supabase.from('profile_instruments').insert(
        selectedInstrumentIds.map((id) => ({ profile_id: user.id, instrument_id: id }))
      );
    }

    if (selectedStyleIds.length > 0) {
      await supabase.from('profile_styles').insert(
        selectedStyleIds.map((id) => ({ profile_id: user.id, style_id: id }))
      );
    }

    if (selectedLookingForIds.length > 0) {
      await supabase.from('profile_looking_for').insert(
        selectedLookingForIds.map((id) => ({ profile_id: user.id, looking_for_id: id }))
      );
    }

    setProfile(profileData);
    setSuccessMsg('Perfil y vídeo guardados correctamente.');
    setSaving(false);
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-primary)', color: 'var(--text-secondary)' }}>
        Cargando tu perfil...
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-primary)', padding: '2rem 1.5rem' }}>
      <div style={{ maxWidth: '700px', margin: '0 auto' }}>
        <Link
          href="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            color: 'var(--text-secondary)',
            textDecoration: 'none',
            fontSize: '0.9rem',
            fontWeight: 600,
            marginBottom: '1.25rem',
          }}
        >
          <ArrowLeft size={18} />
          <span>Volver al inicio</span>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '6px' }}>Mi perfil musical</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Cuéntales a otros músicos quién eres y qué buscas.</p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            style={{
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-surface)',
              color: 'var(--text-secondary)',
              borderRadius: 'var(--radius-md)',
              padding: '9px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              cursor: 'pointer',
            }}
          >
            <LogOut size={16} />
            Salir
          </button>
        </div>

        <div className="glass-panel" style={{ padding: '2rem', border: '1px solid var(--border-glow)' }}>
          {errorMsg && (
            <div style={{ backgroundColor: 'rgba(224, 86, 56, 0.15)', border: '1px solid var(--accent-terracotta)', color: '#fca5a5', padding: '10px 14px', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid var(--accent-emerald)', color: '#6ee7b7', padding: '10px 14px', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle size={16} />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-color)' }}>
                <User size={22} />
              </div>
              <div>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Tu información pública</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '3px' }}>No mostramos tu dirección exacta.</div>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>Nombre visible</label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="¿Cómo quieres que te vean?"
                style={{ width: '100%', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '12px', color: 'var(--text-primary)', fontSize: '0.9rem', outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>Nombre de usuario</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="@tunombre"
                style={{ width: '100%', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '12px', color: 'var(--text-primary)', fontSize: '0.9rem', outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>Presentación</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Cuéntanos brevemente qué música tocas y qué te gustaría encontrar."
                rows={4}
                maxLength={500}
                style={{ width: '100%', resize: 'vertical', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '12px', color: 'var(--text-primary)', fontSize: '0.9rem', outline: 'none', fontFamily: 'inherit' }}
              />
            </div>

            {/* SECCIÓN VÍDEO DE PRESENTACIÓN */}
            <div style={{ paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <Video size={18} style={{ color: 'var(--accent-gold)' }} />
                <label style={{ fontSize: '0.95rem', fontWeight: 700 }}>Vídeo de presentación</label>
              </div>

              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                Sube un vídeo corto de hasta 2 minutos mostrando cómo tocas o cantas para que otros músicos conozcan tu estilo.
              </p>

              {videoUrl ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <video
                    src={videoUrl}
                    controls
                    style={{ width: '100%', maxHeight: '300px', borderRadius: 'var(--radius-md)', backgroundColor: '#000' }}
                  />
                  <button
                    type="button"
                    onClick={handleRemoveVideo}
                    style={{
                      alignSelf: 'flex-start',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      backgroundColor: 'rgba(224, 86, 56, 0.15)',
                      border: '1px solid var(--accent-terracotta)',
                      color: '#fca5a5',
                      borderRadius: 'var(--radius-md)',
                      padding: '6px 12px',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                    }}
                  >
                    <Trash2 size={14} /> Eliminar vídeo
                  </button>
                </div>
              ) : (
                <div style={{ border: '2px dashed var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.5rem', textAlign: 'center', backgroundColor: 'var(--bg-surface)' }}>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleVideoUpload}
                    id="video-upload-input"
                    disabled={uploadingVideo}
                    style={{ display: 'none' }}
                  />
                  <label
                    htmlFor="video-upload-input"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      backgroundColor: 'var(--bg-primary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      padding: '10px 16px',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      cursor: uploadingVideo ? 'not-allowed' : 'pointer',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <Upload size={16} />
                    {uploadingVideo ? 'Subiendo vídeo...' : 'Seleccionar vídeo'}
                  </label>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                    Formatos recomendados: MP4, WebM (Máx. 50MB)
                  </div>
                </div>
              )}
            </div>

            {/* SECCIÓN INSTRUMENTOS */}
            <div style={{ paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <Music size={18} />
                <label style={{ fontSize: '0.95rem', fontWeight: 700 }}>Instrumentos</label>
              </div>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '12px' }}>Selecciona todos los instrumentos que tocas.</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {instruments.map((instrument) => {
                  const selected = selectedInstrumentIds.includes(instrument.id);
                  return (
                    <button
                      key={instrument.id}
                      type="button"
                      onClick={() => toggleInstrument(instrument.id)}
                      style={{
                        border: selected ? '1px solid var(--accent-gold)' : '1px solid var(--border-color)',
                        backgroundColor: selected ? 'rgba(245, 158, 11, 0.15)' : 'var(--bg-surface)',
                        color: selected ? 'var(--accent-gold)' : 'var(--text-secondary)',
                        borderRadius: '999px',
                        padding: '8px 12px',
                        fontSize: '0.8rem',
                        fontWeight: selected ? 700 : 500,
                        cursor: 'pointer',
                      }}
                    >
                      {selected ? '✓ ' : ''}{instrument.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* SECCIÓN ESTILOS MUSICALES */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '10px' }}>Estilos musicales</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {musicStyles.map((style) => {
                  const selected = selectedStyleIds.includes(style.id);
                  return (
                    <button
                      key={style.id}
                      type="button"
                      onClick={() => toggleStyle(style.id)}
                      style={{
                        border: selected ? '1px solid var(--accent-gold)' : '1px solid var(--border-color)',
                        backgroundColor: selected ? 'rgba(245, 158, 11, 0.15)' : 'var(--bg-surface)',
                        color: selected ? 'var(--accent-gold)' : 'var(--text-secondary)',
                        borderRadius: '999px',
                        padding: '8px 12px',
                        fontSize: '0.8rem',
                        fontWeight: selected ? 700 : 500,
                        cursor: 'pointer',
                      }}
                    >
                      {selected ? '✓ ' : ''}{style.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* SECCIÓN QUE BUSCAS */}
            <div style={{ paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <Search size={18} />
                <label style={{ fontSize: '0.95rem', fontWeight: 700 }}>¿Qué buscas?</label>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {lookingForOptions.map((option) => {
                  const selected = selectedLookingForIds.includes(option.id);
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => toggleLookingFor(option.id)}
                      style={{
                        border: selected ? '1px solid var(--accent-gold)' : '1px solid var(--border-color)',
                        backgroundColor: selected ? 'rgba(245, 158, 11, 0.15)' : 'var(--bg-surface)',
                        color: selected ? 'var(--accent-gold)' : 'var(--text-secondary)',
                        borderRadius: '999px',
                        padding: '8px 12px',
                        fontSize: '0.8rem',
                        fontWeight: selected ? 700 : 500,
                        cursor: 'pointer',
                      }}
                    >
                      {selected ? '✓ ' : ''}{option.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* SECCIÓN UBICACIÓN */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>Zona aproximada de Barcelona</label>
              <div style={{ position: 'relative' }}>
                <MapPin size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <select
                  value={locationZone || ''}
                  onChange={(e) => {
                    const selectedName = e.target.value;
                    const zoneObj = BARCELONA_ZONES.find((z) => z.name === selectedName);
                    if (zoneObj) {
                      setLocationZone(zoneObj.name);
                      setLatitudeApprox(zoneObj.lat);
                      setLongitudeApprox(zoneObj.lng);
                    } else {
                      setLocationZone('');
                      setLatitudeApprox(null);
                      setLongitudeApprox(null);
                    }
                  }}
                  style={{ width: '100%', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '12px 12px 12px 40px', color: 'var(--text-primary)', fontSize: '0.9rem', outline: 'none', cursor: 'pointer' }}
                >
                  <option value="">Selecciona una zona...</option>
                  {BARCELONA_ZONES.map((zone) => (
                    <option key={zone.name} value={zone.name}>
                      {zone.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>Radio máximo de desplazamiento</label>
              <select
                value={travelRadius}
                onChange={(e) => setTravelRadius(e.target.value)}
                style={{ width: '100%', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '12px', color: 'var(--text-primary)', fontSize: '0.9rem', outline: 'none' }}
              >
                <option value="1">1 km</option>
                <option value="3">3 km</option>
                <option value="5">5 km</option>
                <option value="10">10 km</option>
                <option value="20">20 km</option>
                <option value="50">50 km</option>
                <option value="100">100 km</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={saving || uploadingVideo}
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '12px', marginTop: '4px' }}
            >
              <Save size={17} />
              {saving ? 'Guardando...' : 'Guardar perfil'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}