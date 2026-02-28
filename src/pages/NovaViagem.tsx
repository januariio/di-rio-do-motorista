import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/StoreContext';
import { calcularLitros, calcularCustoDiesel, calcularMargem, calcularCustoPorKm, formatCurrency } from '@/utils/calculadora';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import CurrencyInput from '@/components/CurrencyInput';
import { isGoogleMapsAvailable, calcularDistancia } from '@/lib/googleMaps';
import { ArrowLeft, TrendingUp, TrendingDown, Calculator, MapPin, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function NovaViagem() {
  const navigate = useNavigate();
  const { profile, addViagem } = useAppStore();

  const [valorFrete, setValorFrete] = useState(0);
  const [precoDieselNum, setPrecoDieselNum] = useState(6.29);
  const [cidadeOrigem, setCidadeOrigem] = useState('');
  const [cidadeDestino, setCidadeDestino] = useState('');
  const [distanciaKm, setDistanciaKm] = useState('');
  const [calculandoRota, setCalculandoRota] = useState(false);
  const [temGoogleMaps] = useState(isGoogleMapsAvailable);

  const distancia = parseFloat(distanciaKm) || 0;

  const litros = calcularLitros(distancia, profile.media_km_litro);
  const custoDiesel = calcularCustoDiesel(litros, precoDieselNum);
  const margem = calcularMargem(valorFrete, custoDiesel);
  const custoPorKm = calcularCustoPorKm(custoDiesel, distancia);
  const margemPercentual = valorFrete > 0 ? (margem / valorFrete) * 100 : 0;
  const valeAPena = margemPercentual >= 30;

  const handleCalcularDistancia = useCallback(async () => {
    if (!cidadeOrigem.trim() || !cidadeDestino.trim()) return;
    setCalculandoRota(true);
    try {
      const result = await calcularDistancia(cidadeOrigem, cidadeDestino);
      setDistanciaKm(String(result.distanceKm));
      toast.success(`Distância: ${result.distanceText} (${result.durationText})`);
    } catch {
      toast.error('Não foi possível calcular a rota. Verifique os nomes das cidades.');
    } finally {
      setCalculandoRota(false);
    }
  }, [cidadeOrigem, cidadeDestino]);

  useEffect(() => {
    if (!temGoogleMaps) return;
    const timer = setTimeout(() => {
      if (cidadeOrigem.trim().length >= 3 && cidadeDestino.trim().length >= 3) {
        handleCalcularDistancia();
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [cidadeOrigem, cidadeDestino, temGoogleMaps, handleCalcularDistancia]);

  const handleIniciar = () => {
    if (!cidadeOrigem || !cidadeDestino || !valorFrete || !distancia) return;
    const viagem = addViagem({
      cidade_origem: cidadeOrigem,
      cidade_destino: cidadeDestino,
      distancia_km: distancia,
      valor_frete: valorFrete,
      preco_diesel: precoDieselNum,
      litros_estimados: litros,
      custo_estimado_diesel: custoDiesel,
      status: 'ativa',
      data_inicio: new Date().toISOString(),
    });
    navigate(`/viagem/${viagem.id}`);
  };

  return (
    <div className="space-y-5 animate-slide-up">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-bold">Simulador de Frete</h1>
      </div>

      <div className="space-y-4">
        <div>
          <Label>Valor do Frete</Label>
          <CurrencyInput
            value={valorFrete}
            onChange={setValorFrete}
            placeholder="0,00"
            className="mt-1 h-12 text-lg"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Origem</Label>
            <Input
              placeholder="São Paulo"
              value={cidadeOrigem}
              onChange={e => setCidadeOrigem(e.target.value)}
              className="mt-1 h-12"
            />
          </div>
          <div>
            <Label>Destino</Label>
            <Input
              placeholder="Curitiba"
              value={cidadeDestino}
              onChange={e => setCidadeDestino(e.target.value)}
              className="mt-1 h-12"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Distância (km)</Label>
            <div className="relative">
              <Input
                type="number"
                inputMode="numeric"
                placeholder="400"
                value={distanciaKm}
                onChange={e => setDistanciaKm(e.target.value)}
                className="mt-1 h-12"
                readOnly={calculandoRota}
              />
              {calculandoRota && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 mt-0.5 h-4 w-4 animate-spin text-primary" />
              )}
            </div>
            {temGoogleMaps && cidadeOrigem && cidadeDestino && !calculandoRota && (
              <button
                onClick={handleCalcularDistancia}
                className="flex items-center gap-1 mt-1 text-xs text-primary hover:underline"
              >
                <MapPin className="h-3 w-3" />
                Recalcular rota
              </button>
            )}
          </div>
          <div>
            <Label>Diesel (R$/L)</Label>
            <CurrencyInput
              value={precoDieselNum}
              onChange={setPrecoDieselNum}
              placeholder="0,00"
              className="mt-1 h-12"
            />
          </div>
        </div>
      </div>

      {distancia > 0 && valorFrete > 0 && (
        <div className={`rounded-lg border p-4 space-y-3 ${valeAPena ? 'border-success/40 bg-success/5' : 'border-destructive/40 bg-destructive/5'}`}>
          <div className="flex items-center gap-2">
            {valeAPena ? (
              <TrendingUp className="h-5 w-5 text-success" />
            ) : (
              <TrendingDown className="h-5 w-5 text-destructive" />
            )}
            <span className={`text-sm font-bold ${valeAPena ? 'text-success' : 'text-destructive'}`}>
              {valeAPena ? '🟢 Vale a pena!' : '🔴 Margem baixa'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">Litros estimados</span>
              <p className="font-semibold">{litros.toFixed(1)} L</p>
            </div>
            <div>
              <span className="text-muted-foreground">Custo diesel</span>
              <p className="font-semibold">{formatCurrency(custoDiesel)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Margem bruta</span>
              <p className={`font-semibold ${valeAPena ? 'text-success' : 'text-destructive'}`}>
                {formatCurrency(margem)} ({margemPercentual.toFixed(0)}%)
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Custo/km</span>
              <p className="font-semibold">{formatCurrency(custoPorKm)}</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <Button variant="secondary" className="flex-1 h-14 text-base" onClick={() => navigate(-1)}>
          Voltar
        </Button>
        <Button
          className="flex-1 h-14 text-base font-bold"
          onClick={handleIniciar}
          disabled={!cidadeOrigem || !cidadeDestino || !valorFrete || !distancia}
        >
          <Calculator className="mr-2 h-5 w-5" />
          Iniciar Viagem
        </Button>
      </div>
    </div>
  );
}
