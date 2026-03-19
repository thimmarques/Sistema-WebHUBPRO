export type LancamentoStatus = 'pendente' | 'pago' | 'vencido' | 'parcelado' | 'cancelado';

export type LancamentoTipo = 'honorario' | 'despesa' | 'repasse' | 'custas' | 'receita';

export interface Lancamento {
  id: string;
  processo_id?: string;
  cliente_id?: string;
  numero_cnj?: string;
  cliente_nome?: string;
  responsible_id: string;
  practice_area?: 'trabalhista' | 'civil' | 'criminal' | 'previdenciario' | 'tributario';
  tipo: LancamentoTipo;
  descricao: string;
  valor: number;
  data: string;
  vencimento?: string;
  status: LancamentoStatus;
  data_pagamento?: string;
  parcelas_total?: number;
  parcelas_pagas?: number;
  created_at: string;
  updated_at?: string;
  created_by?: string;
  deleted_at?: string | null;
  categoria?: string | null;
  observacoes?: string | null;
}

export const lancamentoStatusLabels: Record<LancamentoStatus, string> = {
  pendente: 'Pendente',
  pago: 'Pago',
  vencido: 'Vencido',
  parcelado: 'Parcelado',
  cancelado: 'Cancelado',
};

export const lancamentoStatusColors: Record<LancamentoStatus, string> = {
  pago: 'bg-green-100 text-green-700',
  pendente: 'bg-yellow-100 text-yellow-700',
  vencido: 'bg-red-100 text-red-700',
  parcelado: 'bg-primary/20 text-primary',
  cancelado: 'bg-gray-100 text-gray-700',
};

export const lancamentoTipoLabels: Record<LancamentoTipo, string> = {
  honorario: 'Honorário',
  despesa: 'Despesa',
  repasse: 'Repasse',
  custas: 'Custas',
  receita: 'Receita',
};

export const lancamentoTipoColors: Record<LancamentoTipo, string> = {
  honorario: 'bg-primary/20 text-primary',
  despesa: 'bg-orange-100 text-orange-700',
  repasse: 'bg-purple-100 text-purple-700',
  custas: 'bg-muted/80 text-secondary-foreground',
  receita: 'bg-green-100 text-green-700',
};

export const tipoDescricaoSuggestion: Record<LancamentoTipo, string> = {
  honorario: 'Honorários advocatícios — ',
  despesa: 'Despesas processuais — ',
  repasse: 'Repasse — ',
  custas: 'Custas processuais — ',
  receita: 'Receita — ',
};
