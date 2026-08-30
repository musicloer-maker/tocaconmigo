import { Zone, ProximityBucket } from '@/types';

// Lista inicial simplificada de 20 zonas reconocibles de Barcelona
export const BARCELONA_ZONES: Zone[] = [
  { id: 'z-gracia', name: 'Vila de Gràcia', district: 'Gràcia', centroid_lat: 41.4036, centroid_lng: 2.1568, is_active: true },
  { id: 'z-poblenou', name: 'Poblenou', district: 'Sant Martí', centroid_lat: 41.4014, centroid_lng: 2.2036, is_active: true },
  { id: 'z-eix-esq', name: "L'Eixample Esquerra", district: "Eixample", centroid_lat: 41.3855, centroid_lng: 2.1534, is_active: true },
  { id: 'z-eix-dret', name: "L'Eixample Dret", district: "Eixample", centroid_lat: 41.3942, centroid_lng: 2.1691, is_active: true },
  { id: 'z-sant-antoni', name: 'Sant Antoni', district: "Eixample", centroid_lat: 41.3787, centroid_lng: 2.1589, is_active: true },
  { id: 'z-sants', name: 'Sants', district: 'Sants-Montjuïc', centroid_lat: 41.3758, centroid_lng: 2.1356, is_active: true },
  { id: 'z-born', name: 'El Born / La Ribera', district: 'Ciutat Vella', centroid_lat: 41.3851, centroid_lng: 2.1818, is_active: true },
  { id: 'z-gotic', name: 'Barri Gòtic', district: 'Ciutat Vella', centroid_lat: 41.3825, centroid_lng: 2.1771, is_active: true },
  { id: 'z-raval', name: 'El Raval', district: 'Ciutat Vella', centroid_lat: 41.3792, centroid_lng: 2.1685, is_active: true },
  { id: 'z-poble-sec', name: 'Poble-sec', district: 'Sants-Montjuïc', centroid_lat: 41.3725, centroid_lng: 2.1642, is_active: true },
  { id: 'z-sagrada-fam', name: 'Sagrada Família', district: "Eixample", centroid_lat: 41.4036, centroid_lng: 2.1744, is_active: true },
  { id: 'z-sarria', name: 'Sarrià', district: 'Sarrià-Sant Gervasi', centroid_lat: 41.3995, centroid_lng: 2.1215, is_active: true },
  { id: 'z-les-corts', name: 'Les Corts', district: 'Les Corts', centroid_lat: 41.3862, centroid_lng: 2.1298, is_active: true },
  { id: 'z-sant-gervasi', name: 'Sant Gervasi', district: 'Sarrià-Sant Gervasi', centroid_lat: 41.4026, centroid_lng: 2.1384, is_active: true },
  { id: 'z-clot', name: "El Clot / Camp de l'Arpa", district: 'Sant Martí', centroid_lat: 41.4111, centroid_lng: 2.1878, is_active: true },
  { id: 'z-horta', name: 'Horta', district: 'Horta-Guinardó', centroid_lat: 41.4308, centroid_lng: 2.1589, is_active: true },
  { id: 'z-guinardo', name: 'El Guinardó', district: 'Horta-Guinardó', centroid_lat: 41.4172, centroid_lng: 2.1706, is_active: true },
  { id: 'z-sant-andreu', name: 'Sant Andreu', district: 'Sant Andreu', centroid_lat: 41.4358, centroid_lng: 2.1908, is_active: true },
  { id: 'z-badalona-besos', name: 'Besòs / Frontera Badalona', district: 'Sant Martí', centroid_lat: 41.4423, centroid_lng: 2.2341, is_active: true },
  { id: 'z-hospitalet-sants', name: 'Collblanc / Frontera Hospitalet', district: 'Les Corts / Sants', centroid_lat: 41.3662, centroid_lng: 2.1154, is_active: true },
];

export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function getProximityBucket(distanceKm: number): { bucket: ProximityBucket; label: string } {
  if (distanceKm <= 0.8) {
    return { bucket: 'mismo_barrio', label: 'En tu misma zona' };
  } else if (distanceKm <= 2.0) {
    return { bucket: 'muy_cerca', label: 'A menos de 2 km' };
  } else if (distanceKm <= 5.0) {
    return { bucket: 'media_distancia', label: 'A 2–5 km' };
  } else {
    return { bucket: 'otra_zona', label: 'A más de 5 km' };
  }
}

export function getZoneById(zoneId: string): Zone | undefined {
  return BARCELONA_ZONES.find((z) => z.id === zoneId);
}
