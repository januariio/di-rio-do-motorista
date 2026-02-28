import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/StoreContext';
import { calcularLitros, calcularCustoDiesel, calcularMargem, calcularCustoPorKm, formatCurrency } from '@/utils/calculadora';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, TrendingUp, TrendingDown, Calculator } from 'lucide-react';

export default function NovaViagem() {
  const navigate = useNavigate();
  const { profile, addViagem } = useAppStore();

  const [form, setForm] = useState({
    valor_frete: '',
    cidade_origem: '',
    cidade_destino: '',
    distancia_km: '',
    preco_diesel: '6.29',
  });

  const distancia = parseFloat(form.distancia_km) || 0;
  const frete = parseFloat(form.valor_frete) || 0;
  const precoDiesel = parseFloat(form.preco_diesel) || 0;

  const litros = calcularLitros(distancia, profile.media_km_litro);
  const custoDiesel = calcularCustoDiesel(litros, precoDiesel);
  const margem = calcularMargem(frete, custoDiesel);
  const custoPorKm = calcularCustoPorKm(custoDiesel, distancia);
  const margemPercentual = frete > 0 ? (margem / frete) * 100 : 0;

  const valeAPena = margemPercentual >= 30;

  const handleIniciar = () => {
    if (!form.cidade_origem || !form.cidade_destino || !frete || !distancia) return;
    const viagem = addViagem({
      cidade_origem: form.cidade_origem,
      cidade_destino: form.cidade_destino,
      distancia_km: distancia,
      valor_frete: frete,
      preco_diesel: precoDiesel,
      litros_estimados: litros,
      custo_estimado_diesel: custoDiesel,
      status: 'ativa',
      data_inicio: new Date().toISOString(),
    });
    navigate(`/viagem/${viagem.id}`);
  };

  const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

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
          <Label>Valor do Frete (R$)</Label>
          <Input
            type="number"
            inputMode="decimal"
            placeholder="5.000,00"
            value={form.valor_frete}
            onChange={e => update('valor_frete', e.target.value)}
            className="mt-1 h-12 text-lg"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Origem</Label>
            <Input
              placeholder="São Paulo"
              value={form.cidade_origem}
              onChange={e => update('cidade_origem', e.target.value)}
              className="mt-1 h-12"
            />
          </div>
          <div>
            <Label>Destino</Label>
            <Input
              placeholder="Curitiba"
              value={form.cidade_destino}
              onChange={e => update('cidade_destino', e.target.value)}
              className="mt-1 h-12"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Distância (km)</Label>
            <Input
              type="number"
              inputMode="numeric"
              placeholder="400"
              value={form.distancia_km}
              onChange={e => update('distancia_km', e.target.value)}
              className="mt-1 h-12"
            />
          </div>
          <div>
            <Label>Diesel (R$/L)</Label>
            <Input
              type="number"
              inputMode="decimal"
              value={form.preco_diesel}
              onChange={e => update('preco_diesel', e.target.value)}
              className="mt-1 h-12"
            />
          </div>
        </div>
      </div>

      {/* Resultado */}
      {distancia > 0 && frete > 0 && (
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
          disabled={!form.cidade_origem || !form.cidade_destino || !frete || !distancia}
        >
          <Calculator className="mr-2 h-5 w-5" />
          Iniciar Viagem
        </Button>
      </div>
    </div>
  );
}
