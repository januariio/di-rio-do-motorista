import { useCallback } from 'react';
import { Input } from '@/components/ui/input';

interface CurrencyInputProps {
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  className?: string;
}

function formatBRL(cents: number): string {
  if (cents === 0) return '';
  const reais = cents / 100;
  return reais.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function parseCents(formatted: string): number {
  const digits = formatted.replace(/\D/g, '');
  return parseInt(digits, 10) || 0;
}

export default function CurrencyInput({ value, onChange, placeholder = '0,00', className = '' }: CurrencyInputProps) {
  const cents = Math.round(value * 100);
  const display = formatBRL(cents);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const newCents = parseCents(raw);
    onChange(newCents / 100);
  }, [onChange]);

  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium pointer-events-none">
        R$
      </span>
      <Input
        type="text"
        inputMode="numeric"
        placeholder={placeholder}
        value={display}
        onChange={handleChange}
        className={`pl-10 ${className}`}
      />
    </div>
  );
}
