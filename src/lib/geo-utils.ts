/**
 * Calculates the distance between two coordinates using the Haversine formula.
 * @returns Distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance);
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Sorts locations by distance from a reference point
 */
export function sortByDistance<T extends { lat: number; lng: number }>(
  locations: T[],
  referenceLat: number,
  referenceLng: number
): (T & { distance: number })[] {
  return locations
    .map((loc) => ({
      ...loc,
      distance: calculateDistance(referenceLat, referenceLng, loc.lat, loc.lng),
    }))
    .sort((a, b) => a.distance - b.distance);
}

/**
 * Filters locations within a certain radius
 */
export function getLocationsWithinRadius<T extends { lat: number; lng: number }>(
  locations: T[],
  referenceLat: number,
  referenceLng: number,
  radiusKm: number
): (T & { distance: number })[] {
  return sortByDistance(locations, referenceLat, referenceLng).filter(
    (loc) => loc.distance <= radiusKm
  );
}
