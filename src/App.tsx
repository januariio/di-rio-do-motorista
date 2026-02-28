import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { StoreProvider } from "@/store/StoreContext";
import MobileLayout from "@/components/MobileLayout";
import Dashboard from "./pages/Dashboard";
import NovaViagem from "./pages/NovaViagem";
import ViagemAtiva from "./pages/ViagemAtiva";
import Relatorio from "./pages/Relatorio";
import AbastecimentoPage from "./pages/AbastecimentoPage";
import Historico from "./pages/Historico";
import FechamentoMes from "./pages/FechamentoMes";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <StoreProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <MobileLayout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/nova-viagem" element={<NovaViagem />} />
              <Route path="/viagem/:id" element={<ViagemAtiva />} />
              <Route path="/relatorio/:id" element={<Relatorio />} />
              <Route path="/abastecimento" element={<AbastecimentoPage />} />
              <Route path="/historico" element={<Historico />} />
              <Route path="/fechamento" element={<FechamentoMes />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </MobileLayout>
        </BrowserRouter>
      </StoreProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
