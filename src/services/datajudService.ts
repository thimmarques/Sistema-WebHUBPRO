import axios from 'axios';
import { isValidProcessoCNJ, formatProcessoCNJ } from '../lib/cnj';
import { logActivity } from './activityLogger';

// Configuração da API CNJ (DataJud)
const DATAJUD_API_BASE = 'https://www.cnj.jus.br/programas-e-acoes/numeracao-unica/';
const DATAJUD_TIMEOUT = 10000; // 10 segundos
const DATAJUD_RATE_LIMIT = 10; // máximo 10 requisições por minuto

let requestCount = 0;
let lastResetTime = Date.now();

export interface DataJudProcesso {
  numero: string;
  ano: number;
  segmento: string;
  tribunal: string;
  origem: string;
  classe: string;
  assunto: string;
  data_distribuicao: string;
  juiz: string;
  tribunal_nome: string;
  movimentacoes: DataJudMovimentacao[];
}

export interface DataJudMovimentacao {
  data: string;
  descricao: string;
  tipo: string;
  complemento?: string;
}

export interface SyncLog {
  id: string;
  processo_id: string;
  numero_cnj: string;
  status: 'sucesso' | 'erro' | 'pendente';
  mensagem: string;
  dados_sincronizados?: Record<string, any>;
  timestamp: string;
  usuario_id: string;
}

/**
 * Valida rate limiting (máximo 10 requisições por minuto)
 */
function checkRateLimit(): boolean {
  const now = Date.now();
  const timeSinceReset = now - lastResetTime;

  // Reset a cada minuto
  if (timeSinceReset > 60000) {
    requestCount = 0;
    lastResetTime = now;
  }

  if (requestCount >= DATAJUD_RATE_LIMIT) {
    console.warn('[DATAJUD] Rate limit atingido. Aguarde antes de fazer nova requisição.');
    return false;
  }

  requestCount++;
  return true;
}

/**
 * Busca informações de um processo na API CNJ (DataJud)
 * @param numeroCNJ Número do processo no formato CNJ (0000000-00.0000.0.00.0000)
 * @returns Dados do processo ou null se não encontrado
 */
export async function searchProcesso(numeroCNJ: string): Promise<DataJudProcesso | null> {
  try {
    // Validar número CNJ
    if (!isValidProcessoCNJ(numeroCNJ)) {
      console.error('[DATAJUD] Número CNJ inválido:', numeroCNJ);
      return null;
    }

    // Verificar rate limit
    if (!checkRateLimit()) {
      throw new Error('Rate limit atingido. Aguarde antes de fazer nova requisição.');
    }

    // Limpar número (remover formatação)
    // const numeroLimpo = numeroCNJ.replace(/\D/g, '');

    // TODO: Implementar requisição real à API CNJ
    // const response = await axios.get(
    //   `${DATAJUD_API_BASE}/api/processo/${numeroLimpo}`,
    //   { timeout: DATAJUD_TIMEOUT }
    // );

    // Por enquanto, retornar dados mock
    console.log('[DATAJUD] Buscando processo:', formatProcessoCNJ(numeroCNJ));

    const mockProcesso: DataJudProcesso = {
      numero: numeroCNJ,
      ano: 2024,
      segmento: '8', // Justiça Federal
      tribunal: '01', // TRF 1ª Região
      origem: '0001',
      classe: '0001', // Ação Cível
      assunto: 'Direito do Trabalho',
      data_distribuicao: '2024-01-15',
      juiz: 'Juiz Designado',
      tribunal_nome: 'Tribunal Regional Federal da 1ª Região',
      movimentacoes: [
        {
          data: '2024-01-15',
          descricao: 'Distribuição do processo',
          tipo: 'distribuicao',
        },
        {
          data: '2024-02-20',
          descricao: 'Petição inicial recebida',
          tipo: 'petição',
        },
      ],
    };

    return mockProcesso;
  } catch (error) {
    console.error('[DATAJUD] Erro ao buscar processo:', error);
    return null;
  }
}

/**
 * Sincroniza dados de um processo com a API CNJ
 * @param processoId ID do processo no banco local
 * @param numeroCNJ Número do processo no formato CNJ
 * @param usuarioId ID do usuário que está sincronizando
 * @returns Log de sincronização
 */
