import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/StoreContext';
import { formatCurrency } from '@/utils/calculadora';
import { CATEGORIAS_DESPESA } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import StatCard from '@/components/StatCard';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Plus, MapPin, XCircle, CheckCircle } from 'lucide-react';
import { useMemo } from 'react';

export default function ViagemAtiva() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { viagens, updateViagem, addDespesa, getDespesasViagem } = useAppStore();

  const viagem = viagens.find(v => v.id === id);
  const despesasViagem = useMemo(() => (id ? getDespesasViagem(id) : []), [id, getDespesasViagem]);
  const totalDespesas = despesasViagem.reduce((s, d) => s + d.valor, 0);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [categoria, setCategoria] = useState('');
  const [valor, setValor] = useState('');
  const [obs, setObs] = useState('');

  if (!viagem) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <p>Viagem não encontrada</p>
        <Button variant="secondary" className="mt-4" onClick={() => navigate('/')}>Voltar</Button>
      </div>
    );
  }

  const lucroAtual = viagem.valor_frete - totalDespesas;
  const encerrada = viagem.status === 'encerrada' || viagem.status === 'cancelada';

  const handleAddDespesa = () => {
    if (!categoria || !valor || !id) return;
    addDespesa({ viagem_id: id, categoria, valor: parseFloat(valor), observacao: obs || undefined });
    setCategoria('');
    setValor('');
    setObs('');
    setDialogOpen(false);
  };

  const handleEncerrar = () => {
    updateViagem(viagem.id, { status: 'encerrada', data_fim: new Date().toISOString() });
    navigate(`/relatorio/${viagem.id}`);
  };

  const handleCancelar = () => {
    updateViagem(viagem.id, { status: 'cancelada', data_fim: new Date().toISOString() });
    navigate('/');
  };

  return (
    <div className="space-y-5 animate-slide-up">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/')} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-bold">
          {encerrada ? 'Viagem Encerrada' : 'Viagem em Andamento'}
        </h1>
      </div>

      {/* Rota */}
      <div className="flex items-center gap-2 text-foreground">
        <MapPin className="h-4 w-4 text-primary" />
        <span className="font-semibold">
          {viagem.cidade_origem} → {viagem.cidade_destino}
        </span>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-3 gap-2">
        <StatCard label="Frete" value={formatCurrency(viagem.valor_frete)} />
        <StatCard label="Despesas" value={formatCurrency(totalDespesas)} variant="destructive" />
        <StatCard label="Lucro" value={formatCurrency(lucroAtual)} variant={lucroAtual >= 0 ? 'success' : 'destructive'} />
      </div>

      {/* Lista despesas */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Despesas</h2>
          {!encerrada && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="h-9">
                  <Plus className="mr-1 h-4 w-4" /> Adicionar
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-sm">
                <DialogHeader>
                  <DialogTitle>Nova Despesa</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <div>
                    <Label>Categoria</Label>
                    <Select value={categoria} onValueChange={setCategoria}>
                      <SelectTrigger className="mt-1 h-12">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIAS_DESPESA.map(c => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Valor (R$)</Label>
                    <Input type="number" inputMode="decimal" value={valor} onChange={e => setValor(e.target.value)} className="mt-1 h-12 text-lg" />
                  </div>
                  <div>
                    <Label>Observação (opcional)</Label>
                    <Input value={obs} onChange={e => setObs(e.target.value)} className="mt-1 h-12" />
                  </div>
                  <Button className="w-full h-12 text-base font-bold" onClick={handleAddDespesa} disabled={!categoria || !valor}>
                    Salvar Despesa
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {despesasViagem.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">Nenhuma despesa registrada</p>
        ) : (
          <div className="space-y-2">
            {despesasViagem.map(d => (
              <div key={d.id} className="flex items-center justify-between rounded-lg bg-card border border-border p-3">
                <div>
                  <p className="text-sm font-medium">{d.categoria}</p>
                  {d.observacao && <p className="text-xs text-muted-foreground">{d.observacao}</p>}
                </div>
                <span className="text-sm font-bold text-destructive">-{formatCurrency(d.valor)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Ações */}
      {!encerrada && (
        <div className="flex gap-3 pt-2">
          <Button variant="secondary" className="flex-1 h-14 text-base" onClick={handleCancelar}>
            <XCircle className="mr-2 h-5 w-5" /> Cancelar
          </Button>
          <Button className="flex-1 h-14 text-base font-bold" onClick={handleEncerrar}>
            <CheckCircle className="mr-2 h-5 w-5" /> Encerrar
          </Button>
        </div>
      )}
    </div>
  );
}
