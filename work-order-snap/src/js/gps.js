// gps.js — Geolocation + OpenStreetMap Nominatim reverse geocoding

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/reverse';
const NOMINATIM_UA  = 'WorkOrderSnap/1.0 (tradesmansplaybook.com)'; // policy zahteva User-Agent

// Vraca { lat, lng, address } ili null
async function getLocation() {
  if (!navigator.geolocation) return null;

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const address = await reverseGeocode(lat, lng);
        resolve({ lat, lng, address });
      },
      () => resolve(null),  // korisnik odbio dozvolu ili timeout
      { timeout: 8000, maximumAge: 60000 }
    );
  });
}

// Koordinate → adresa string (OpenStreetMap Nominatim, besplatno)
async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(
      `${NOMINATIM_URL}?lat=${lat}&lon=${lng}&format=json`,
      { headers: { 'User-Agent': NOMINATIM_UA } }
    );
    if (!res.ok) return formatCoords(lat, lng);
    const data = await res.json();
    // Formatiramo adresu kao "Street, City, State ZIP"
    const a = data.address || {};
    const parts = [
      a.house_number && a.road ? `${a.house_number} ${a.road}` : a.road,
      a.city || a.town || a.village,
      a.state,
      a.postcode
    ].filter(Boolean);
    return parts.join(', ') || data.display_name || formatCoords(lat, lng);
  } catch {
    return formatCoords(lat, lng);
  }
}

function formatCoords(lat, lng) {
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

export { getLocation, reverseGeocode };
