const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string;

export function isGoogleMapsAvailable(): boolean {
  return !!API_KEY && API_KEY !== 'sua-api-key-aqui';
}

export interface DistanceResult {
  distanceKm: number;
  distanceText: string;
  durationText: string;
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}min`;
  return `${m}min`;
}

export async function calcularDistancia(origem: string, destino: string): Promise<DistanceResult> {
  if (!API_KEY) throw new Error('API key não configurada');

  const response = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': API_KEY,
      'X-Goog-FieldMask': 'routes.distanceMeters,routes.duration',
    },
    body: JSON.stringify({
      origin: { address: `${origem}, Brasil` },
      destination: { address: `${destino}, Brasil` },
      travelMode: 'DRIVE',
    }),
  });

  const data = await response.json();

  if (data.error) {
    throw new Error(data.error.message || 'Erro na API do Google Maps');
  }

  const route = data.routes?.[0];
  if (!route) {
    throw new Error('Não foi possível calcular a rota entre as cidades');
  }

  const distanceKm = Math.round(route.distanceMeters / 1000);
  const durationSeconds = parseInt(route.duration?.replace('s', '') || '0', 10);

  return {
    distanceKm,
    distanceText: `${distanceKm} km`,
    durationText: formatDuration(durationSeconds),
  };
}
