// ✅ NOVO: Tipos para Auditoria

// Interface para filtros de auditoria
export interface FiltrosAuditoria {
  usuario?: string;
  entidade?: string;
  tipo?: 'create' | 'update' | 'delete' | 'status_change' | 'assign' | 'reconciliacao' | 'password_change';
  dataInicio?: string;
  dataFim?: string;
  busca?: string;
}

// Interface para log de auditoria detalhado
export interface AuditoriaDetalhes {
  id: string;
  usuarioId: string;
  usuarioNome: string;
  entidade: string;
  entidadeId: string;
  tipo: 'create' | 'update' | 'delete' | 'status_change' | 'assign' | 'reconciliacao' | 'password_change';
  descricao: string;
  dadosAntigos?: Record<string, any>;
  dadosNovos?: Record<string, any>;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
}

// Interface para comparação antes/depois
export interface AuditoriaComparacao {
  campo: string;
  valorAntigo: any;
  valorNovo: any;
  tipo: string;
}

// Interface para resumo de auditoria
export interface AuditoriaResumo {
  totalLogs: number;
  logsHoje: number;
  logsEstaSemanA: number;
  usuariosMaisAtivos: Array<{
    usuarioId: string;
    usuarioNome: string;
    totalAcoes: number;
  }>;
  entidadesMaisAlteradas: Array<{
    entidade: string;
    totalAlteracoes: number;
  }>;
  tiposAcaoMaisFrequentes: Array<{
    tipo: string;
    total: number;
  }>;
}

// Interface para exportação de auditoria
export interface ExportacaoAuditoria {
  formato: 'csv' | 'json' | 'pdf';
  filtros: FiltrosAuditoria;
  dataExportacao: string;
  usuarioExportacao: string;
}
