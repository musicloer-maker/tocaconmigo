-- ============================================================
-- ESQUEMA DE BASE DE DATOS Y POLÍTICAS RLS PARA TOCACONMIGO MVP
-- Base de datos PostgreSQL para Supabase (No ejecutada aún)
-- ============================================================

CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS public.zones (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  district TEXT NOT NULL,
  centroid_lat DOUBLE PRECISION NOT NULL,
  centroid_lng DOUBLE PRECISION NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.instruments (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('cuerda', 'viento', 'percusion', 'teclado', 'voz', 'electronica', 'otro'))
);

CREATE TABLE IF NOT EXISTS public.styles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  zone_id TEXT REFERENCES public.zones(id),
  max_travel_km INTEGER DEFAULT 3,
  looking_for TEXT,
  is_currently_available BOOLEAN DEFAULT FALSE,
  availability_updated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.user_instruments (
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  instrument_id TEXT REFERENCES public.instruments(id) ON DELETE CASCADE,
  PRIMARY KEY (profile_id, instrument_id)
);

CREATE TABLE IF NOT EXISTS public.user_styles (
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  style_id TEXT REFERENCES public.styles(id) ON DELETE CASCADE,
  PRIMARY KEY (profile_id, style_id)
);

CREATE TABLE IF NOT EXISTS public.videos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  storage_path TEXT NOT NULL,
  duration_seconds INTEGER NOT NULL CHECK (duration_seconds <= 120),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  participant_1 UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  participant_2 UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT unique_participants UNIQUE (participant_1, participant_2)
);

CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.jam_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  zone_id TEXT REFERENCES public.zones(id) NOT NULL,
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  max_capacity INTEGER DEFAULT 4,
  status TEXT DEFAULT 'abierta' CHECK (status IN ('abierta', 'completa', 'cancelada', 'finalizada')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.jam_participants (
  jam_id UUID REFERENCES public.jam_sessions(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'solicitado' CHECK (status IN ('solicitado', 'aceptado', 'rechazado')),
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (jam_id, profile_id)
);

CREATE TABLE IF NOT EXISTS public.user_blocks (
  blocker_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  blocked_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (blocker_id, blocked_id)
);

CREATE TABLE IF NOT EXISTS public.reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  reported_profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT DEFAULT 'pendiente',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jam_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lectura pública de perfiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Edición de propio perfil" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Lectura de mensajes propios" ON public.messages FOR SELECT USING (
  auth.uid() IN (
    SELECT participant_1 FROM public.conversations WHERE id = conversation_id
    UNION
    SELECT participant_2 FROM public.conversations WHERE id = conversation_id
  )
);

CREATE POLICY "Envío de mensajes propios" ON public.messages FOR INSERT WITH CHECK (
  auth.uid() = sender_id AND
  auth.uid() IN (
    SELECT participant_1 FROM public.conversations WHERE id = conversation_id
    UNION
    SELECT participant_2 FROM public.conversations WHERE id = conversation_id
  )
);

ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

INSERT INTO public.zones (id, name, district, centroid_lat, centroid_lng) VALUES
  ('z-gracia', 'Vila de Gràcia', 'Gràcia', 41.4036, 2.1568),
  ('z-poblenou', 'Poblenou', 'Sant Martí', 41.4014, 2.2036),
  ('z-eix-esq', 'L''Eixample Esquerra', 'Eixample', 41.3855, 2.1534),
  ('z-eix-dret', 'L''Eixample Dret', 'Eixample', 41.3942, 2.1691),
  ('z-sant-antoni', 'Sant Antoni', 'Eixample', 41.3787, 2.1589),
  ('z-sants', 'Sants', 'Sants-Montjuïc', 41.3758, 2.1356),
  ('z-born', 'El Born / La Ribera', 'Ciutat Vella', 41.3851, 2.1818),
  ('z-gotic', 'Barri Gòtic', 'Ciutat Vella', 41.3825, 2.1771),
  ('z-raval', 'El Raval', 'Ciutat Vella', 41.3792, 2.1685),
  ('z-poble-sec', 'Poble-sec', 'Sants-Montjuïc', 41.3725, 2.1642),
  ('z-sagrada-fam', 'Sagrada Família', 'Eixample', 41.4036, 2.1744),
  ('z-sarria', 'Sarrià', 'Sarrià-Sant Gervasi', 41.3995, 2.1215),
  ('z-les-corts', 'Les Corts', 'Les Corts', 41.3862, 2.1298),
  ('z-sant-gervasi', 'Sant Gervasi', 'Sarrià-Sant Gervasi', 41.4026, 2.1384),
  ('z-clot', 'El Clot / Camp de l''Arpa', 'Sant Martí', 41.4111, 2.1878),
  ('z-horta', 'Horta', 'Horta-Guinardó', 41.4308, 2.1589),
  ('z-guinardo', 'El Guinardó', 'Horta-Guinardó', 41.4172, 2.1706),
  ('z-sant-andreu', 'Sant Andreu', 'Sant Andreu', 41.4358, 2.1908),
  ('z-badalona-besos', 'Besòs / Frontera Badalona', 'Sant Martí', 41.4423, 2.2341),
  ('z-hospitalet-sants', 'Collblanc / Frontera Hospitalet', 'Les Corts / Sants', 41.3662, 2.1154)
ON CONFLICT (id) DO NOTHING;
