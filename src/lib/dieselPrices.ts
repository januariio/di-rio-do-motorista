const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string;

export interface GasStation {
  name: string;
  address: string;
  fuelPrice: number | null;
  rating: number | null;
}

interface PlaceResult {
  displayName?: { text: string };
  formattedAddress?: string;
  rating?: number;
  fuelOptions?: {
    fuelPrices?: Array<{
      type: string;
      price: { currencyCode: string; units: string; nanos: number };
    }>;
  };
}

async function geocodeCity(city: string): Promise<{ lat: number; lng: number } | null> {
  const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': API_KEY,
      'X-Goog-FieldMask': 'places.location',
    },
    body: JSON.stringify({
      textQuery: `${city}, Brasil`,
      maxResultCount: 1,
    }),
  });
  const data = await res.json();
  const loc = data.places?.[0]?.location;
  if (!loc) return null;
  return { lat: loc.latitude, lng: loc.longitude };
}

export async function buscarPostosDiesel(cidade: string): Promise<GasStation[]> {
  if (!API_KEY) return [];

  const coords = await geocodeCity(cidade);
  if (!coords) return [];

  const res = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': API_KEY,
      'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.rating,places.fuelOptions',
    },
    body: JSON.stringify({
      includedTypes: ['gas_station'],
      maxResultCount: 10,
      locationRestriction: {
        circle: {
          center: { latitude: coords.lat, longitude: coords.lng },
          radius: 15000,
        },
      },
      languageCode: 'pt-BR',
    }),
  });

  const data = await res.json();
  if (data.error || !data.places) return [];

  return data.places.map((p: PlaceResult) => {
    const diesel = p.fuelOptions?.fuelPrices?.find(
      f => f.type === 'DIESEL' || f.type === 'REGULAR_UNLEADED'
    );
    let price: number | null = null;
    if (diesel) {
      price = parseFloat(diesel.price.units) + diesel.price.nanos / 1e9;
    }
    return {
      name: p.displayName?.text ?? 'Posto',
      address: p.formattedAddress ?? '',
      fuelPrice: price,
      rating: p.rating ?? null,
    };
  })
  .sort((a: GasStation, b: GasStation) => {
    if (a.fuelPrice && b.fuelPrice) return a.fuelPrice - b.fuelPrice;
    if (a.fuelPrice) return -1;
    if (b.fuelPrice) return 1;
    return 0;
  });
}
