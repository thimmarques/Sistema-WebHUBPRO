import { useState, useEffect, useCallback, useMemo } from 'react';
import { Processo } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { usePermissions } from './usePermissions';

export function useProcessos(clienteId?: string) {
  const { currentUser } = useAuth();
  const { role, currentScope } = usePermissions();
  
  const [processos, setProcessos] = useState<Processo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filtrar processos baseado em permissões
  const processosFiltrados = useMemo(() => {
    let filtered = processos;
    
    // RBAC: Filtrar por escopo de acesso
    if (role === 'advogado') {
      // Advogado vê apenas processos onde é responsável ou criador
      filtered = filtered.filter(p => 
        p.responsible_id === currentUser?.id || 
        p.created_by === currentUser?.id
      );
    } else if (role === 'estagiario') {
      // Estagiário vê apenas o que criou
      filtered = filtered.filter(p => 
        p.created_by === currentUser?.id
      );
    }
    
    // Filtrar por clienteId se fornecido
    if (clienteId) {
      filtered = filtered.filter(p => p.polo_ativo_id === clienteId);
    }
    
    return filtered;
  }, [processos, clienteId, role, currentUser?.id]);

  // Carregar processos do Supabase
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from('processos')
        .select('*')
        .is('deleted_at', null) // Excluir soft-deleted
        .order('created_at', { ascending: false });

      // Filtrar por clienteId se fornecido
      if (clienteId) {
        query = query.eq('cliente_id', clienteId);
      }

      const { data, error: err } = await query;

      if (err) {
        throw err;
      }

      setProcessos(data || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar processos';
      setError(message);
      console.error('Erro ao carregar processos:', err);
      setProcessos([]);
    } finally {
      setLoading(false);
    }
  }, [clienteId]);

  // Carregar dados ao montar ou quando clienteId mudar
  useEffect(() => {
    load();
  }, [load]);

  // Salvar processo (CREATE ou UPDATE)
  const saveProcesso = useCallback(async (processo: Processo) => {
    try {
      if (!currentUser?.id) {
        throw new Error('Usuário não autenticado');
      }

      const processoData = {
        ...processo,
        updated_at: new Date().toISOString(),
        responsible_id: currentUser.id,
      };

      // Se é novo (não tem ID ou ID começa com 'processo-')
      if (!processo.id || processo.id.startsWith('processo-')) {
        // INSERT
        const { data, error: err } = await supabase
          .from('processos')
          .insert([{
            ...processoData,
            id: undefined, // Deixar BD gerar ID
            created_at: new Date().toISOString(),
            created_by: currentUser.id,
          }])
          .select()
          .single();

        if (err) throw err;
        
        // Atualizar estado local
        setProcessos(prev => [data, ...prev]);
        return data;
      } else {
        // UPDATE
        const { data, error: err } = await supabase
          .from('processos')
          .update(processoData)
          .eq('id', processo.id)
          .select()
          .single();

        if (err) throw err;
        
        // Atualizar estado local
        setProcessos(prev => prev.map(p => p.id === processo.id ? data : p));
        return data;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao salvar processo';
      setError(message);
      console.error('Erro ao salvar processo:', err);
      throw err;
    }
  }, [currentUser?.id]);

  // Deletar processo (soft delete)
  const deleteProcesso = useCallback(async (id: string) => {
    try {
      if (!currentUser?.id) {
        throw new Error('Usuário não autenticado');
      }

      const { error: err } = await supabase
        .from('processos')
        .update({ 
          deleted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (err) throw err;
      
      // Atualizar estado local
      setProcessos(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao deletar processo';
      setError(message);
      console.error('Erro ao deletar processo:', err);
      throw err;
    }
  }, [currentUser?.id]);

  const getProcessoById = useCallback((id: string) => {
    return processos.find(p => p.id === id);
  }, [processos]);

  return {
    processos: processosFiltrados,
    loading,
    error,
    saveProcesso,
    deleteProcesso,
    getProcessoById,
    reload: load,
  };
}
