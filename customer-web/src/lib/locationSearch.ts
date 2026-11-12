// Utility for live Indian place autocomplete & reverse geocoding

export interface PlaceSuggestion {
  title: string;
  subtitle: string;
  lat: number;
  lng: number;
}

// Check if location is within local 10-15 minute instant delivery hub (Kukas, Amer, Jaipur & surroundings)
export function isLocalInstantDeliveryAvailable(lat: number, lng: number, placeName: string): boolean {
  const query = (placeName || "").toLowerCase();

  // Keyword check for local delivery hubs
  const localKeywords = [
    "kukas",
    "amer",
    "amber",
    "jaipur",
    "sodala",
    "malviya",
    "mansarovar",
    "vaishali",
    "sindhi camp",
    "mi road",
    "c-scheme",
    "rajasthan university",
    "sitapura",
    "jagatpura",
    "durgapura",
    "sanganer",
    "tonk road",
    "bapu nagar",
  ];

  if (localKeywords.some((kw) => query.includes(kw))) {
    return true;
  }

  // Bounding box check around Jaipur & Kukas hub (Lat: ~26.75 to ~27.20, Lng: ~75.60 to ~76.05)
  if (lat >= 26.7 && lat <= 27.25 && lng >= 75.55 && lng <= 76.1) {
    return true;
  }

  return false;
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
            lat: lat || 26.9124,
            lng: lng || 75.7873,
          });
        }
      }

      if (results.length > 0) {
        return results.slice(0, 6);
      }
    }
  } catch {
    // Fallback if photon is blocked or offline: query Nominatim
    try {
      const nomUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        clean
      )}&countrycodes=in&format=json&limit=6&addressdetails=1`;
      const nomRes = await fetch(nomUrl, { headers: { "User-Agent": "ServoLocal-App/1.0" } });
      if (nomRes.ok) {
        const nomData = await nomRes.json();
        if (Array.isArray(nomData)) {
          return nomData.map((item: any) => {
            const parts = (item.display_name || "").split(",");
            const title = parts[0]?.trim() || "Location";
            const subtitle = parts.slice(1).join(",").trim() || "India";
            return {
              title,
              subtitle,
              lat: parseFloat(item.lat),
              lng: parseFloat(item.lon),
            };
          });
        }
      }
    } catch {}
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
    const res = await fetch(url, { headers: { "User-Agent": "ServoLocal-App/1.0" } });
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

