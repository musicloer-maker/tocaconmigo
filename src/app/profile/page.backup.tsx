'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import {
User,
MapPin,
Save,
LogOut,
AlertCircle,
CheckCircle,
Music,
} from 'lucide-react';

type Profile = {
id: string;
username: string | null;
display_name: string | null;
bio: string | null;
location_zone: string | null;
travel_radius_km: number;
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

export default function ProfilePage() {
const [profile, setProfile] = useState<Profile | null>(null);

const [username, setUsername] = useState('');
const [displayName, setDisplayName] = useState('');
const [bio, setBio] = useState('');
const [locationZone, setLocationZone] = useState('');
const [travelRadius, setTravelRadius] = useState('5');

const [instruments, setInstruments] = useState<Instrument[]>([]);
const [musicStyles, setMusicStyles] = useState<MusicStyle[]>([]);
const [selectedInstrumentIds, setSelectedInstrumentIds] = useState<number[]>([]);
const [selectedStyleIds, setSelectedStyleIds] = useState<number[]>([]);

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
  { data: profileInstrumentsData, error: profileInstrumentsError },
  { data: profileStylesData, error: profileStylesError },
] = await Promise.all([
  supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single(),

  supabase
    .from('instruments')
    .select('id, name, slug')
    .order('id'),

  supabase
    .from('music_styles')
    .select('id, name, slug')
    .order('id'),

  supabase
    .from('profile_instruments')
    .select('instrument_id')
    .eq('profile_id', user.id),

  supabase
    .from('profile_styles')
    .select('style_id')
    .eq('profile_id', user.id),
]);

if (profileError) {
  setErrorMsg('No hemos podido cargar tu perfil.');
  setLoading(false);
  return;
}

if (instrumentsError || stylesError) {
  setErrorMsg('No hemos podido cargar los instrumentos y estilos.');
  setLoading(false);
  return;
}

if (profileInstrumentsError || profileStylesError) {
  setErrorMsg('No hemos podido cargar tus selecciones musicales.');
  setLoading(false);
  return;
}

setProfile(profileData);
setUsername(profileData.username ?? '');
setDisplayName(profileData.display_name ?? '');
setBio(profileData.bio ?? '');
setLocationZone(profileData.location_zone ?? '');
setTravelRadius(String(profileData.travel_radius_km ?? 5));

setInstruments(instrumentsData ?? []);
setMusicStyles(stylesData ?? []);

setSelectedInstrumentIds(
  (profileInstrumentsData ?? []).map((item) => item.instrument_id)
);

setSelectedStyleIds(
  (profileStylesData ?? []).map((item) => item.style_id)
);

setLoading(false);


};

const toggleInstrument = (id: number) => {
setSelectedInstrumentIds((current) =>
current.includes(id)
? current.filter((instrumentId) => instrumentId !== id)
: [...current, id]
);
};

const toggleStyle = (id: number) => {
setSelectedStyleIds((current) =>
current.includes(id)
? current.filter((styleId) => styleId !== id)
: [...current, id]
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
  setErrorMsg('El radio de desplazamiento debe estar entre 1 y 100 km.');
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
    location_zone: locationZone.trim() || null,
    travel_radius_km: radius,
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

const { error: deleteInstrumentsError } = await supabase
  .from('profile_instruments')
  .delete()
  .eq('profile_id', user.id);

if (deleteInstrumentsError) {
  setErrorMsg('No hemos podido actualizar tus instrumentos.');
  setSaving(false);
  return;
}

const { error: deleteStylesError } = await supabase
  .from('profile_styles')
  .delete()
  .eq('profile_id', user.id);

if (deleteStylesError) {
  setErrorMsg('No hemos podido actualizar tus estilos musicales.');
  setSaving(false);
  return;
}

if (selectedInstrumentIds.length > 0) {
  const instrumentRows = selectedInstrumentIds.map((instrumentId) => ({
    profile_id: user.id,
    instrument_id: instrumentId,
  }));

  const { error: insertInstrumentsError } = await supabase
    .from('profile_instruments')
    .insert(instrumentRows);

  if (insertInstrumentsError) {
    setErrorMsg('No hemos podido guardar tus instrumentos.');
    setSaving(false);
    return;
  }
}

if (selectedStyleIds.length > 0) {
  const styleRows = selectedStyleIds.map((styleId) => ({
    profile_id: user.id,
    style_id: styleId,
  }));

  const { error: insertStylesError } = await supabase
    .from('profile_styles')
    .insert(styleRows);

  if (insertStylesError) {
    setErrorMsg('No hemos podido guardar tus estilos musicales.');
    setSaving(false);
    return;
  }
}

setProfile(profileData);
setSuccessMsg('Perfil guardado correctamente.');
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
<div
style={{
minHeight: '100vh',
display: 'flex',
alignItems: 'center',
justifyContent: 'center',
backgroundColor: 'var(--bg-primary)',
color: 'var(--text-secondary)',
}}
>
Cargando tu perfil... </div>
);
}

