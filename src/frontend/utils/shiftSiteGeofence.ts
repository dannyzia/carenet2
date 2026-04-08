/** Default radius until placements expose site coordinates from the API. */
export const CARE_SITE_GEOFENCE_MAX_M = 200;

export function metersBetween(
  gps: { lat: number; lng: number },
  site: { lat: number; lng: number },
): number {
  return Math.round(
    Math.sqrt(
      Math.pow((gps.lat - site.lat) * 111320, 2) +
        Math.pow((gps.lng - site.lng) * 111320 * Math.cos((site.lat * Math.PI) / 180), 2),
    ),
  );
}
