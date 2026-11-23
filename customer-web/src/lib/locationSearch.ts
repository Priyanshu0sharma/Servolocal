// Utility for live Indian place autocomplete & reverse geocoding

export interface PlaceSuggestion {
  title: string;
  subtitle: string;
  lat: number;
  lng: number;
}

// Live search across all Indian locations (landmarks, schools, forts, railway stations, towns, cities)
export async function searchIndianPlaces(query: string): Promise<PlaceSuggestion[]> {
  const clean = query.trim();
  if (!clean || clean.length < 1) return [];

  try {
    // 1. Query Photon API prioritized for India (lat 20.5937, lon 78.9629)
    const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(clean)}&lat=20.5937&lon=78.9629&limit=8`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error("Search network error");
    const data = await res.json();

    if (data && Array.isArray(data.features)) {
      const results: PlaceSuggestion[] = [];

      for (const f of data.features) {
        const props = f.properties || {};
        const coords = f.geometry?.coordinates || [];
        if (props.countrycode?.toUpperCase() !== "IN" || !Number.isFinite(coords[0]) || !Number.isFinite(coords[1])) continue;
        const lng = coords[0];
        const lat = coords[1];

        // Format clean Indian address lines matching Blinkit
        const name = props.name || props.street || "";
        if (!name) continue;

        const addressParts: string[] = [];
        if (props.street && props.street !== name) addressParts.push(props.street);
        if (props.district) addressParts.push(props.district);
        if (props.city && props.city !== props.district) addressParts.push(props.city);
        if (props.state) addressParts.push(props.state);
        if (props.country) addressParts.push(props.country);

        const subtitle = addressParts.filter(Boolean).join(", ") || "India";

        // Avoid exact duplicates
        if (!results.some((r) => r.title === name && r.subtitle === subtitle)) {
          results.push({
            title: name,
            subtitle,
            lat,
            lng,
          });
        }
      }

      if (results.length > 0) {
        return results.slice(0, 6);
      }
    }
  } catch {
    return [];
  }

  return [];
}

// Reverse geocode lat/lng to readable Indian address
export async function reverseGeocodeIndianLocation(
  lat: number,
  lng: number
): Promise<{ title: string; subtitle: string; fullAddress: string }> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`;
    const res = await fetch(url, { signal: AbortSignal.timeout(7000) });
    if (res.ok) {
      const data = await res.json();
      if (data && data.display_name) {
        const parts = data.display_name.split(",");
        const title = parts[0]?.trim() || "Selected Location";
        const subtitle = parts.slice(1, 4).join(",").trim() || "India";
        return {
          title,
          subtitle,
          fullAddress: data.display_name,
        };
      }
    }
  } catch {}

  return {
    title: "Pinned Location",
    subtitle: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
    fullAddress: `Coordinates: ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
  };
}



export function googleMapsPinUrl(lat: number, lng: number) {
  const params = new URLSearchParams({ api: "1", query: `${lat},${lng}` });
  return `https://www.google.com/maps/search/?${params}`;
}