return (
<div
style={{
minHeight: '100vh',
backgroundColor: 'var(--bg-primary)',
padding: '2rem 1.5rem',
}}
>
<div
style={{
maxWidth: '700px',
margin: '0 auto',
}}
>
<div
style={{
display: 'flex',
alignItems: 'center',
justifyContent: 'space-between',
marginBottom: '2rem',
gap: '1rem',
}}
> <div>
<h1
style={{
fontSize: '1.8rem',
fontWeight: 800,
marginBottom: '6px',
}}
>
Mi perfil musical </h1>

        <p
          style={{
            color: 'var(--text-secondary)',
            fontSize: '0.9rem',
          }}
        >
          Cuéntales a otros músicos quién eres y qué buscas.
        </p>
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

    <div
      className="glass-panel"
      style={{
        padding: '2rem',
        border: '1px solid var(--border-glow)',
      }}
    >
      {errorMsg && (
        <div
          style={{
            backgroundColor: 'rgba(224, 86, 56, 0.15)',
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
          <AlertCircle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div
          style={{
            backgroundColor: 'rgba(16, 185, 129, 0.15)',
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
          <CheckCircle size={16} />
          <span>{successMsg}</span>
        </div>
      )}

      <form
        onSubmit={handleSave}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            paddingBottom: '1rem',
            borderBottom: '1px solid var(--border-color)',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: 'var(--bg-surface)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid var(--border-color)',
            }}
          >
            <User size={22} />
          </div>

          <div>
            <div
              style={{
                fontWeight: 700,
                color: 'var(--text-primary)',
              }}
            >
              Tu información pública
            </div>

            <div
              style={{
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                marginTop: '3px',
              }}
            >
              No mostramos tu dirección exacta.
            </div>
          </div>
        </div>

        <div>
          <label
            style={{
              display: 'block',
              fontSize: '0.85rem',
              fontWeight: 600,
              marginBottom: '6px',
            }}
          >
            Nombre visible
          </label>

          <input
            type="text"
            required
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="¿Cómo quieres que te vean?"
            style={{
              width: '100%',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '12px',
              color: 'var(--text-primary)',
              fontSize: '0.9rem',
              outline: 'none',
            }}
          />
        </div>

        <div>
          <label
            style={{
              display: 'block',
              fontSize: '0.85rem',
              fontWeight: 600,
              marginBottom: '6px',
            }}
          >
            Nombre de usuario
          </label>

          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="@tunombre"
            style={{
              width: '100%',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '12px',
              color: 'var(--text-primary)',
              fontSize: '0.9rem',
              outline: 'none',
            }}
          />
        </div>

        <div>
          <label
            style={{
              display: 'block',
              fontSize: '0.85rem',
              fontWeight: 600,
              marginBottom: '6px',
            }}
          >
            Presentación
          </label>

          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Cuéntanos brevemente qué música tocas y qué te gustaría encontrar."
            rows={4}
            maxLength={500}
            style={{
              width: '100%',
              resize: 'vertical',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '12px',
              color: 'var(--text-primary)',
              fontSize: '0.9rem',
              outline: 'none',
              fontFamily: 'inherit',
            }}
          />
        </div>

        <div
          style={{
            paddingTop: '0.5rem',
            borderTop: '1px solid var(--border-color)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '6px',
            }}
          >
            <Music size={18} />
            <label
              style={{
                fontSize: '0.95rem',
                fontWeight: 700,
              }}
            >
              Instrumentos
            </label>
          </div>

          <p
            style={{
              fontSize: '0.72rem',
              color: 'var(--text-muted)',
              marginBottom: '12px',
            }}
          >
            Selecciona todos los instrumentos que tocas.
          </p>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
            }}
          >
            {instruments.map((instrument) => {
              const selected = selectedInstrumentIds.includes(instrument.id);

              return (
                <button
                  key={instrument.id}
                  type="button"
                  onClick={() => toggleInstrument(instrument.id)}
                  aria-pressed={selected}
                  style={{
                    border: selected
                      ? '1px solid var(--accent-gold)'
                      : '1px solid var(--border-color)',
                    backgroundColor: selected
                      ? 'rgba(245, 158, 11, 0.15)'
                      : 'var(--bg-surface)',
                    color: selected
                      ? 'var(--accent-gold)'
                      : 'var(--text-secondary)',
                    borderRadius: '999px',
                    padding: '8px 12px',
                    fontSize: '0.8rem',
                    fontWeight: selected ? 700 : 500,
                    cursor: 'pointer',
                  }}
                >
                  {selected ? '✓ ' : ''}
                  {instrument.name}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label
            style={{
              display: 'block',
              fontSize: '0.85rem',
              fontWeight: 600,
              marginBottom: '10px',
            }}
          >
            Estilos musicales
          </label>

          <p
            style={{
              fontSize: '0.72rem',
              color: 'var(--text-muted)',
              marginBottom: '12px',
            }}
          >
            Selecciona los estilos que más te interesan.
          </p>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
            }}
          >
            {musicStyles.map((style) => {
              const selected = selectedStyleIds.includes(style.id);

              return (
                <button
                  key={style.id}
                  type="button"
                  onClick={() => toggleStyle(style.id)}
                  aria-pressed={selected}
                  style={{
                    border: selected
                      ? '1px solid var(--accent-gold)'
                      : '1px solid var(--border-color)',
                    backgroundColor: selected
                      ? 'rgba(245, 158, 11, 0.15)'
                      : 'var(--bg-surface)',
                    color: selected
                      ? 'var(--accent-gold)'
                      : 'var(--text-secondary)',
                    borderRadius: '999px',
                    padding: '8px 12px',
                    fontSize: '0.8rem',
                    fontWeight: selected ? 700 : 500,
                    cursor: 'pointer',
                  }}
                >
                  {selected ? '✓ ' : ''}
                  {style.name}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label
            style={{
              display: 'block',
              fontSize: '0.85rem',
              fontWeight: 600,
              marginBottom: '6px',
            }}
          >
            Zona aproximada de Barcelona
          </label>

          <div style={{ position: 'relative' }}>
            <MapPin
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
              type="text"
              value={locationZone}
              onChange={(e) => setLocationZone(e.target.value)}
              placeholder="Ej. Eixample"
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

          <p
            style={{
              fontSize: '0.72rem',
              color: 'var(--text-muted)',
              marginTop: '6px',
            }}
          >
            Utiliza una zona o barrio, no una dirección exacta.
          </p>
        </div>

        <div>
          <label
            style={{
              display: 'block',
              fontSize: '0.85rem',
              fontWeight: 600,
              marginBottom: '6px',
            }}
          >
            Radio máximo de desplazamiento
          </label>

          <select
            value={travelRadius}
            onChange={(e) => setTravelRadius(e.target.value)}
            style={{
              width: '100%',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '12px',
              color: 'var(--text-primary)',
              fontSize: '0.9rem',
              outline: 'none',
            }}
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
          disabled={saving}
          className="btn-primary"
          style={{
            width: '100%',
            justifyContent: 'center',
            padding: '12px',
            marginTop: '4px',
          }}
        >
          <Save size={17} />
          {saving ? 'Guardando...' : 'Guardar perfil'}
        </button>
      </form>
    </div>

    {profile && (
      <p
        style={{
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontSize: '0.7rem',
          marginTop: '1rem',
        }}
      >
        Tu perfil está vinculado de forma segura a tu cuenta autenticada.
      </p>
    )}
  </div>
</div>

);
}

