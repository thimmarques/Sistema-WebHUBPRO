// ✅ NOVO: Tipos para Relatórios

// Enum para tipos de relatório
export enum TipoRelatorio {
  CLIENTES = 'clientes',
  PROCESSOS = 'processos',
  FINANCEIRO = 'financeiro',
  PRAZOS = 'prazos',
}

// Interface para métricas gerais
export interface MetricasGerais {
  totalClientes: number;
  clientesAtivos: number;
  clientesInativos: number;
  clientesSuspensos: number;
  clientesEncerrados: number;
  totalProcessos: number;
  processosAtivos: number;
  processosSentenciados: number;
  processosEncerrados: number;
  receitaTotal: number;
  despesaTotal: number;
  saldoTotal: number;
  prazosVencidos: number;
  prazosProximos: number;
}

// Interface para relatório de clientes
export interface RelatorioClientes {
  id: string;
  nome: string;
  cpfCnpj: string;
  area: string;
  advogadoResponsavel: string;
  dataCreacao: string;
  totalProcessos: number;
  receitaTotal: number;
}

// Interface para relatório de processos
export interface RelatorioProcessos {
  id: string;
  numeroCnj: string;
  cliente: string;
  area: string;
  advogado: string;
  dataCreacao: string;
  dataEncerramento?: string;
}

// Interface para relatório financeiro
export interface RelatorioFinanceiro {
  id: string;
  tipo: 'receita' | 'despesa';
  valor: number;
  data: string;
  descricao: string;
  cliente?: string;
  processo?: string;
  categoria: string;
}

// Interface para relatório de prazos
export interface RelatorioPrazos {
  id: string;
  tipo: string;
  data: string;
  processo: string;
  cliente: string;
  descricao: string;
  diasRestantes: number;
}

// Interface para filtros de relatório
export interface FiltrosRelatorio {
  tipo?: TipoRelatorio;
  status?: string;
  area?: string;
  advogado?: string;
  dataInicio?: string;
  dataFim?: string;
  busca?: string;
}

// Interface para dados de gráfico
export interface DadosGrafico {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string[];
    borderColor?: string;
  }[];
}
