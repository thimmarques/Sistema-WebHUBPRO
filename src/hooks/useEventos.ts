import { useState, useEffect, useCallback, useMemo } from 'react';
import { Evento } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { usePermissions } from './usePermissions';

export function useEventos(processoId?: string, clienteId?: string) {
  const { currentUser } = useAuth();
  const { role, currentScope } = usePermissions();
  
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filtrar eventos baseado em permissões
  const eventosFiltrados = useMemo(() => {
    let filtered = eventos;
    
    // RBAC: Filtrar por escopo de acesso
    if (role === 'advogado') {
      // Advogado vê apenas eventos de processos que criou ou é responsável
      filtered = filtered.filter(e => 
        e.responsible_id === currentUser?.id || 
        e.created_by === currentUser?.id
      );
    } else if (role === 'estagiario') {
      // Estagiário vê apenas eventos que ele criou (simplificado por enquanto)
      filtered = filtered.filter(e => e.created_by === currentUser?.id);
    }
    // Admin vê tudo
    
    // Filtrar por clienteId se fornecido (e se não foi filtrado na query)
    if (clienteId) {
      filtered = filtered.filter(e => e.processo?.polo_ativo_id === clienteId);
    }
    
    // Ordenar por data
    return filtered.sort((a, b) => 
      new Date(a.data_inicio).getTime() - new Date(b.data_inicio).getTime()
    );
  }, [eventos, processoId, clienteId, role, currentUser?.id, currentScope]);

  // Carregar eventos do Supabase
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from('eventos')
        .select(`
          *,
          processo:processo_id (
            numero_processo,
            polo_ativo_id
          )
        `)
        .is('deleted_at', null) // Excluir soft-deleted
        .order('data_inicio', { ascending: true });

      // Filtrar por processoId se fornecido
      if (processoId) {
        query = query.eq('processo_id', processoId);
      }

      // Filtrar por clienteId se fornecido (via join)
      if (clienteId) {
        query = query.eq('processo.polo_ativo_id', clienteId);
      }

      const { data, error: err } = await query;

      if (err) {
        throw err;
      }

      const formattedData = (data || []).map((e: any) => ({
        ...e,
        processo_numero: e.processo?.numero_processo
      }));

      setEventos(formattedData);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar eventos';
      setError(message);
      console.error('Erro ao carregar eventos:', err);
      setEventos([]);
    } finally {
      setLoading(false);
    }
  }, [processoId]);

  // Carregar dados ao montar ou quando processoId mudar
  useEffect(() => {
    load();
  }, [load]);

  // Salvar evento (CREATE ou UPDATE)
  const saveEvento = useCallback(async (evento: Evento) => {
    try {
      if (!currentUser?.id) {
        throw new Error('Usuário não autenticado');
      }

      const eventoData = {
        ...evento,
        updated_at: new Date().toISOString(),
        responsible_id: currentUser.id,
      };

      // Se é novo
      if (!evento.id || evento.id.startsWith('evento-')) {
        // INSERT
        const { data, error: err } = await supabase
          .from('eventos')
          .insert([{
            ...eventoData,
            id: undefined,
            created_at: new Date().toISOString(),
            created_by: currentUser.id,
          }])
          .select()
          .single();

        if (err) throw err;
        
        setEventos(prev => [...prev, data].sort((a, b) => 
          new Date(a.data_inicio).getTime() - new Date(b.data_inicio).getTime()
        ));
        return data;
      } else {
        // UPDATE
        const { data, error: err } = await supabase
          .from('eventos')
          .update(eventoData)
          .eq('id', evento.id)
          .select()
          .single();

        if (err) throw err;
        
        setEventos(prev => prev.map(e => e.id === evento.id ? data : e));
        return data;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao salvar evento';
      setError(message);
      console.error('Erro ao salvar evento:', err);
      throw err;
    }
  }, [currentUser?.id]);

  // Deletar evento (soft delete)
  const deleteEvento = useCallback(async (id: string) => {
    try {
      if (!currentUser?.id) {
        throw new Error('Usuário não autenticado');
      }

      const { error: err } = await supabase
        .from('eventos')
        .update({ 
          deleted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (err) throw err;
      
      setEventos(prev => prev.filter(e => e.id !== id));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao deletar evento';
      setError(message);
      console.error('Erro ao deletar evento:', err);
      throw err;
    }
  }, [currentUser?.id]);

  return {
    eventos: eventosFiltrados,
    loading,
    error,
    saveEvento,
    deleteEvento,
    reload: load,
  };
}
