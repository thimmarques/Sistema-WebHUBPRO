import { useState, useEffect, useCallback, useMemo } from 'react';
import { Processo } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { usePermissions } from './usePermissions';
import { logPhaseChange, logEncerramento } from '@/services/activityLogger';

// ✅ NOVO: Validar transições de fase permitidas
const validateFaseTransition = (
  faseAntiga: string,
  faseNova: string
): { valid: boolean; message: string } => {
  const allowedTransitions: Record<string, string[]> = {
    ativo: ['sentenciado', 'encerrado'],
    sentenciado: ['encerrado'],
    encerrado: [], // Encerrado é final
  };

  if (!allowedTransitions[faseAntiga]?.includes(faseNova)) {
    return {
      valid: false,
      message: `Transição de ${faseAntiga} para ${faseNova} não é permitida`,
    };
  }

  return { valid: true, message: 'Transição permitida' };
};

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

  // ✅ NOVO: Alterar fase do processo
  const changeProcessoPhase = useCallback(
    async (processoId: string, newFase: string) => {
      try {
        if (!currentUser) throw new Error('Usuário não autenticado');

        // Validar que processo existe
        const processoAtual = processos.find((p) => p.id === processoId);
        if (!processoAtual) throw new Error('Processo não encontrado');

        // Validar transição de fase
        const validation = validateFaseTransition(processoAtual.fase, newFase);
        if (!validation.valid) {
          return { success: false, error: validation.message };
        }

        // Atualizar fase no BD
        const { error: updateError } = await supabase
          .from('processos')
          .update({
            fase: newFase,
            updated_at: new Date().toISOString(),
          })
          .eq('id', processoId);

        if (updateError) throw updateError;

        // Registrar auditoria
        await logPhaseChange(currentUser.id, processoId, processoAtual.fase, newFase);

        // Atualizar estado local
        setProcessos((prev) =>
          prev.map((p) => (p.id === processoId ? { ...p, fase: newFase } : p))
        );

        return { success: true };
      } catch (err) {
        console.error('Erro ao alterar fase do processo:', err);
        return { success: false, error: err instanceof Error ? err.message : 'Erro desconhecido' };
      }
    },
    [processos, currentUser]
  );

  // ✅ NOVO: Encerrar processo com resultado
  const encerrarProcesso = useCallback(
    async (processoId: string, resultado: string, observacoes?: string) => {
      try {
        if (!currentUser) throw new Error('Usuário não autenticado');

        // Validar que processo existe
        const processoAtual = processos.find((p) => p.id === processoId);
        if (!processoAtual) throw new Error('Processo não encontrado');

        // Validar que processo está em fase "Sentenciado"
        if (processoAtual.fase !== 'sentenciado' && processoAtual.fase !== 'ativo') {
          return { success: false, error: 'Processo deve estar em fase Ativo ou Sentenciado para ser encerrado' };
        }

        // Atualizar processo no BD
        const { error: updateError } = await supabase
          .from('processos')
          .update({
            fase: 'encerrado',
            resultado: resultado,
            data_encerramento: new Date().toISOString(),
            observacoes: observacoes || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', processoId);

        if (updateError) throw updateError;

        // Registrar auditoria
        await logEncerramento(currentUser.id, processoId, resultado, observacoes);

        // Atualizar estado local
        setProcessos((prev) =>
          prev.map((p) =>
            p.id === processoId
              ? {
                  ...p,
                  fase: 'encerrado',
                  resultado: resultado,
                  data_encerramento: new Date().toISOString(),
                }
              : p
          )
        );

        return { success: true };
      } catch (err) {
        console.error('Erro ao encerrar processo:', err);
        return { success: false, error: err instanceof Error ? err.message : 'Erro desconhecido' };
      }
    },
    [processos, currentUser]
  );

  const getProcessoById = useCallback((id: string) => {
    return processos.find(p => p.id === id);
  }, [processos]);

  return {
    processos: processosFiltrados,
    loading,
    error,
    saveProcesso,
    deleteProcesso,
    changeProcessoPhase,    // ✅ NOVO
    encerrarProcesso,       // ✅ NOVO
    getProcessoById,
    refetch: load,
  };
}
