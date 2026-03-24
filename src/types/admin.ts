// ✅ NOVO: Tipos para Administração

// Interface para usuário administrativo
export interface AdminUsuario {
  id: string;
  nome: string;
  email: string;
  role: 'admin' | 'advogado' | 'estagiario' | 'assistente';
  status: 'ativo' | 'inativo';
  dataCreacao: string;
  ultimoLogin?: string;
  telefone?: string;
  oab?: string;
}

// Interface para criação de usuário
export interface AdminUsuarioCreate {
  nome: string;
  email: string;
  role: 'admin' | 'advogado' | 'estagiario' | 'assistente';
  telefone?: string;
  oab?: string;
}

// Interface para atualização de usuário
export interface AdminUsuarioUpdate {
  nome?: string;
  email?: string;
  role?: 'admin' | 'advogado' | 'estagiario' | 'assistente';
  status?: 'ativo' | 'inativo';
  telefone?: string;
  oab?: string;
}

// Interface para configurações do sistema
export interface AdminConfiguracoes {
  id: string;
  chave: string;
  valor: any;
  tipo: 'string' | 'number' | 'boolean' | 'json';
  descricao: string;
  dataAtualizacao: string;
}

// Interface para configurações de email
export interface AdminConfigEmail {
  smtpServer: string;
  smtpPort: number;
  usuario: string;
  senha: string;
  remetente: string;
  testeConexao?: boolean;
}

// Interface para configurações de SMS
export interface AdminConfigSms {
  provider: 'twilio' | 'outro';
  apiKey: string;
  apiSecret?: string;
  numeroOrigem: string;
  testeEnvio?: boolean;
}

// Interface para configurações de notificações
export interface AdminConfigNotificacoes {
  emailHabilitado: boolean;
  smsHabilitado: boolean;
  pushHabilitado: boolean;
  frequenciaEmail: 'imediato' | 'diario' | 'semanal' | 'nunca';
  frequenciaSms: 'imediato' | 'diario' | 'semanal' | 'nunca';
  frequenciaPush: 'imediato' | 'diario' | 'semanal' | 'nunca';
  horarioSilencio?: {
    inicio: string;
    fim: string;
  };
}

// Interface para configurações de backup
export interface AdminConfigBackup {
  frequencia: 'diaria' | 'semanal' | 'mensal';
  horario: string;
  retencaoDias: number;
  localArmazenamento: string;
  habilitado: boolean;
}

// Interface para backup
export interface AdminBackup {
  id: string;
  dataHora: string;
  tamanho: number;
  status: 'sucesso' | 'erro' | 'em_progresso';
  tipo: 'manual' | 'automatico';
  descricao?: string;
  usuarioCriacao?: string;
}

// Interface para log do sistema
export interface AdminLog {
  id: string;
  timestamp: string;
  tipo: 'info' | 'warning' | 'error' | 'debug';
  modulo: string;
  mensagem: string;
  usuario?: string;
  stackTrace?: string;
  contexto?: Record<string, any>;
}

// Interface para filtros de log
export interface FiltrosAdminLog {
  tipo?: 'info' | 'warning' | 'error' | 'debug';
  modulo?: string;
  usuario?: string;
  dataInicio?: string;
  dataFim?: string;
  busca?: string;
}

// Interface para resumo administrativo
export interface AdminResumo {
  totalUsuarios: number;
  usuariosAtivos: number;
  usuariosInativos: number;
  ultimoBackup?: string;
  statusBackupAutomatico: 'ativo' | 'inativo';
  logsHoje: number;
  errosHoje: number;
  ultimoErro?: string;
}
