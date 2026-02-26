/**
 * Geocode an address using OpenStreetMap Nominatim (free, no API key needed)
 * Rate limit: 1 request/second
 */
export async function geocodeAddress(parts: {
  street?: string;
  number?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}): Promise<{ lat: number; lng: number } | null> {
  const { street, number, neighborhood, city, state, zipCode } = parts;

  // Build query from most specific to least
  const queryParts = [
    [number, street].filter(Boolean).join(" "),
    neighborhood,
    city,
    state,
    "Brasil",
  ].filter(Boolean);

  const query = queryParts.join(", ");
  if (!query || query === "Brasil") return null;

  try {
    const params = new URLSearchParams({
      format: "json",
      limit: "1",
      countrycodes: "br",
      q: query,
    });

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?${params}`,
      {
        headers: { "Accept-Language": "pt-BR" },
      }
    );

    if (!response.ok) return null;

    const results = await response.json();
    const first = results?.[0];
    if (!first) return null;

    return { lat: Number(first.lat), lng: Number(first.lon) };
  } catch {
    return null;
  }
}

/**
 * Reverse geocode coordinates to get address components
 */
export async function reverseGeocode(lat: number, lng: number): Promise<{
  street?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zipCode?: string;
} | null> {
  try {
    const params = new URLSearchParams({
      format: "json",
      lat: String(lat),
      lon: String(lng),
      "accept-language": "pt-BR",
    });

    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?${params}`
    );

    if (!response.ok) return null;

    const data = await response.json();
    const addr = data?.address;
    if (!addr) return null;

    return {
      street: addr.road || addr.pedestrian || undefined,
      neighborhood: addr.suburb || addr.neighbourhood || undefined,
      city: addr.city || addr.town || addr.village || undefined,
      state: getStateAbbr(addr.state) || undefined,
      zipCode: addr.postcode || undefined,
    };
  } catch {
    return null;
  }
}

const STATE_MAP: Record<string, string> = {
  "Acre": "AC", "Alagoas": "AL", "Amapá": "AP", "Amazonas": "AM",
  "Bahia": "BA", "Ceará": "CE", "Distrito Federal": "DF", "Espírito Santo": "ES",
  "Goiás": "GO", "Maranhão": "MA", "Mato Grosso": "MT", "Mato Grosso do Sul": "MS",
  "Minas Gerais": "MG", "Pará": "PA", "Paraíba": "PB", "Paraná": "PR",
  "Pernambuco": "PE", "Piauí": "PI", "Rio de Janeiro": "RJ", "Rio Grande do Norte": "RN",
  "Rio Grande do Sul": "RS", "Rondônia": "RO", "Roraima": "RR", "Santa Catarina": "SC",
  "São Paulo": "SP", "Sergipe": "SE", "Tocantins": "TO",
};

function getStateAbbr(stateName: string | undefined): string | undefined {
  if (!stateName) return undefined;
  if (stateName.length === 2) return stateName.toUpperCase();
  return STATE_MAP[stateName];
}
