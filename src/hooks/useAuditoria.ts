import { useState, useEffect, useCallback, useMemo } from 'react';
import { Atividade } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { usePermissions } from './usePermissions';
import { FiltrosAuditoria, AuditoriaDetalhes, AuditoriaResumo } from '../types/auditoria';

export function useAuditoria(clienteId?: string, processoId?: string) {
  const { currentUser } = useAuth();
  const { role, currentScope } = usePermissions();
  
  const [atividades, setAtividades] = useState<Atividade[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filtrar atividades baseado em permissões
  const atividadesFiltradas = useMemo(() => {
    let filtered = atividades;
    
    // RBAC: Apenas admin vê tudo, outros veem apenas seus logs
    if (role !== 'admin') {
      filtered = filtered.filter(a => a.created_by === currentUser?.id);
    }
    
    // Filtrar por clienteId se fornecido
    if (clienteId) {
      filtered = filtered.filter(a => 
        a.tabela === 'clientes' && a.registro_id === clienteId
      );
    }
    
    // Filtrar por processoId se fornecido
    if (processoId) {
      filtered = filtered.filter(a => 
        a.tabela === 'processos' && a.registro_id === processoId
      );
    }
    
    // Ordenar por data decrescente (mais recentes primeiro)
    return filtered.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [atividades, clienteId, processoId, role, currentUser?.id]);

  // Carregar atividades do Supabase
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from('atividades')
        .select(`
          *,
          profiles:created_by (nome)
        `)
        .order('created_at', { ascending: false });

      // Filtrar por clienteId se fornecido
      if (clienteId) {
        query = query.eq('tabela', 'clientes').eq('registro_id', clienteId);
      }
      
      // Filtrar por processoId se fornecido
      if (processoId) {
        query = query.eq('tabela', 'processos').eq('registro_id', processoId);
      }

      const { data, error: err } = await query;

      if (err) {
        throw err;
      }

      const formattedData = (data || []).map((a: any) => ({
        ...a,
        usuario_nome: a.profiles?.nome
      }));

      setAtividades(formattedData);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar auditoria';
      setError(message);
      console.error('Erro ao carregar auditoria:', err);
      setAtividades([]);
    } finally {
      setLoading(false);
    }
  }, [clienteId, processoId]);

  // Carregar dados ao montar ou quando clienteId/processoId mudar
  useEffect(() => {
    load();
  }, [load]);

  // Obter atividades por usuário
  const getAtividadesPorUsuario = useCallback((usuarioId: string) => {
    if (role !== 'admin' && currentUser?.id !== usuarioId) {
      return [];
    }
    return atividades.filter(a => a.created_by === usuarioId);
  }, [atividades, role, currentUser?.id]);

  // Obter atividades por tipo
  const getAtividadesPorTipo = useCallback((tipo: string) => {
    return atividades.filter(a => a.tipo === tipo);
  }, [atividades]);

  // Obter atividades por data
  const getAtividadesPorData = useCallback((dataInicio: string, dataFim: string) => {
    return atividades.filter(a => {
      const data = new Date(a.created_at);
      return data >= new Date(dataInicio) && data <= new Date(dataFim);
    });
  }, [atividades]);

  // Registrar atividade
  const logAtividade = useCallback(async (atividade: Partial<Atividade>) => {
    try {
      if (!currentUser?.id) return;

      const { data, error: err } = await supabase
        .from('atividades')
        .insert([{
          ...atividade,
          created_by: atividade.created_by || currentUser.id,
          created_at: new Date().toISOString(),
        }])
        .select(`
          *,
          profiles:created_by (nome)
        `)
        .single();

      if (err) throw err;
      
      const formatted = {
        ...data,
        usuario_nome: data.profiles?.nome
      };
      
      setAtividades(prev => [formatted, ...prev]);
      return formatted;
    } catch (err) {
      console.error('Erro ao registrar auditoria:', err);
      throw err;
    }
  }, [currentUser?.id]);

  // Deletar atividade (se necessário)
  const deleteAtividade = useCallback(async (id: string) => {
    try {
      const { error: err } = await supabase
        .from('atividades')
        .delete()
        .eq('id', id);

      if (err) throw err;
      
      setAtividades(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      console.error('Erro ao deletar auditoria:', err);
      throw err;
    }
  }, []);

  // ✅ NOVO: Buscar logs com filtros avançados
  const getAuditLogWithFilters = useCallback(
    async (filtros?: FiltrosAuditoria) => {
      try {
        setLoading(true);
        setError(null);

        let query = supabase
          .from('atividades')
          .select('*')
          .order('created_at', { ascending: false });

        if (filtros?.usuario) {
          query = query.eq('usuario_id', filtros.usuario);
        }

        if (filtros?.entidade) {
          query = query.eq('entidade', filtros.entidade);
        }

        if (filtros?.tipo) {
          query = query.eq('tipo', filtros.tipo);
        }

        if (filtros?.dataInicio && filtros?.dataFim) {
          query = query.gte('created_at', filtros.dataInicio).lte('created_at', filtros.dataFim);
        }

        if (filtros?.busca) {
          query = query.ilike('descricao', `%${filtros.busca}%`);
        }

        const { data, error: fetchError } = await query;

        if (fetchError) throw fetchError;

        setLoading(false);
        return { success: true, data: data as AuditoriaDetalhes[] };
      } catch (err) {
        console.error('Erro ao buscar logs com filtros:', err);
        setError('Erro ao buscar logs');
        setLoading(false);
        return { success: false, error: err instanceof Error ? err.message : 'Erro desconhecido' };
      }
    },
    []
  );

  // ✅ NOVO: Buscar resumo de auditoria
  const getAuditoriaResumo = useCallback(async (): Promise<AuditoriaResumo | null> => {
    try {
      const { data, error } = await supabase
        .from('atividades')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const hoje = new Date();
      const inicioSemana = new Date(hoje);
      inicioSemana.setDate(hoje.getDate() - 7);

      const logsHoje =
        data?.filter((log) => {
          const logDate = new Date(log.created_at);
          return logDate.toDateString() === hoje.toDateString();
        }).length || 0;

      const logsEstaSemanA =
        data?.filter((log) => {
          const logDate = new Date(log.created_at);
          return logDate >= inicioSemana && logDate <= hoje;
        }).length || 0;

      // Usuários mais ativos
      const usuariosMap = new Map<string, number>();
      data?.forEach((log) => {
        const count = usuariosMap.get(log.usuario_id) || 0;
        usuariosMap.set(log.usuario_id, count + 1);
      });

      const usuariosMaisAtivos = Array.from(usuariosMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([usuarioId, total]) => ({
          usuarioId,
          usuarioNome: usuarioId, // TODO: Buscar nome do usuário
          totalAcoes: total,
        }));

      // Entidades mais alteradas
      const entidadesMap = new Map<string, number>();
      data?.forEach((log) => {
        const count = entidadesMap.get(log.entidade) || 0;
        entidadesMap.set(log.entidade, count + 1);
      });

      const entidadesMaisAlteradas = Array.from(entidadesMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([entidade, total]) => ({
          entidade,
          totalAlteracoes: total,
        }));

      // Tipos de ação mais frequentes
      const tiposMap = new Map<string, number>();
      data?.forEach((log) => {
        const count = tiposMap.get(log.tipo) || 0;
        tiposMap.set(log.tipo, count + 1);
      });

      const tiposAcaoMaisFrequentes = Array.from(tiposMap.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([tipo, total]) => ({
          tipo,
          total,
        }));

      return {
        totalLogs: data?.length || 0,
        logsHoje,
        logsEstaSemanA,
        usuariosMaisAtivos,
        entidadesMaisAlteradas,
        tiposAcaoMaisFrequentes,
      };
    } catch (err) {
      console.error('Erro ao buscar resumo de auditoria:', err);
      return null;
    }
  }, []);

  return {
    atividades: atividadesFiltradas,
    loading,
    error,
    // Funções originais (compatibilidade)
    getAtividadesPorUsuario,
    getAtividadesPorTipo,
    getAtividadesPorData,
    logAtividade,
    deleteAtividade,
    reload: load,
    // Aliases para compatibilidade com Fase 2
    getAuditLog: load,
    getAuditLogByEntity: (entidade: string) => getAuditLogWithFilters({ entidade }),
    getAuditLogByUser: (usuario: string) => getAuditLogWithFilters({ usuario }),
    // ✅ NOVO: Funções expandidas
    getAuditLogWithFilters,
    getAuditoriaResumo,
    refetch: load,
  };
}
