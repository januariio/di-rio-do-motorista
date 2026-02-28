import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/StoreContext';
import { formatCurrency, formatDate } from '@/utils/calculadora';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import StatCard from '@/components/StatCard';
import { ArrowLeft, Plus, Fuel } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useMemo } from 'react';

export default function AbastecimentoPage() {
  const navigate = useNavigate();
  const { abastecimentos, addAbastecimento } = useAppStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ cidade: '', preco_diesel: '', quilometragem: '', litragem: '', observacao: '' });

  const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const litragem = parseFloat(form.litragem) || 0;
  const km = parseFloat(form.quilometragem) || 0;
  const mediaCalc = litragem > 0 && km > 0 ? km / litragem : 0;

  const handleSave = () => {
    if (!form.cidade || !form.preco_diesel || !litragem) return;
    addAbastecimento({
      cidade: form.cidade,
      preco_diesel: parseFloat(form.preco_diesel),
      quilometragem: km,
      litragem,
      media_calculada: mediaCalc,
      observacao: form.observacao || undefined,
    });
    setForm({ cidade: '', preco_diesel: '', quilometragem: '', litragem: '', observacao: '' });
    setDialogOpen(false);
  };

  const stats = useMemo(() => {
    const now = new Date();
    const dias30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const recentes = abastecimentos.filter(a => new Date(a.created_at) >= dias30);
    const custoTotal = recentes.reduce((s, a) => s + a.preco_diesel * a.litragem, 0);
    const mediaGeral = recentes.length > 0 ? recentes.reduce((s, a) => s + a.media_calculada, 0) / recentes.length : 0;
    return { custoTotal, mediaGeral, count: recentes.length };
  }, [abastecimentos]);

  return (
    <div className="space-y-5 animate-slide-up">
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
                <Input value={form.cidade} onChange={e => update('cidade', e.target.value)} className="mt-1 h-12" placeholder="Ribeirão Preto" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Diesel (R$/L)</Label>
                  <Input type="number" inputMode="decimal" value={form.preco_diesel} onChange={e => update('preco_diesel', e.target.value)} className="mt-1 h-12" />
                </div>
                <div>
                  <Label>Litros</Label>
                  <Input type="number" inputMode="decimal" value={form.litragem} onChange={e => update('litragem', e.target.value)} className="mt-1 h-12" />
                </div>
              </div>
              <div>
                <Label>Km rodados desde último abast.</Label>
                <Input type="number" inputMode="numeric" value={form.quilometragem} onChange={e => update('quilometragem', e.target.value)} className="mt-1 h-12" />
              </div>
              {mediaCalc > 0 && (
                <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-center">
                  <span className="text-xs text-muted-foreground">Média calculada</span>
                  <p className="text-lg font-bold text-primary">{mediaCalc.toFixed(2)} km/L</p>
                </div>
              )}
              <div>
                <Label>Observação (opcional)</Label>
                <Input value={form.observacao} onChange={e => update('observacao', e.target.value)} className="mt-1 h-12" />
              </div>
              <Button className="w-full h-12 text-base font-bold" onClick={handleSave} disabled={!form.cidade || !form.preco_diesel || !litragem}>
                Salvar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <StatCard label="Custo 30d" value={formatCurrency(stats.custoTotal)} />
        <StatCard label="Média km/L" value={stats.mediaGeral > 0 ? stats.mediaGeral.toFixed(2) : '--'} />
        <StatCard label="Abast." value={String(stats.count)} />
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Últimos abastecimentos</h2>
        {abastecimentos.length === 0 ? (
          <div className="flex flex-col items-center py-10 text-muted-foreground">
            <Fuel className="h-10 w-10 mb-2 opacity-40" />
            <p className="text-sm">Nenhum abastecimento registrado</p>
          </div>
        ) : (
          <div className="space-y-2">
            {abastecimentos.slice(0, 20).map(a => (
              <div key={a.id} className="rounded-lg bg-card border border-border p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{a.cidade}</p>
                  <span className="text-xs text-muted-foreground">{formatDate(a.created_at)}</span>
                </div>
                <div className="mt-1 flex gap-3 text-xs text-muted-foreground">
                  <span>R$ {a.preco_diesel.toFixed(2)}/L</span>
                  <span>{a.litragem.toFixed(0)}L</span>
                  <span>{a.media_calculada.toFixed(2)} km/L</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