export async function syncProcesso(
  processoId: string,
  numeroCNJ: string,
  usuarioId: string
): Promise<SyncLog> {
  const syncLog: SyncLog = {
    id: `sync-${Date.now()}`,
    processo_id: processoId,
    numero_cnj: numeroCNJ,
    status: 'pendente',
    mensagem: 'Sincronização iniciada',
    timestamp: new Date().toISOString(),
    usuario_id: usuarioId,
  };

  try {
    // Buscar dados do processo na API CNJ
    const dadosDataJud = await searchProcesso(numeroCNJ);

    if (!dadosDataJud) {
      syncLog.status = 'erro';
      syncLog.mensagem = 'Processo não encontrado na API CNJ';
      await logActivity(
        usuarioId,
        'update',
        'processo',
        processoId,
        `Sincronização com DataJud falhou: ${syncLog.mensagem}`
      );
      return syncLog;
    }

    // Mapear dados do DataJud para o formato local
    const dadosSincronizados = {
      numero_cnj: dadosDataJud.numero,
      tribunal: dadosDataJud.tribunal_nome,
      classe: dadosDataJud.classe,
      assunto: dadosDataJud.assunto,
      data_distribuicao: dadosDataJud.data_distribuicao,
      juiz: dadosDataJud.juiz,
      datajud_ultima_sincronizacao: new Date().toISOString(),
      datajud_status_sincronizacao: 'sucesso',
    };

    // TODO: Implementar UPDATE do processo no banco local
    // const { error } = await supabase
    //   .from('processos')
    //   .update(dadosSincronizados)
    //   .eq('id', processoId);

    syncLog.status = 'sucesso';
    syncLog.mensagem = 'Sincronização realizada com sucesso';
    syncLog.dados_sincronizados = dadosSincronizados;

    // Registrar em log de auditoria
    await logActivity(
      usuarioId,
      'update',
      'processo',
      processoId,
      `Sincronização com DataJud realizada com sucesso`,
      undefined,
      dadosSincronizados
    );

    console.log('[DATAJUD] Sincronização concluída:', syncLog);
    return syncLog;
  } catch (error) {
    syncLog.status = 'erro';
    syncLog.mensagem = error instanceof Error ? error.message : 'Erro desconhecido';

    await logActivity(
      usuarioId,
      'update',
      'processo',
      processoId,
      `Sincronização com DataJud falhou: ${syncLog.mensagem}`
    );

    console.error('[DATAJUD] Erro na sincronização:', error);
    return syncLog;
  }
}

/**
 * Obtém movimentações de um processo na API CNJ
 * @param numeroCNJ Número do processo no formato CNJ
 * @returns Array de movimentações ou null se erro
 */
export async function getMovimentacoes(numeroCNJ: string): Promise<DataJudMovimentacao[] | null> {
  try {
    if (!isValidProcessoCNJ(numeroCNJ)) {
      console.error('[DATAJUD] Número CNJ inválido:', numeroCNJ);
      return null;
    }

    if (!checkRateLimit()) {
      throw new Error('Rate limit atingido');
    }

    // TODO: Implementar requisição real à API CNJ
    // const response = await axios.get(
    //   `${DATAJUD_API_BASE}/api/processo/${numeroLimpo}/movimentacoes`,
    //   { timeout: DATAJUD_TIMEOUT }
    // );

    // Por enquanto, retornar dados mock
    const mockMovimentacoes: DataJudMovimentacao[] = [
      {
        data: '2024-01-15',
        descricao: 'Distribuição do processo',
        tipo: 'distribuicao',
      },
      {
        data: '2024-02-20',
        descricao: 'Petição inicial recebida',
        tipo: 'petição',
      },
      {
        data: '2024-03-10',
        descricao: 'Audiência de conciliação marcada',
        tipo: 'audiência',
        complemento: '10/04/2024 às 14:00',
      },
    ];

    return mockMovimentacoes;
  } catch (error) {
    console.error('[DATAJUD] Erro ao obter movimentações:', error);
    return null;
  }
}

/**
 * Obtém status de sincronização de um processo
 */
export async function getSyncStatus(processoId: string): Promise<SyncLog | null> {
  try {
    // TODO: Implementar SELECT da tabela 'datajud_sync_log'
    // const { data, error } = await supabase
    //   .from('datajud_sync_log')
    //   .select('*')
    //   .eq('processo_id', processoId)
    //   .order('timestamp', { ascending: false })
    //   .limit(1)
    //   .single();

    console.log('[DATAJUD] Buscando status de sincronização:', processoId);
    return null;
  } catch (error) {
    console.error('[DATAJUD] Erro ao obter status de sincronização:', error);
    return null;
  }
}
