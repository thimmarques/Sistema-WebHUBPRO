import React, { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { UserProfile } from '@/types';
import { supabase } from '@/lib/supabase';
import { logLogin, logLogout } from '../services/activityLogger';

interface AuthContextType {
  currentUser: UserProfile | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<{ error: any | null }>;
  logout: () => Promise<void>;
  isAdmin: () => boolean;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('Erro ao buscar perfil:', profileError);
        throw profileError;
      }

      if (data) {
        const profile: UserProfile = {
          id: data.id,
          name: data.nome,
          email: data.email,
          oab: data.oab || '',
          role: data.role,
          practice_areas: data.especialidade ? [data.especialidade as any] : [],
          avatar_color: 'blue',
          avatar_initials: data.nome
            ? data.nome
                .split(' ')
                .map((n: string) => n[0])
                .join('')
                .toUpperCase()
            : 'U',
        };

        setCurrentUser(profile);
        localStorage.setItem('whp_current_user', JSON.stringify(profile));
        setError(null);
      }
    } catch (err) {
      console.error('Erro ao buscar perfil:', err);
      setCurrentUser(null);
      setError('Erro ao carregar perfil do usuário');
    }
  }, []);

  // ✅ CORREÇÃO 1: Tratamento robusto de sessão no boot
  useEffect(() => {
    const checkSession = async () => {
      try {
        setLoading(true);
        setError(null);

        // ✅ CORREÇÃO 2: Validar objeto error retornado por getSession()
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        // ✅ CORREÇÃO 3: Tratamento específico para erro 400 (refresh_token inválido)
        if (sessionError) {
          console.error('Erro ao recuperar sessão:', sessionError);
          
          // Se erro 400, significa que o refresh_token é inválido
          if (sessionError.status === 400) {
            console.warn('Refresh token inválido ou expirado. Limpando sessão...');
            // Limpar localStorage e fazer logout
            localStorage.removeItem('whp_current_user');
            await supabase.auth.signOut();
            setCurrentUser(null);
            setError('Sua sessão expirou. Por favor, faça login novamente.');
            setLoading(false);
            return;
          }
          
          // Para outros erros, tentar fallback de localStorage
          const stored = localStorage.getItem('whp_current_user');
          if (stored) {
            try {
              setCurrentUser(JSON.parse(stored));
              setError(null);
            } catch (parseError) {
              console.error('Erro ao parsear localStorage:', parseError);
              localStorage.removeItem('whp_current_user');
              setCurrentUser(null);
              setError('Erro ao recuperar dados de sessão');
            }
          }
          setLoading(false);
          return;
        }

        // ✅ CORREÇÃO 4: Se sessão válida, buscar perfil
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          // ✅ CORREÇÃO 5: Fallback para localStorage se não houver sessão
          const stored = localStorage.getItem('whp_current_user');
          if (stored) {
            try {
              const parsedUser = JSON.parse(stored);
              setCurrentUser(parsedUser);
              setError(null);
            } catch (parseError) {
              console.error('Erro ao parsear localStorage:', parseError);
              localStorage.removeItem('whp_current_user');
              setCurrentUser(null);
            }
          }
        }

        setLoading(false);
      } catch (err) {
        console.error('Erro crítico ao verificar sessão:', err);
        setError('Erro ao verificar sessão. Por favor, recarregue a página.');
        setCurrentUser(null);
        setLoading(false);
      }
    };

    checkSession();

    // ✅ CORREÇÃO 6: onAuthStateChange para ouvir mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[AUTH STATE CHANGE]', event);

        if (event === 'SIGNED_IN' && session?.user) {
          await fetchProfile(session.user.id);
          logLogin(session.user.id, session.user.email || '');
        } else if (event === 'SIGNED_OUT') {
          if (currentUser) {
            logLogout(currentUser.id, currentUser.email);
          }
          setCurrentUser(null);
          localStorage.removeItem('whp_current_user');
          setError(null);
        } else if (event === 'TOKEN_REFRESHED') {
          // ✅ CORREÇÃO 7: Tratar refresh de token com sucesso
          console.log('[TOKEN REFRESHED] Sessão renovada com sucesso');
          setError(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (loginError) {
        console.error('Erro ao fazer login:', loginError);
        setError(loginError.message || 'Erro ao fazer login');
        return { error: loginError };
      }

      // ✅ CORREÇÃO 8: Buscar perfil após login bem-sucedido
      if (data.user) {
        await fetchProfile(data.user.id);
      }

      return { error: null };
    } catch (err) {
      console.error('Erro crítico ao fazer login:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao fazer login';
      setError(errorMessage);
      return { error: err };
    }
  };

  const logout = async () => {
    try {
      setError(null);
      if (currentUser) {
        logLogout(currentUser.id, currentUser.email);
      }
      await supabase.auth.signOut();
      setCurrentUser(null);
      localStorage.removeItem('whp_current_user');
    } catch (err) {
      console.error('Erro ao fazer logout:', err);
      setError('Erro ao fazer logout');
      // Mesmo com erro, limpar estado local
      setCurrentUser(null);
      localStorage.removeItem('whp_current_user');
    }
  };

  const isAdmin = useCallback(() => currentUser?.role === 'admin', [currentUser]);

  const clearError = useCallback(() => setError(null), []);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        error,
        login,
        logout,
        isAdmin,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
}