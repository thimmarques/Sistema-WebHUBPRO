import React, { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { UserProfile } from '@/types';
import { supabase } from '@/lib/supabase';
import { logLogin, logLogout } from '../services/activityLogger';

interface AuthContextType {
  currentUser: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error: any | null }>;
  logout: () => Promise<void>;
  isAdmin: () => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      if (data) {
        const profile: UserProfile = {
          id: data.id,
          name: data.nome,
          email: data.email,
          oab: data.oab || '',
          role: data.role,
          practice_areas: data.especialidade ? [data.especialidade as any] : [],
          avatar_color: 'blue', // Default color, since profile doesn't have it
          avatar_initials: data.nome ? data.nome.split(' ').map((n: string) => n[0]).join('').toUpperCase() : 'U'
        };
        setCurrentUser(profile);
        localStorage.setItem('whp_current_user', JSON.stringify(profile));
      }
    } catch (err) {
      console.error('Erro ao buscar perfil:', err);
      setCurrentUser(null);
    }
  }, []);

  useEffect(() => {
    // Check current session on mount
    const checkSession = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        const stored = localStorage.getItem('whp_current_user');
        if (stored) {
          setCurrentUser(JSON.parse(stored));
        }
      }
      setLoading(false);
    };

    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        await fetchProfile(session.user.id);
        logLogin(session.user.id, session.user.email || '');
      } else if (event === 'SIGNED_OUT') {
        if (currentUser) {
          logLogout(currentUser.id, currentUser.email);
        }
        setCurrentUser(null);
        localStorage.removeItem('whp_current_user');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const isAdmin = useCallback(() => currentUser?.role === 'admin', [currentUser]);

  return (
    <AuthContext.Provider value={{ currentUser, loading, login, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
