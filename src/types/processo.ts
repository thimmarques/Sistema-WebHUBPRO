export type ProcessoStatus =
  | 'ativo'
  | 'audiencia'
  | 'pendente'
  | 'encerrado'
  | 'recurso'
  | 'acordo';

export type TribunalType =
  | 'TJSP'
  | 'TRT-2'
  | 'TRF-3'
  | 'JEF/INSS'
  | 'JTSP'
  | 'STJ'
  | 'STF';

export type FaseType =
  | 'peticao_inicial'
  | 'citacao'
  | 'instrucao'
  | 'sentenca'
  | 'recurso'
  | 'execucao'
  | 'arquivado'
  | 'ativo'
  | 'sentenciado'
  | 'encerrado';

export interface Processo {
  id: string
  polo_ativo_id: string
  polo_ativo?: {
    nome: string
    practice_area: string
  }
  practice_area: 'criminal' | 'trabalhista' | 'civil' | 'previdenciario' | 'tributario'
  fase: string // Mudando para string para evitar erros de tipagem com as novas fases dinâmicas
  status: ProcessoStatus
  numero_cnj?: string
  tribunal?: string
  vara?: string
  comarca?: string
  valor_causa?: number
  proxima_audiencia?: string
  prazo_fatal?: string
  descricao?: string
  polo_ativo_nome?: string
  polo_passivo_nome?: string
  notes?: string
  responsible_id: string
  created_at: string
  created_by: string
}

export const statusLabels: Record<ProcessoStatus, string> = {
  ativo: 'Ativo',
  audiencia: 'Em Audiência',
  pendente: 'Pendente',
  encerrado: 'Encerrado',
  recurso: 'Em Recurso',
  acordo: 'Acordo',
};

export const statusColors: Record<ProcessoStatus, string> = {
  ativo: 'bg-badge-ativo text-badge-ativo-fg',
  audiencia: 'bg-badge-audiencia text-badge-audiencia-fg',
  pendente: 'bg-badge-pendente text-badge-pendente-fg',
  encerrado: 'bg-badge-encerrado text-badge-encerrado-fg',
  recurso: 'bg-badge-recurso text-badge-recurso-fg',
  acordo: 'bg-teal-100 text-teal-700',
};

export const faseLabels: Record<FaseType, string> = {
  peticao_inicial: 'Petição Inicial',
  citacao: 'Citação',
  instrucao: 'Instrução',
  sentenca: 'Sentença',
  recurso: 'Recurso',
  execucao: 'Execução',
  arquivado: 'Arquivado',
  ativo: 'Ativo',
  sentenciado: 'Sentenciado',
  encerrado: 'Encerrado',
};

export const areaColors: Record<string, string> = {
  trabalhista: 'bg-badge-trabalhista text-badge-trabalhista-fg',
  civil: 'bg-badge-civil text-badge-civil-fg',
  criminal: 'bg-badge-criminal text-badge-criminal-fg',
  previdenciario: 'bg-badge-previdenciario text-badge-previdenciario-fg',
  tributario: 'bg-badge-tributario text-badge-tributario-fg',
};

export const areaLabels: Record<string, string> = {
  trabalhista: 'Trabalhista',
  civil: 'Civil',
  criminal: 'Criminal',
  previdenciario: 'Previdenciário',
  tributario: 'Tributário',
};

export const acaoSuggestions: Record<string, string[]> = {
  trabalhista: [
    'Reclamação Trabalhista',
    'Ação de Execução Trabalhista',
    'Dissídio Individual',
    'Inquérito Judicial',
    'Ação de Consignação',
    'Ação Rescisória',
  ],
  civil: [
    'Ação de Indenização por Dano Moral',
    'Ação de Indenização por Dano Material',
    'Ação de Dissolução Societária',
    'Ação Monitória',
    'Ação de Cobrança',
    'Ação de Execução Civil',
  ],
  criminal: [
    'Ação Penal Pública',
    'Habeas Corpus',
    'Mandado de Segurança Criminal',
    'Revisão Criminal',
    'Agravo em Execução',
  ],
  previdenciario: [
    'Concessão de Benefício Previdenciário',
    'Revisão de Benefício',
    'Restabelecimento de Benefício',
    'BPC/LOAS',
    'Salário-Maternidade',
    'Auxílio-Reclusão',
  ],
  tributario: [
    'Ação Anulatória de Débito Fiscal',
    'Mandado de Segurança Tributário',
    'Ação de Repetição de Indébito',
    'Ação Declaratória de Inexistência de Relação Jurídica',
    'Embargos à Execução Fiscal',
    'Exceção de Pré-Executividade',
  ],
};

export const areaTribunalDefault: Record<string, TribunalType> = {
  trabalhista: 'TRT-2',
  civil: 'TJSP',
  criminal: 'TJSP',
  previdenciario: 'JEF/INSS',
  tributario: 'TRF-3',
};

// ✅ NOVO: Enum para transições de fase
export enum FaseTransition {
  ATIVO_TO_SENTENCIADO = 'ativo_to_sentenciado',
  SENTENCIADO_TO_ENCERRADO = 'sentenciado_to_encerrado',
  ATIVO_TO_ENCERRADO = 'ativo_to_encerrado',
}

// ✅ NOVO: Enum para resultados de processo
export enum ResultadoProcesso {
  GANHO = 'ganho',
  PERDIDO = 'perdido',
  DESISTENCIA = 'desistencia',
  ACORDO = 'acordo',
}

// ✅ NOVO: Tipo para mudança de fase
export interface ProcessoFaseChange {
  processoId: string;
  faseAntiga: string;
  faseNova: string;
  timestamp: string;
}

// ✅ NOVO: Tipo para encerramento de processo
export interface ProcessoEncerramento {
  processoId: string;
  dataEncerramento: string;
  observacoes?: string;
  timestamp: string;
}

// ✅ NOVO: Tipo para validação de transição
export interface FaseTransitionRule {
  from: string;
  to: string;
  allowed: boolean;
  requiresReason: boolean;
}
