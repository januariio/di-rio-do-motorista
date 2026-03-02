import { useState, useCallback, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { MapPin, Loader2 } from 'lucide-react';

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string;

interface Suggestion {
  placeId: string;
  mainText: string;
  secondaryText: string;
  fullText: string;
}

interface CityAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

async function fetchSuggestions(input: string): Promise<Suggestion[]> {
  if (!API_KEY || input.trim().length < 2) return [];

  const response = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': API_KEY,
    },
    body: JSON.stringify({
      input,
      includedRegionCodes: ['br'],
      includedPrimaryTypes: ['locality', 'administrative_area_level_2'],
      languageCode: 'pt-BR',
    }),
  });

  const data = await response.json();
  if (data.error || !data.suggestions) return [];

  return data.suggestions
    .filter((s: any) => s.placePrediction)
    .map((s: any) => {
      const p = s.placePrediction;
      return {
        placeId: p.placeId,
        mainText: p.structuredFormat?.mainText?.text ?? p.text?.text ?? '',
        secondaryText: p.structuredFormat?.secondaryText?.text ?? '',
        fullText: p.text?.text ?? '',
      };
    });
}

export default function CityAutocomplete({ value, onChange, placeholder = 'Cidade', className = '' }: CityAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const containerRef = useRef<HTMLDivElement>(null);

  const handleInput = useCallback((text: string) => {
    onChange(text);
    if (timerRef.current) clearTimeout(timerRef.current);

    if (text.trim().length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    timerRef.current = setTimeout(async () => {
      setLoading(true);
      const results = await fetchSuggestions(text);
      setSuggestions(results);
      setOpen(results.length > 0);
      setLoading(false);
    }, 300);
  }, [onChange]);

  const handleSelect = useCallback((suggestion: Suggestion) => {
    const display = suggestion.secondaryText
      ? `${suggestion.mainText} - ${suggestion.secondaryText.split(',')[0]}`
      : suggestion.mainText;
    onChange(display);
    setOpen(false);
    setSuggestions([]);
  }, [onChange]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!API_KEY) {
    return (
      <Input
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        className={className}
      />
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <Input
        placeholder={placeholder}
        value={value}
        onChange={e => handleInput(e.target.value)}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        className={className}
      />
      {loading && (
        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
      )}
      {open && suggestions.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-card shadow-lg overflow-hidden">
          {suggestions.map(s => (
            <button
              key={s.placeId}
              onClick={() => handleSelect(s)}
              className="flex items-center gap-2 w-full px-3 py-2.5 text-left text-sm hover:bg-secondary transition-colors"
            >
              <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div>
                <span className="font-medium text-foreground">{s.mainText}</span>
                {s.secondaryText && (
                  <span className="text-muted-foreground"> - {s.secondaryText}</span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
