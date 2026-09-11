'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';

interface ProfileData {
  id: string;
  username: string | null;
  display_name: string | null;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  location_zone: string | null;
  travel_radius_km: number | null;
  video_url: string | null;
}

export default function PublicProfilePage() {
  const params = useParams();
  const router = useRouter();
  const profileId = params?.id as string;

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [instruments, setInstruments] = useState<string[]>([]);
  const [styles, setStyles] = useState<string[]>([]);
  const [lookingFor, setLookingFor] = useState<string[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profileId) return;

    const supabase = createClient();

    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        // 1. Obtener el usuario autenticado actual
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setCurrentUserId(user.id);
        }

        // 2. Traer la información base del perfil (sin joins frágiles)
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, username, display_name, full_name, avatar_url, bio, location_zone, travel_radius_km, video_url')
          .eq('id', profileId)
          .maybeSingle();

        if (profileError) {
          throw profileError;
        }

        if (!profileData) {
          setError('El perfil buscado no existe.');
          return;
        }

        setProfile(profileData);

        // 3. Cargar Instrumentos (protegido contra fallos)
        try {
          const { data: instData } = await supabase
            .from('profile_instruments')
            .select('instruments(name)')
            .eq('profile_id', profileId);

          if (instData) {
            const list = instData.map((i: any) => i.instruments?.name).filter(Boolean);
            setInstruments(list);
          }
        } catch (e) {
          console.warn('Error al cargar instrumentos:', e);
        }

        // 4. Cargar Estilos (evalúa si se llama music_styles o styles)
        try {
          const { data: styleData } = await supabase
            .from('profile_styles')
            .select('music_styles(name), styles(name)')
            .eq('profile_id', profileId);

          if (styleData) {
            const list = styleData
              .map((s: any) => s.music_styles?.name || s.styles?.name)
              .filter(Boolean);
            setStyles(list);
          }
        } catch (e) {
          console.warn('Error al cargar estilos:', e);
        }

        // 5. Cargar Búsquedas / Preferencias (protegido contra fallos)
        try {
          const { data: lookData } = await supabase
            .from('profile_looking_for')
            .select('looking_for(name)')
            .eq('profile_id', profileId);

          if (lookData) {
            const list = lookData.map((l: any) => l.looking_for?.name).filter(Boolean);
            setLookingFor(list);
          }
        } catch (e) {
          console.warn('Error al cargar búsquedas:', e);
        }

      } catch (err: any) {
        console.error('Error cargando el perfil:', err);
        setError('No se pudo cargar la información del perfil.');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [profileId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-zinc-400">Cargando perfil...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
        <p className="text-red-400 mb-4">{error || 'Perfil no encontrado.'}</p>
        <Link
          href="/"
          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition"
        >
          Volver al inicio
        </Link>
      </div>
    );
  }

  const displayName =
    profile.display_name || profile.full_name || profile.username || 'Músico sin nombre';

  const isOwnProfile = currentUserId === profile.id;

  return (
    <div className="min-h-screen bg-black text-white pb-12">
      {/* Banner / Cabecera */}
      <div className="h-48 bg-gradient-to-r from-amber-600 to-orange-600 relative" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-10">
        {/* Foto de Perfil e Info Básica */}
        <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between gap-4 mb-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 text-center sm:text-left">
            <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-black bg-zinc-800 flex items-center justify-center">
              {profile.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt={displayName}
                  fill
                  className="object-cover"
                />
              ) : (
                <span className="text-4xl font-bold text-zinc-400">
                  {displayName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <h1 className="text-3xl font-bold">{displayName}</h1>
              {profile.username && (
                <p className="text-zinc-400">@{profile.username}</p>
              )}
              {profile.location_zone && (
                <p className="text-sm text-amber-500 mt-1">
                  📍 {profile.location_zone}
                  {profile.travel_radius_km
                    ? ` (Radio de desplazamiento: ${profile.travel_radius_km} km)`
                    : ''}
                </p>
              )}
            </div>
          </div>

          {/* Botón de edición si es el dueño del perfil */}
          {isOwnProfile && (
            <Link
              href="/profile"
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black font-semibold rounded-lg transition"
            >
              ✏️ Editar mi Perfil
            </Link>
          )}
        </div>

        {/* Rejilla de Información */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Biografía / Sobre mí */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-3 text-amber-500">Sobre mí</h2>
            <p className="text-zinc-300 whitespace-pre-line">
              {profile.bio || 'Aún no ha añadido una descripción.'}
            </p>
          </div>

          {/* Vídeo de Presentación */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-3 text-amber-500">
              🎬 Vídeo de Presentación
            </h2>
            {profile.video_url ? (
              <video
                src={profile.video_url}
                controls
                className="w-full rounded-lg bg-black max-h-64 object-cover"
              />
            ) : (
              <p className="text-zinc-500 italic">
                Aún no ha subido ningún vídeo de presentación.
              </p>
            )}
          </div>

          {/* Instrumentos */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-3 text-amber-500">🎸 Instrumentos</h2>
            {instruments.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {instruments.map((inst, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-full text-sm"
                  >
                    {inst}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-zinc-500 italic">No ha especificado instrumentos.</p>
            )}
          </div>

          {/* Estilos musicales */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-3 text-amber-500">🎵 Estilos</h2>
            {styles.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {styles.map((style, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-full text-sm"
                  >
                    {style}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-zinc-500 italic">No ha especificado estilos musicales.</p>
            )}
          </div>

          {/* Buscando / Preferencias */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 md:col-span-2">
            <h2 className="text-xl font-semibold mb-3 text-amber-500">🔍 Buscando</h2>
            {lookingFor.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {lookingFor.map((item, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-full text-sm"
                  >
                    {item}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-zinc-500 italic">No ha añadido preferencias de búsqueda.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}