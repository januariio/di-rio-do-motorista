import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/StoreContext';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency } from '@/utils/calculadora';
import StatCard from '@/components/StatCard';
import { Truck, PlusCircle, Fuel, History, BarChart3, MapPin, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMemo } from 'react';

export default function Dashboard() {
  const navigate = useNavigate();
  const { profile: localProfile, viagens, despesas } = useAppStore();
  const { profile: authProfile, signOut } = useAuth();
  const profile = authProfile ?? localProfile;

  const viagemAtiva = viagens.find(v => v.status === 'ativa');

  const stats = useMemo(() => {
    const now = new Date();
    const dias30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const recentes = viagens.filter(v => v.status === 'encerrada' && new Date(v.created_at) >= dias30);
    const totalFretes = recentes.reduce((s, v) => s + v.valor_frete, 0);
    const despesasRecentes = despesas.filter(d => recentes.some(v => v.id === d.viagem_id));
    const totalDespesas = despesasRecentes.reduce((s, d) => s + d.valor, 0);
    const lucro = totalFretes - totalDespesas;
    return { totalFretes, totalDespesas, lucro, qtdViagens: recentes.length };
  }, [viagens, despesas]);

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Truck className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-foreground">{profile.nome}</h1>
          <p className="text-sm text-muted-foreground">
            {profile.modelo_caminhao} • {profile.media_km_litro} km/l
          </p>
        </div>
        <button
          onClick={signOut}
          className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          title="Sair"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>

      {/* Viagem ativa */}
      {viagemAtiva && (
        <button
          onClick={() => navigate(`/viagem/${viagemAtiva.id}`)}
          className="w-full rounded-lg border border-primary/40 bg-primary/5 p-4 text-left transition-colors hover:bg-primary/10"
        >
          <div className="flex items-center gap-2 text-sm font-semibold text-primary">
            <MapPin className="h-4 w-4" />
            Viagem em andamento
          </div>
          <p className="mt-1 text-foreground font-medium">
            {viagemAtiva.cidade_origem} → {viagemAtiva.cidade_destino}
          </p>
          <p className="text-sm text-muted-foreground">
            Frete: {formatCurrency(viagemAtiva.valor_frete)}
          </p>
        </button>
      )}

      {/* Stats últimos 30 dias */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Últimos 30 dias
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Fretes" value={formatCurrency(stats.totalFretes)} />
          <StatCard label="Despesas" value={formatCurrency(stats.totalDespesas)} variant="destructive" />
          <StatCard label="Lucro" value={formatCurrency(stats.lucro)} variant={stats.lucro >= 0 ? 'success' : 'destructive'} />
          <StatCard label="Viagens" value={String(stats.qtdViagens)} />
        </div>
      </div>

      {/* Ações rápidas */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Ações rápidas
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={() => navigate('/nova-viagem')}
            className="h-16 flex-col gap-1 text-sm font-semibold"
            size="lg"
          >
            <PlusCircle className="h-5 w-5" />
            Nova Viagem
          </Button>
          <Button
            onClick={() => navigate('/abastecimento')}
            variant="secondary"
            className="h-16 flex-col gap-1 text-sm font-semibold"
            size="lg"
          >
            <Fuel className="h-5 w-5" />
            Abastecimento
          </Button>
          <Button
            onClick={() => navigate('/historico')}
            variant="secondary"
            className="h-16 flex-col gap-1 text-sm font-semibold"
            size="lg"
          >
            <History className="h-5 w-5" />
            Histórico
          </Button>
          <Button
            onClick={() => navigate('/fechamento')}
            variant="secondary"
            className="h-16 flex-col gap-1 text-sm font-semibold"
            size="lg"
          >
            <BarChart3 className="h-5 w-5" />
            Fechamento
          </Button>
        </div>
      </div>
    </div>
  );
}
