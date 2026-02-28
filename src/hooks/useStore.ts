import { useState, useCallback } from 'react';
import { Viagem, Despesa, Abastecimento, UserProfile } from '@/types';
import { generateId } from '@/utils/calculadora';

const STORAGE_KEYS = {
  VIAGENS: 'db_viagens',
  DESPESAS: 'db_despesas',
  ABASTECIMENTOS: 'db_abastecimentos',
  PROFILE: 'db_profile',
};

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage<T>(key: string, data: T): void {
  localStorage.setItem(key, JSON.stringify(data));
}

const DEFAULT_PROFILE: UserProfile = {
  nome: 'Motorista',
  modelo_caminhao: 'Scania R450',
  media_km_litro: 2.5,
  tipo_combustivel: 'Diesel S10',
};

export function useStore() {
  const [viagens, setViagens] = useState<Viagem[]>(() => loadFromStorage(STORAGE_KEYS.VIAGENS, []));
  const [despesas, setDespesas] = useState<Despesa[]>(() => loadFromStorage(STORAGE_KEYS.DESPESAS, []));
  const [abastecimentos, setAbastecimentos] = useState<Abastecimento[]>(() => loadFromStorage(STORAGE_KEYS.ABASTECIMENTOS, []));
  const [profile, setProfile] = useState<UserProfile>(() => loadFromStorage(STORAGE_KEYS.PROFILE, DEFAULT_PROFILE));

  const updateProfile = useCallback((p: UserProfile) => {
    setProfile(p);
    saveToStorage(STORAGE_KEYS.PROFILE, p);
  }, []);

  const addViagem = useCallback((v: Omit<Viagem, 'id' | 'created_at'>) => {
    const nova: Viagem = { ...v, id: generateId(), created_at: new Date().toISOString() };
    setViagens(prev => {
      const next = [nova, ...prev];
      saveToStorage(STORAGE_KEYS.VIAGENS, next);
      return next;
    });
    return nova;
  }, []);

  const updateViagem = useCallback((id: string, updates: Partial<Viagem>) => {
    setViagens(prev => {
      const next = prev.map(v => v.id === id ? { ...v, ...updates } : v);
      saveToStorage(STORAGE_KEYS.VIAGENS, next);
      return next;
    });
  }, []);

  const addDespesa = useCallback((d: Omit<Despesa, 'id' | 'created_at'>) => {
    const nova: Despesa = { ...d, id: generateId(), created_at: new Date().toISOString() };
    setDespesas(prev => {
      const next = [nova, ...prev];
      saveToStorage(STORAGE_KEYS.DESPESAS, next);
      return next;
    });
    return nova;
  }, []);

  const getDespesasViagem = useCallback((viagemId: string) => {
    return despesas.filter(d => d.viagem_id === viagemId);
  }, [despesas]);

  const addAbastecimento = useCallback((a: Omit<Abastecimento, 'id' | 'created_at'>) => {
    const novo: Abastecimento = { ...a, id: generateId(), created_at: new Date().toISOString() };
    setAbastecimentos(prev => {
      const next = [novo, ...prev];
      saveToStorage(STORAGE_KEYS.ABASTECIMENTOS, next);
      return next;
    });
  }, []);

  const getViagemAtiva = useCallback(() => {
    return viagens.find(v => v.status === 'ativa') || null;
  }, [viagens]);

  return {
    viagens, despesas, abastecimentos, profile,
    updateProfile, addViagem, updateViagem,
    addDespesa, getDespesasViagem,
    addAbastecimento, getViagemAtiva,
  };
}
