import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { UserProfile } from '@/types';

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
}

interface SignUpResult {
  error: string | null;
  needsConfirmation?: boolean;
}

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, profileData: Omit<UserProfile, 'id' | 'tipo_combustivel'>) => Promise<SignUpResult>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

async function fetchProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    nome: data.nome,
    email: data.email,
    whatsapp: data.whatsapp,
    modelo_caminhao: data.modelo_caminhao,
    media_km_litro: data.media_km_litro,
    tipo_combustivel: data.tipo_combustivel ?? 'Diesel S10',
  };
}

async function ensureProfile(user: User): Promise<UserProfile | null> {
  let profile = await fetchProfile(user.id);
  if (profile) return profile;

  const meta = user.user_metadata ?? {};
  const { error } = await supabase.from('profiles').insert({
    id: user.id,
    nome: meta.nome ?? 'Motorista',
    email: user.email ?? '',
    whatsapp: meta.whatsapp ?? '',
    modelo_caminhao: meta.modelo_caminhao ?? 'Scania R450',
    media_km_litro: meta.media_km_litro ?? 2.5,
    tipo_combustivel: 'Diesel S10',
  });

  if (error) return null;
  return fetchProfile(user.id);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    session: null,
    user: null,
    profile: null,
    loading: true,
  });

  const loadProfile = useCallback(async (user: User) => {
    const profile = await ensureProfile(user);
    setState(prev => ({ ...prev, profile, loading: false }));
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setState(prev => ({ ...prev, session, user: session.user }));
        loadProfile(session.user);
      } else {
        setState(prev => ({ ...prev, loading: false }));
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setState(prev => ({ ...prev, session, user: session?.user ?? null }));
      if (session?.user) {
        loadProfile(session.user);
      } else {
        setState(prev => ({ ...prev, profile: null, loading: false }));
      }
    });

    return () => subscription.unsubscribe();
  }, [loadProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return { error: null };
  }, []);

  const signUp = useCallback(async (
    email: string,
    password: string,
    profileData: Omit<UserProfile, 'id' | 'tipo_combustivel'>
  ): Promise<SignUpResult> => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nome: profileData.nome,
          whatsapp: profileData.whatsapp ?? '',
          modelo_caminhao: profileData.modelo_caminhao,
          media_km_litro: profileData.media_km_litro,
        },
      },
    });
    if (error) return { error: error.message };
    if (!data.user) return { error: 'Erro ao criar conta.' };

    const hasSession = !!data.session;

    if (hasSession) {
      await ensureProfile(data.user);
    }

    return { error: null, needsConfirmation: !hasSession };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setState({ session: null, user: null, profile: null, loading: false });
  }, []);

  const refreshProfile = useCallback(async () => {
    if (state.user) {
      const profile = await ensureProfile(state.user);
      setState(prev => ({ ...prev, profile }));
    }
  }, [state.user]);

  return (
    <AuthContext.Provider value={{ ...state, signIn, signUp, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
