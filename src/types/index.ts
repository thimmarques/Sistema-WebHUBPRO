export type PracticeArea = 'trabalhista' | 'civil' | 'criminal' | 'previdenciario' | 'tributario';

export type UserRole = 'admin' | 'socio' | 'advogado' | 'assistente' | 'estagiario';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  oab: string;
  phone?: string;
  role: UserRole;
  practice_areas: PracticeArea[];
  avatar_color: string;
  avatar_initials: string;
}

export interface MockUser extends UserProfile {
  password: string;
}

export type Page =
  | 'dashboard'
  | 'clientes'
  | 'processos'
  | 'financeiro'
  | 'agenda'
  | 'audiencias'
  | 'relatorios'
  | 'equipe'
  | 'configuracoes'
  | 'meu-perfil'
  | 'escritorio'
  | 'integracoes'
  | 'logs'
  | 'seguranca'
  | 'sistema'
  | 'cliente-detalhe'
  | 'processo-detalhe';

export type BadgeVariant =
  | 'ativo'
  | 'audiencia'
  | 'pendente'
  | 'encerrado'
  | 'recurso'
  | 'trabalhista'
  | 'civil'
  | 'criminal'
  | 'previdenciario'
  | 'tributario'
  | 'admin'
  | 'advogado'
  | 'assistente'
  | 'estagiario'
  | 'vip';

export type ToastType = 'success' | 'error' | 'info';

export interface DashboardMetrics {
  totalProcessos: number
  processosAtivos: number
  totalClientes: number
  proximoEvento: any | null
  receitaTotal: number
  despesaTotal: number
}

export * from './atividade';
export * from './cliente';
export * from './documento';
export * from './evento';
export * from './lancamento';
export * from './processo';
