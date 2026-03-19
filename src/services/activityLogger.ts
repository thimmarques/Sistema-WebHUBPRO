import { supabase } from '../lib/supabase';
import { Atividade, TipoAtividade } from '../types/atividade';

export type { Atividade, TipoAtividade };

export const Descriptions = {
  CLIENTE_CRIADO: 'Cliente criado',
  CLIENTE_ATUALIZADO: 'Cliente atualizado',
  CLIENTE_DELETADO: 'Cliente deletado',
  PROCESSO_CRIADO: 'Processo criado',
  PROCESSO_ATUALIZADO: 'Processo atualizado',
  PROCESSO_DELETADO: 'Processo deletado',
  EVENTO_CRIADO: 'Evento criado',
  EVENTO_ATUALIZADO: 'Evento atualizado',
  EVENTO_DELETADO: 'Evento deletado',
  LANCAMENTO_CRIADO: 'Lançamento criado',
  LANCAMENTO_ATUALIZADO: 'Lançamento atualizado',
  LANCAMENTO_DELETADO: 'Lançamento deletado',
  LOGIN: 'Usuário fez login',
  LOGOUT: 'Usuário fez logout',
  RELATORIO_EXPORTADO: 'Relatório exportado',
  DADOS_IMPORTADOS: 'Dados importados',
} as const;

/**
 * Registra uma atividade genérica no sistema
 * @param usuarioId ID do usuário que realizou a ação
 * @param tipo Tipo de atividade (create, read, update, delete, etc.)
 * @param entidade Nome da entidade afetada (cliente, processo, etc.)
 * @param entidadeId ID da entidade afetada
 * @param descricao Descrição da atividade
 * @param dadosAntigos Dados anteriores (para UPDATE)
 * @param dadosNovos Dados novos (para UPDATE)
 */
export async function logActivity(
  usuarioId: string,
  tipo: TipoAtividade,
  entidade: string,
  entidadeId: string,
  descricao: string,
  dadosAntigos?: Record<string, any>,
  dadosNovos?: Record<string, any>
): Promise<void> {
  try {
    const atividade: Atividade = {
      id: `atividade-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      usuario_id: usuarioId,
      tipo,
      entidade,
      entidade_id: entidadeId,
      descricao,
      dados_antigos: dadosAntigos,
      dados_novos: dadosNovos,
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      timestamp: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    // TODO: Implementar INSERT em tabela 'atividades' do Supabase
    // const { error } = await supabase
    //   .from('atividades')
    //   .insert([atividade]);
    // if (error) console.error('Erro ao registrar atividade:', error);

    // Por enquanto, apenas log no console
    console.log('[ACTIVITY LOG]', atividade);
  } catch (error) {
    console.error('Erro ao registrar atividade:', error);
    // Não deve bloquear a operação principal
  }
}

/**
 * Registra a criação de uma entidade
 */
export async function logCreate(
  usuarioId: string,
  entidade: string,
  entidadeId: string,
  dados: Record<string, any>,
  descricao?: string
): Promise<void> {
  await logActivity(
    usuarioId,
    'create',
    entidade,
    entidadeId,
    descricao || `${entidade} criado`,
    undefined,
    dados
  );
}

/**
 * Registra a atualização de uma entidade
 */
export async function logUpdate(
  usuarioId: string,
  entidade: string,
  entidadeId: string,
  dadosAntigos: Record<string, any>,
  dadosNovos: Record<string, any>,
  descricao?: string
): Promise<void> {
  // Calcular apenas os campos que mudaram
  const camposAlterados: Record<string, any> = {};
  for (const key in dadosNovos) {
    if (dadosAntigos[key] !== dadosNovos[key]) {
      camposAlterados[key] = {
        antes: dadosAntigos[key],
        depois: dadosNovos[key],
      };
    }
  }

  await logActivity(
    usuarioId,
    'update',
    entidade,
    entidadeId,
    descricao || `${entidade} atualizado`,
    dadosAntigos,
    dadosNovos
  );
}

/**
 * Registra a deleção de uma entidade (soft delete)
 */
export async function logDelete(
  usuarioId: string,
  entidade: string,
  entidadeId: string,
  dados: Record<string, any>,
  descricao?: string
): Promise<void> {
  await logActivity(
    usuarioId,
    'delete',
    entidade,
    entidadeId,
    descricao || `${entidade} deletado`,
    dados,
    { deleted_at: new Date().toISOString() }
  );
}

/**
 * Registra login do usuário
 */
export async function logLogin(usuarioId: string, email: string): Promise<void> {
  await logActivity(
    usuarioId,
    'login',
    'usuario',
    usuarioId,
    `Login realizado: ${email}`
  );
}

/**
 * Registra logout do usuário
 */
export async function logLogout(usuarioId: string, email: string): Promise<void> {
  await logActivity(
    usuarioId,
    'logout',
    'usuario',
    usuarioId,
    `Logout realizado: ${email}`
  );
}

/**
 * Registra exportação de relatório
 */
export async function logExport(
  usuarioId: string,
  tipoRelatorio: string,
  descricao?: string
): Promise<void> {
  await logActivity(
    usuarioId,
    'export',
    'relatorio',
    `relatorio-${tipoRelatorio}`,
    descricao || `Relatório ${tipoRelatorio} exportado`
  );
}

/**
 * Registra importação de dados
 */
export async function logImport(
  usuarioId: string,
  tipoImportacao: string,
  quantidadeRegistros: number,
  descricao?: string
): Promise<void> {
  await logActivity(
    usuarioId,
    'import',
    'importacao',
    `importacao-${tipoImportacao}`,
    descricao || `${quantidadeRegistros} registros importados (${tipoImportacao})`
  );
}
