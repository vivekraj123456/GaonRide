export type LatLng = {
  lat: number;
  lng: number;
};

const EARTH_RADIUS_KM = 6371;

const toRad = (deg: number) => (deg * Math.PI) / 180;

export const haversineKm = (a: LatLng, b: LatLng): number => {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const aa =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(aa), Math.sqrt(1 - aa));
  return EARTH_RADIUS_KM * c;
};

export const toNum = (v: unknown): number | null => {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string') {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return null;
};

export const toLatLng = (lat: unknown, lng: unknown): LatLng | null => {
  const la = toNum(lat);
  const ln = toNum(lng);
  if (la === null || ln === null) return null;
  return { lat: la, lng: ln };
};

export const googleDirectionsUrl = (origin: LatLng, destination: LatLng): string =>
  `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}&travelmode=driving`;

export const googlePointUrl = (point: LatLng): string =>
  `https://www.google.com/maps/search/?api=1&query=${point.lat},${point.lng}`;

export const openStreetMapEmbedUrl = (center: LatLng): string => {
  const delta = 0.02;
  const left = center.lng - delta;
  const right = center.lng + delta;
  const top = center.lat + delta;
  const bottom = center.lat - delta;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${left}%2C${bottom}%2C${right}%2C${top}&layer=mapnik&marker=${center.lat}%2C${center.lng}`;
};

export const estimateEtaMinutes = (distanceKm: number, avgSpeedKmph = 25): number => {
  if (!Number.isFinite(distanceKm) || distanceKm <= 0) return 0;
  const mins = (distanceKm / avgSpeedKmph) * 60;
  return Math.max(1, Math.round(mins));
};
