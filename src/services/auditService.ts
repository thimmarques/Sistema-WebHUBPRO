import { supabase } from '../lib/supabase';
import { Atividade } from './activityLogger';

export interface FiltrosAuditoria {
  usuario_id?: string;
  entidade?: string;
  entidade_id?: string;
  tipo?: string;
  data_inicio?: string;
  data_fim?: string;
  limite?: number;
}

export interface ResumoAuditoria {
  total_atividades: number;
  atividades_por_tipo: Record<string, number>;
  atividades_por_entidade: Record<string, number>;
  usuarios_ativos: number;
  periodo: {
    inicio: string;
    fim: string;
  };
}

/**
 * Obtém log de auditoria com filtros e validação de permissões
 * @param filtros Filtros para busca
 * @param currentUserId ID do usuário atual
 * @param userRole Role do usuário (admin, advogado, estagiario)
 */
export async function getAuditLog(
  filtros: FiltrosAuditoria,
  currentUserId: string,
  userRole: string
): Promise<Atividade[]> {
  try {
    // RBAC: Validar permissões
    if (userRole !== 'admin') {
      // Advogados e estagiários veem apenas seus próprios logs
      filtros.usuario_id = currentUserId;
    }

    // TODO: Implementar SELECT da tabela 'atividades' com filtros
    // let query = supabase
    //   .from('atividades')
    //   .select('*')
    //   .order('created_at', { ascending: false });

    // if (filtros.usuario_id) {
    //   query = query.eq('usuario_id', filtros.usuario_id);
    // }
    // if (filtros.entidade) {
    //   query = query.eq('entidade', filtros.entidade);
    // }
    // if (filtros.entidade_id) {
    //   query = query.eq('entidade_id', filtros.entidade_id);
    // }
    // if (filtros.tipo) {
    //   query = query.eq('tipo', filtros.tipo);
    // }
    // if (filtros.data_inicio) {
    //   query = query.gte('created_at', filtros.data_inicio);
    // }
    // if (filtros.data_fim) {
    //   query = query.lte('created_at', filtros.data_fim);
    // }
    // if (filtros.limite) {
    //   query = query.limit(filtros.limite);
    // }

    // const { data, error } = await query;
    // if (error) throw error;
    // return data || [];

    // Por enquanto, retornar array vazio
    console.log('[AUDIT LOG] Buscando com filtros:', filtros);
    return [];
  } catch (error) {
    console.error('Erro ao buscar log de auditoria:', error);
    return [];
  }
}

/**
 * Obtém log de auditoria de um usuário específico
 */
export async function getAuditByUser(
  usuarioId: string,
  currentUserId: string,
  userRole: string,
  limite: number = 100
): Promise<Atividade[]> {
  // RBAC: Apenas admin ou o próprio usuário pode ver seu log
  if (userRole !== 'admin' && currentUserId !== usuarioId) {
    console.warn('Acesso negado ao log de auditoria do usuário:', usuarioId);
    return [];
  }

  return getAuditLog(
    { usuario_id: usuarioId, limite },
    currentUserId,
    userRole
  );
}

/**
 * Obtém log de auditoria de uma entidade específica
 */
export async function getAuditByEntity(
  entidade: string,
  entidadeId: string,
  currentUserId: string,
  userRole: string,
  limite: number = 100
): Promise<Atividade[]> {
  return getAuditLog(
    { entidade, entidade_id: entidadeId, limite },
    currentUserId,
    userRole
  );
}

/**
 * Obtém resumo de auditoria (apenas para ADMIN)
 */
export async function getAuditSummary(
  currentUserId: string,
  userRole: string,
  dataInicio?: string,
  dataFim?: string
): Promise<ResumoAuditoria | null> {
  try {
    // RBAC: Apenas admin pode ver resumo completo
    if (userRole !== 'admin') {
      console.warn('Acesso negado ao resumo de auditoria');
      return null;
    }

    // TODO: Implementar agregações no Supabase
    // const { data, error } = await supabase
    //   .from('atividades')
    //   .select('tipo, entidade, usuario_id')
    //   .gte('created_at', dataInicio || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    //   .lte('created_at', dataFim || new Date().toISOString());

    // if (error) throw error;

    // Calcular resumo
    const resumo: ResumoAuditoria = {
      total_atividades: 0,
      atividades_por_tipo: {},
      atividades_por_entidade: {},
      usuarios_ativos: 0,
      periodo: {
        inicio: dataInicio || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        fim: dataFim || new Date().toISOString(),
      },
    };

    // TODO: Preencher resumo com dados reais

    console.log('[AUDIT SUMMARY]', resumo);
    return resumo;
  } catch (error) {
    console.error('Erro ao gerar resumo de auditoria:', error);
    return null;
  }
}

/**
 * Exporta log de auditoria em formato CSV (apenas para ADMIN)
 */
export async function exportAuditLog(
  currentUserId: string,
  userRole: string,
  filtros?: FiltrosAuditoria
): Promise<string | null> {
  try {
    // RBAC: Apenas admin pode exportar
    if (userRole !== 'admin') {
      console.warn('Acesso negado à exportação de auditoria');
      return null;
    }

    const atividades = await getAuditLog(filtros || {}, currentUserId, userRole);

    if (atividades.length === 0) {
      return null;
    }

    // Converter para CSV
    const headers = ['ID', 'Usuário', 'Tipo', 'Entidade', 'Entidade ID', 'Descrição', 'Data'];
    const rows = atividades.map(a => [
      a.id,
      a.usuario_id,
      a.tipo,
      a.entidade,
      a.entidade_id,
      a.descricao,
      a.created_at,
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    return csv;
  } catch (error) {
    console.error('Erro ao exportar log de auditoria:', error);
    return null;
  }
}

/**
 * Obtém estatísticas de atividade por período
 */
export async function getActivityStats(
  dataInicio: string,
  dataFim: string,
  currentUserId: string,
  userRole: string
): Promise<Record<string, number> | null> {
  try {
    const atividades = await getAuditLog(
      { data_inicio: dataInicio, data_fim: dataFim },
      currentUserId,
      userRole
    );

    const stats: Record<string, number> = {};

    atividades.forEach(a => {
      const chave = `${a.entidade}_${a.tipo}`;
      stats[chave] = (stats[chave] || 0) + 1;
    });

    return stats;
  } catch (error) {
    console.error('Erro ao obter estatísticas de atividade:', error);
    return null;
  }
}
