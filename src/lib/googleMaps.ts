const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string;

let loadPromise: Promise<void> | null = null;

export function isGoogleMapsAvailable(): boolean {
  return !!API_KEY;
}

export function loadGoogleMaps(): Promise<void> {
  if (!API_KEY) return Promise.reject(new Error('VITE_GOOGLE_MAPS_API_KEY não configurada'));

  if (window.google?.maps) return Promise.resolve();

  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&libraries=places`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Falha ao carregar Google Maps'));
    document.head.appendChild(script);
  });

  return loadPromise;
}

export interface DistanceResult {
  distanceKm: number;
  distanceText: string;
  durationText: string;
}

export async function calcularDistancia(origem: string, destino: string): Promise<DistanceResult> {
  await loadGoogleMaps();

  return new Promise((resolve, reject) => {
    const service = new google.maps.DistanceMatrixService();
    service.getDistanceMatrix(
      {
        origins: [origem],
        destinations: [destino],
        travelMode: google.maps.TravelMode.DRIVING,
        unitSystem: google.maps.UnitSystem.METRIC,
      },
      (response, status) => {
        if (status !== 'OK' || !response) {
          reject(new Error('Erro ao calcular distância'));
          return;
        }

        const element = response.rows[0]?.elements[0];
        if (!element || element.status !== 'OK') {
          reject(new Error('Não foi possível calcular a rota entre as cidades'));
          return;
        }

        resolve({
          distanceKm: Math.round(element.distance.value / 1000),
          distanceText: element.distance.text,
          durationText: element.duration.text,
        });
      }
    );
  });
}
