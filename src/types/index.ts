export interface Zone {
  id: string;
  name: string;
  district: string;
  centroid_lat: number;
  centroid_lng: number;
  is_active: boolean;
}

export interface Instrument {
  id: string;
  name: string;
  category: 'cuerda' | 'viento' | 'percusion' | 'teclado' | 'voz' | 'electronica' | 'otro';
}

export interface MusicalStyle {
  id: string;
  name: string;
}

export interface MusicianProfile {
  id: string;
  username: string;
  display_name: string;
  avatar_url?: string;
  bio?: string;
  zone_id: string;
  zone?: Zone;
  max_travel_km: number;
  looking_for: string;
  is_currently_available: boolean;
  availability_updated_at?: string;
  instruments: Instrument[];
  styles: MusicalStyle[];
  video_url?: string;
  video_duration_seconds?: number;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface JamSession {
  id: string;
  creator_id: string;
  creator?: Partial<MusicianProfile>;
  title: string;
  description: string;
  zone_id: string;
  zone?: Zone;
  event_date: string;
  max_capacity: number;
  current_participants_count: number;
  status: 'abierta' | 'completa' | 'cancelada' | 'finalizada';
  created_at: string;
}

export type ProximityBucket = 
  | 'mismo_barrio' 
  | 'muy_cerca' 
  | 'media_distancia' 
  | 'otra_zona';
