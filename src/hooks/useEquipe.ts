import { useState, useEffect, useCallback } from 'react';
import { UserProfile } from '../types';
import { supabase } from '../lib/supabase';

export function useEquipe() {
  const [membros, setMembros] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_active', true)
        .is('deleted_at', null)
        .order('nome', { ascending: true });

      if (err) throw err;

      const profiles: UserProfile[] = (data || []).map(d => ({
        id: d.id,
        name: d.nome,
        email: d.email,
        oab: d.oab || '',
        role: d.role,
        practice_areas: d.especialidade ? [d.especialidade as any] : [],
        avatar_color: 'blue',
        avatar_initials: d.nome ? d.nome.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) : 'U'
      }));

      setMembros(profiles);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar equipe';
      setError(message);
      console.error('Erro ao carregar equipe:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return {
    membros,
    loading,
    error,
    reload: load
  };
}
