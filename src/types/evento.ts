export type EventoTipo = 'audiencia' | 'reuniao' | 'prazo' | 'pericia' | 'movimentacao' | 'outro';

export type AudienciaTipo = 'conciliacao' | 'instrucao' | 'julgamento' | 'una' | 'virtual';

export type AudienciaStatus = 'agendada' | 'realizada' | 'adiada' | 'cancelada';

export interface Evento {
  id: string;
  title: string;
  responsible_id: string;
  processo_id: string;
  cliente_nome: string;
  tipo: EventoTipo;
  data: string;
  data_inicio: string;
  data_fim?: string;
  hora_inicio: string;
  hora_fim: string;
  local: string;
  descricao?: string;
  notes: string;
  resultado?: string | null;
  status?: string;
  created_at: string;
  updated_at?: string;
  created_by?: string;
  deleted_at?: string | null;
  audiencia_tipo?: AudienciaTipo;
  audiencia_status?: AudienciaStatus;
  processo_numero?: string;
  processo?: {
    numero_processo?: string;
    polo_ativo_id?: string;
  };
}

export const tipoLabels: Record<EventoTipo, string> = {
  audiencia: 'Audiência',
  reuniao: 'Reunião',
  prazo: 'Prazo',
  pericia: 'Perícia',
  movimentacao: 'Movimentação',
  outro: 'Outro',
};

export const tipoBgColors: Record<EventoTipo, string> = {
  audiencia: 'bg-badge-audiencia text-badge-audiencia-foreground',
  reuniao: 'bg-primary/20 text-primary',
  prazo: 'bg-red-100 text-red-700',
  pericia: 'bg-amber-100 text-amber-700',
  movimentacao: 'bg-blue-100 text-blue-700',
  outro: 'bg-muted/80 text-secondary-foreground',
};

export const tipoBorderColors: Record<EventoTipo, string> = {
  audiencia: 'border-l-badge-audiencia-foreground',
  reuniao: 'border-l-primary',
  prazo: 'border-l-red-500',
  pericia: 'border-l-amber-500',
  movimentacao: 'border-l-blue-500',
  outro: 'border-l-muted-foreground',
};

export const tipoSelectedColors: Record<EventoTipo, string> = {
  audiencia: 'bg-badge-audiencia-foreground border-badge-audiencia-foreground text-white',
  reuniao: 'bg-primary border-primary text-white',
  prazo: 'bg-red-600 border-red-600 text-white',
  pericia: 'bg-amber-500 border-amber-500 text-white',
  movimentacao: 'bg-blue-600 border-blue-600 text-white',
  outro: 'bg-primary/80 border-primary text-white',
};

export const audienciaTipoLabels: Record<AudienciaTipo, string> = {
  conciliacao: 'Conciliação',
  instrucao: 'Instrução',
  julgamento: 'Julgamento',
  una: 'Una',
  virtual: 'Virtual',
};

export const audienciaTipoColors: Record<AudienciaTipo, string> = {
  conciliacao: 'bg-teal-100 text-teal-700',
  instrucao: 'bg-primary/20 text-primary',
  julgamento: 'bg-purple-100 text-purple-700',
  una: 'bg-muted/80 text-secondary-foreground',
  virtual: 'bg-indigo-100 text-indigo-700',
};

export const audienciaStatusLabels: Record<AudienciaStatus, string> = {
  agendada: 'Agendada',
  realizada: 'Realizada',
  adiada: 'Adiada',
  cancelada: 'Cancelada',
};

export const audienciaStatusColors: Record<AudienciaStatus, string> = {
  agendada: 'bg-primary/20 text-primary',
  realizada: 'bg-green-100 text-green-700',
  adiada: 'bg-amber-100 text-amber-700',
  cancelada: 'bg-muted/80 text-muted-foreground',
};
