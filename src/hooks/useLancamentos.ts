import { useState, useEffect, useCallback, useMemo } from 'react';
import { Lancamento } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { usePermissions } from './usePermissions';
import { logReconciliacao } from '../services/activityLogger';
export function useLancamentos(clienteId?: string, processoId?: string) {
  const { currentUser } = useAuth();
  const { role, currentScope } = usePermissions();
  
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filtrar lançamentos baseado em permissões
  const lancamentosFiltrados = useMemo(() => {
    let filtered = lancamentos;
    
    // RBAC: Filtrar por escopo de acesso
    if (role === 'advogado') {
      // Advogado vê apenas lançamentos de clientes que criou ou é responsável
      filtered = filtered.filter(l => 
        l.responsible_id === currentUser?.id || 
        l.created_by === currentUser?.id
      );
    } else if (role === 'estagiario') {
      // Estagiário vê apenas lançamentos de clientes do seu advogado responsável
      filtered = filtered.filter(l => 
        l.responsible_id === currentUser?.id // No caso de ele ter criado
      );
    }
    // Admin vê tudo
    
    // Filtrar por clienteId se fornecido
    if (clienteId) {
      filtered = filtered.filter(l => l.cliente_id === clienteId);
    }
    
    // Filtrar por processoId se fornecido
    if (processoId) {
      filtered = filtered.filter(l => l.processo_id === processoId);
    }
    
    // Ordenar por vencimento decrescente
    return filtered.sort((a, b) => 
      new Date(b.vencimento).getTime() - new Date(a.vencimento).getTime()
    );
  }, [lancamentos, clienteId, processoId, role, currentUser?.id]);

  // Carregar lançamentos do Supabase
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from('lancamentos')
        .select('*')
        .is('deleted_at', null) // Excluir soft-deleted
        .order('vencimento', { ascending: false });

      // Filtrar por clienteId se fornecido
      if (clienteId) {
        query = query.eq('cliente_id', clienteId);
      }
      
      // Filtrar por processoId se fornecido
      if (processoId) {
        query = query.eq('processo_id', processoId);
      }

      const { data, error: err } = await query;

      if (err) {
        throw err;
      }

      setLancamentos(data || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar lançamentos';
      setError(message);
      console.error('Erro ao carregar lançamentos:', err);
      setLancamentos([]);
    } finally {
      setLoading(false);
    }
  }, [clienteId, processoId]);

  // Carregar dados ao montar ou quando clienteId/processoId mudar
  useEffect(() => {
    load();
  }, [load]);

  // Salvar lançamento (CREATE ou UPDATE)
  const saveLancamento = useCallback(async (lancamento: Lancamento) => {
    try {
      if (!currentUser?.id) {
        throw new Error('Usuário não autenticado');
      }

      const lancamentoData = {
        ...lancamento,
        updated_at: new Date().toISOString(),
        responsible_id: currentUser.id,
      };

      // Se é novo
      if (!lancamento.id || lancamento.id.startsWith('lancamento-')) {
        // INSERT
        const { data, error: err } = await supabase
          .from('lancamentos')
          .insert([{
            ...lancamentoData,
            id: undefined,
            created_at: new Date().toISOString(),
            created_by: currentUser.id,
          }])
          .select()
          .single();

        if (err) throw err;
        
        setLancamentos(prev => [data, ...prev]);
        return data;
      } else {
        // UPDATE
        const { data, error: err } = await supabase
          .from('lancamentos')
          .update(lancamentoData)
          .eq('id', lancamento.id)
          .select()
          .single();

        if (err) throw err;
        
        setLancamentos(prev => prev.map(l => l.id === lancamento.id ? data : l));
        return data;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao salvar lançamento';
      setError(message);
      console.error('Erro ao salvar lançamento:', err);
      throw err;
    }
  }, [currentUser?.id]);

  // ✅ NOVO: Reconciliar lançamento
  const reconciliarLancamento = useCallback(
    async (lancamentoId: string, statusReconciliacao: string, observacoes?: string) => {
      try {
        if (!currentUser) throw new Error('Usuário não autenticado');

        // Validar que lançamento existe
        const lancamentoAtual = lancamentos.find((l) => l.id === lancamentoId);
        if (!lancamentoAtual) throw new Error('Lançamento não encontrado');

        // Atualizar status de reconciliação no BD
        const { error: updateError } = await supabase
          .from('lancamentos')
          .update({
            status_reconciliacao: statusReconciliacao,
            data_reconciliacao: new Date().toISOString(),
            observacoes_reconciliacao: observacoes || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', lancamentoId);

        if (updateError) throw updateError;

        // Registrar auditoria
        await logReconciliacao(
          currentUser.id,
          lancamentoId,
          (lancamentoAtual as any).status_reconciliacao || 'pendente',
          statusReconciliacao,
          observacoes
        );

        // Atualizar estado local
        setLancamentos((prev) =>
          prev.map((l) =>
            l.id === lancamentoId
              ? {
                  ...l,
                  status_reconciliacao: statusReconciliacao,
                  data_reconciliacao: new Date().toISOString(),
                }
              : l
          )
        );

        return { success: true };
      } catch (err) {
        console.error('Erro ao reconciliar lançamento:', err);
        return { success: false, error: err instanceof Error ? err.message : 'Erro desconhecido' };
      }
    },
    [lancamentos, currentUser]
  );

  // ✅ NOVO: Atualizar lançamento
  const updateLancamento = useCallback(
    async (lancamentoId: string, updates: Record<string, any>) => {
      try {
        if (!currentUser) throw new Error('Usuário não autenticado');

        const lancamentoAtual = lancamentos.find((l) => l.id === lancamentoId);
        if (!lancamentoAtual) throw new Error('Lançamento não encontrado');

        const { error: updateError } = await supabase
          .from('lancamentos')
          .update({
            ...updates,
            updated_at: new Date().toISOString(),
          })
          .eq('id', lancamentoId);

        if (updateError) throw updateError;

        // Atualizar estado local
        setLancamentos((prev) =>
          prev.map((l) => (l.id === lancamentoId ? { ...l, ...updates } : l))
        );

        return { success: true };
      } catch (err) {
        console.error('Erro ao atualizar lançamento:', err);
        return { success: false, error: err instanceof Error ? err.message : 'Erro desconhecido' };
      }
    },
    [lancamentos, currentUser]
  );

  // Deletar lançamento (soft delete)
  const deleteLancamento = useCallback(async (id: string) => {
    try {
      if (!currentUser?.id) {
        throw new Error('Usuário não autenticado');
      }

      const { error: err } = await supabase
        .from('lancamentos')
        .update({ 
          deleted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (err) throw err;
      
      setLancamentos(prev => prev.filter(l => l.id !== id));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao deletar lançamento';
      setError(message);
      console.error('Erro ao deletar lançamento:', err);
      throw err;
    }
  }, [currentUser?.id]);

  return {
    lancamentos: lancamentosFiltrados,
    loading,
    error,
    saveLancamento,
    updateLancamento,        // ✅ NOVO
    deleteLancamento,
    reconciliarLancamento,   // ✅ NOVO
    reload: load,
  };
}
