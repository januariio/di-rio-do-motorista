import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/StoreContext';
import { formatCurrency, formatDate } from '@/utils/calculadora';
import CurrencyInput from '@/components/CurrencyInput';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import StatCard from '@/components/StatCard';
import { ArrowLeft, Plus, Fuel, Gauge, TrendingUp } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const PERIODOS = [
  { label: '7 dias', dias: 7 },
  { label: '15 dias', dias: 15 },
  { label: '30 dias', dias: 30 },
] as const;

export default function AbastecimentoPage() {
  const navigate = useNavigate();
  const { abastecimentos, addAbastecimento } = useAppStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [periodo, setPeriodo] = useState(30);

  const [cidade, setCidade] = useState('');
  const [precoDiesel, setPrecoDiesel] = useState(0);
  const [hodometro, setHodometro] = useState('');
  const [litragem, setLitragem] = useState('');
  const [observacao, setObservacao] = useState('');

  const litrosNum = parseFloat(litragem) || 0;
  const hodometroNum = parseFloat(hodometro) || 0;

  const sorted = useMemo(
    () => [...abastecimentos].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [abastecimentos]
  );

  const ultimoAbastecimento = sorted[0] ?? null;

  const mediaPreview = useMemo(() => {
    if (!ultimoAbastecimento || litrosNum <= 0 || hodometroNum <= 0) return 0;
    const kmRodados = hodometroNum - ultimoAbastecimento.hodometro;
    if (kmRodados <= 0) return 0;
    return kmRodados / litrosNum;
  }, [ultimoAbastecimento, litrosNum, hodometroNum]);

  const kmRodadosPreview = ultimoAbastecimento && hodometroNum > 0
    ? hodometroNum - ultimoAbastecimento.hodometro
    : 0;

  const isPrimeiro = sorted.length === 0;

  const handleSave = () => {
    if (!cidade || precoDiesel <= 0 || litrosNum <= 0 || hodometroNum <= 0) return;

    let media = 0;
    if (ultimoAbastecimento) {
      const kmRodados = hodometroNum - ultimoAbastecimento.hodometro;
      if (kmRodados > 0 && litrosNum > 0) {
        media = kmRodados / litrosNum;
      }
    }

    addAbastecimento({
      cidade,
      preco_diesel: precoDiesel,
      hodometro: hodometroNum,
      litragem: litrosNum,
      media_calculada: media,
      observacao: observacao || undefined,
    });

    setCidade('');
    setPrecoDiesel(0);
    setHodometro('');
    setLitragem('');
    setObservacao('');
    setDialogOpen(false);
  };

  const stats = useMemo(() => {
    const now = new Date();
    const limite = new Date(now.getTime() - periodo * 24 * 60 * 60 * 1000);
    const recentes = sorted.filter(a => new Date(a.created_at) >= limite);
    const custoCombustivel = recentes.reduce((s, a) => s + a.preco_diesel * a.litragem, 0);
    const totalLitros = recentes.reduce((s, a) => s + a.litragem, 0);
    return { custoCombustivel, totalLitros, count: recentes.length };
  }, [sorted, periodo]);

  const ultimaMedia = useMemo(() => {
    const comMedia = sorted.find(a => a.media_calculada > 0);
    return comMedia?.media_calculada ?? 0;
  }, [sorted]);

  return (
    <div className="space-y-5 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-bold">Abastecimento</h1>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-9">
              <Plus className="mr-1 h-4 w-4" /> Novo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Novo Abastecimento</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Cidade</Label>
                <Input value={cidade} onChange={e => setCidade(e.target.value)} className="mt-1 h-12" placeholder="Ribeirão Preto" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Diesel (R$/L)</Label>
                  <CurrencyInput value={precoDiesel} onChange={setPrecoDiesel} className="mt-1 h-12" />
                </div>
                <div>
                  <Label>Litros</Label>
                  <Input type="number" inputMode="decimal" placeholder="300" value={litragem} onChange={e => setLitragem(e.target.value)} className="mt-1 h-12" />
                </div>
              </div>
              <div>
                <Label>Hodômetro (km)</Label>
                <Input type="number" inputMode="numeric" placeholder={ultimoAbastecimento ? `Último: ${ultimoAbastecimento.hodometro.toLocaleString('pt-BR')} km` : 'Ex: 125.000'} value={hodometro} onChange={e => setHodometro(e.target.value)} className="mt-1 h-12" />
                {ultimoAbastecimento && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Último hodômetro: {ultimoAbastecimento.hodometro.toLocaleString('pt-BR')} km
                  </p>
                )}
              </div>

              {isPrimeiro && (
                <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-center">
                  <Gauge className="h-5 w-5 mx-auto text-primary mb-1" />
                  <p className="text-xs text-muted-foreground">
                    Primeiro abastecimento registrado. A média será calculada a partir do próximo.
                  </p>
                </div>
              )}

              {!isPrimeiro && mediaPreview > 0 && kmRodadosPreview > 0 && (
                <div className="rounded-lg border border-success/30 bg-success/5 p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="h-4 w-4 text-success" />
                    <span className="text-xs font-semibold text-success">Média calculada</span>
                  </div>
                  <p className="text-lg font-bold text-success">{mediaPreview.toFixed(2)} km/L</p>
                  <p className="text-xs text-muted-foreground">
                    {kmRodadosPreview.toLocaleString('pt-BR')} km rodados • {litrosNum.toFixed(0)} L abastecidos
                  </p>
                </div>
              )}

              <div>
                <Label>Observação (opcional)</Label>
                <Input value={observacao} onChange={e => setObservacao(e.target.value)} className="mt-1 h-12" />
              </div>
              <Button className="w-full h-12 text-base font-bold" onClick={handleSave} disabled={!cidade || precoDiesel <= 0 || litrosNum <= 0 || hodometroNum <= 0}>
                Salvar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Dashboard com período */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Resumo
          </h2>
          <div className="flex rounded-lg bg-card border border-border overflow-hidden">
            {PERIODOS.map(p => (
              <button
                key={p.dias}
                onClick={() => setPeriodo(p.dias)}
                className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
                  periodo === p.dias
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <StatCard label="Custo combustível" value={formatCurrency(stats.custoCombustivel)} />
          <StatCard
            label="Média km/L"
            value={ultimaMedia > 0 ? `${ultimaMedia.toFixed(2)}` : '--'}
            variant={ultimaMedia >= 2.5 ? 'success' : ultimaMedia > 0 ? 'destructive' : 'default'}
          />
          <StatCard label="Abastecimentos" value={String(stats.count)} />
        </div>
        {ultimaMedia > 0 && (
          <p className="text-xs text-muted-foreground mt-2">
            Média baseada no último abastecimento registrado
          </p>
        )}
      </div>

      {/* Histórico */}
      <div>
        <h2 className="mb-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Histórico de abastecimentos
        </h2>
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center py-10 text-muted-foreground">
            <Fuel className="h-10 w-10 mb-2 opacity-40" />
            <p className="text-sm">Nenhum abastecimento registrado</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sorted.slice(0, 20).map((a, i) => {
              const proximo = sorted[i + 1];
              const kmRodados = proximo ? a.hodometro - proximo.hodometro : 0;
              return (
                <div key={a.id} className="rounded-lg bg-card border border-border p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{a.cidade}</p>
                    <span className="text-xs text-muted-foreground">{formatDate(a.created_at)}</span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span>{formatCurrency(a.preco_diesel)}/L</span>
                    <span>{a.litragem.toFixed(0)} L</span>
                    <span>{a.hodometro.toLocaleString('pt-BR')} km</span>
                    {a.media_calculada > 0 && (
                      <span className="font-semibold text-success">{a.media_calculada.toFixed(2)} km/L</span>
                    )}
                    {kmRodados > 0 && (
                      <span>({kmRodados.toLocaleString('pt-BR')} km rodados)</span>
                    )}
                  </div>
                  {a.observacao && (
                    <p className="mt-1 text-xs text-muted-foreground italic">{a.observacao}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
