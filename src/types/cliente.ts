import { PracticeArea } from '@/types';

/* ── Base interfaces ── */

export interface ClienteBase {
  id: string
  type: 'pf' | 'pj'
  practice_area: 'criminal' | 'trabalhista' | 'civil' | 'previdenciario' | 'tributario'
  status: 'ativo' | 'inativo' | 'arquivado'
  is_vip: boolean
  responsible_id: string
  nome: string
  email?: string
  telefone?: string
  celular?: string
  cpf?: string
  rg?: string
  data_nascimento?: string
  cnpj?: string
  razao_social?: string
  nome_fantasia?: string
  ramo_atividade?: string
  numero_funcionarios?: number
  inscricao_estadual?: string
  cep?: string
  logradouro?: string
  numero?: string
  complemento?: string
  bairro?: string
  cidade?: string
  estado?: string
  observacoes?: string
  metadata?: Record<string, any>
  created_at: string
  updated_at: string
  created_by: string
  deleted_at?: string | null
}

export interface ClienteCriminal {
  polo_criminal: 'réu' | 'vítima' | 'investigado'
  crime_imputado: string
  data_dos_fatos: string
  fase_processual: 'inquerito' | 'instrucao' | 'recurso'
  situacao_prisional: 'solto' | 'preso_preventivo' | 'preso_condenado' | 'monitorado'
  preso_em?: string
  data_condenacao?: string
  pena_anos?: number
  tipo_monitoramento?: 'tornozeleira_eletronica' | 'comparecimento_periodico' | 'outro'
}

export interface ClienteTrabalhista {
  polo_trabalhista: 'reclamante' | 'reclamado'
  tipo_demissao?: 'sem_justa_causa' | 'justa_causa' | 'pedido_demissao' | 'rescisao_indireta' | 'rescisao_comum' | 'nao_aplicavel'
  motivo_demissao?: string
  motivo_justa_causa?: string
  data_justa_causa?: string
  nit?: string
  ctps?: string
  data_admissao?: string
  data_demissao?: string
  salario_base?: number
  numero_funcionarios_envolvidos?: number
  departamento_responsavel?: string
  fase_processual: 'conhecimento' | 'execucao' | 'recurso'
}

export interface ClienteCivil {
  polo_civil: 'autor' | 'réu' | 'terceiro'
  subtipo: 'familia' | 'contratos' | 'imoveis' | 'consumidor' | 'sucessoes' | 'outro'
  data_fato_gerador: string
  valor_causa?: number
  fase_processual: 'conhecimento' | 'execucao' | 'recurso'
  tipo_familia?: 'divorcio' | 'guarda' | 'alimentos' | 'inventario' | 'outro'
  tem_filhos?: boolean
  numero_filhos?: number
  tipo_contrato?: 'compra_venda' | 'locacao' | 'prestacao_servicos' | 'emprestimo' | 'outro'
  valor_contrato?: number
  tipo_imovel?: 'residencial' | 'comercial' | 'industrial' | 'terreno'
  valor_imovel?: number
  endereco_imovel?: string
  tipo_consumidor?: 'produto_defeituoso' | 'servico_inadequado' | 'cobranca_indevida' | 'outro'
  valor_reclamado?: number
  tipo_sucessao?: 'inventario' | 'partilha' | 'testamento' | 'outro'
  valor_monte_mor?: number
}

export interface ClientePrevidenciario {
  polo_previdenciario: 'segurado' | 'dependente'
  especie_beneficio: 'aposentadoria_idade' | 'aposentadoria_tempo' | 'aposentadoria_invalidez' | 'auxilio_doenca' | 'auxilio_acidente' | 'pensao_morte' | 'bpc_loas' | 'outro'
  nit: string
  data_filiacao: string
  fase_processual: 'administrativo' | 'judicial' | 'recurso'
  data_nascimento?: string
  tempo_contribuicao_meses?: number
  data_ultimo_recolhimento?: string
  data_incapacidade?: string
  laudo_medico?: string
  data_inicio_afastamento?: string
  data_obito?: string
  grau_parentesco?: 'conjuge' | 'filho' | 'pai' | 'mae' | 'irmaos' | 'outro'
  data_acidente?: string
  renda_familiar?: number
  numero_dependentes?: number
  deficiencia_comprovada?: boolean
}

export interface ClienteTributario {
  // Campos obrigatórios
  polo_tributario: 'contribuinte' | 'representante' | 'procurador'
  tipo_tributo: 'irpf' | 'irpj' | 'icms' | 'ipi' | 'pis' | 'cofins' | 'inss' | 'outro'
  data_fato_gerador: string
  fase_processual: 'administrativo' | 'judicial' | 'recurso'
  orgao_fiscalizador: 'receita_federal' | 'sefaz' | 'prefeitura' | 'inss' | 'outro'
  
  // Campos opcionais
  valor_tributo?: number
  numero_auto_infracao?: string
  data_notificacao?: string
  descricao_questao?: string
  
  // Campos adicionais para PJ
  regime_tributario?: 'simples_nacional' | 'lucro_presumido' | 'lucro_real' | 'mei'
  numero_funcionarios_envolvidos?: number
}

// Tipo unificado para o formulário
export type ClienteForm = ClienteBase & {
  dadosCriminal?: ClienteCriminal
  dadosTrabalhista?: ClienteTrabalhista
  dadosCivil?: ClienteCivil
  dadosPrevidenciario?: ClientePrevidenciario
  dadosTributario?: ClienteTributario
}

export type Cliente = ClienteForm;

/* ── Helpers ── */

export function getClienteName(c: Cliente): string {
  return c.nome;
}

export function getClienteDoc(c: any): string {
  return c.cpf || c.cnpj || '';
}

export function getClienteEmail(c: Cliente): string {
  return c.email || '';
}

export function maskCpf(cpf: string): string {
  if (!cpf || cpf.length < 11) return cpf;
  const d = cpf.replace(/\D/g, '');
  if (d.length < 11) return cpf;
  return `${d.slice(0, 3)}.***.**-${d.slice(9, 11)}`;
}

export function maskCnpj(cnpj: string): string {
  if (!cnpj || cnpj.length < 14) return cnpj;
  const d = cnpj.replace(/\D/g, '');
  if (d.length < 14) return cnpj;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.***/****-${d.slice(12, 14)}`;
}

export function getPoloLabel(polo: string): string {
  const map: Record<string, string> = {
    reclamante: 'Reclamante',
    reclamada: 'Reclamada',
    reclamada_pf: 'Reclamada',
    autor: 'Autor',
    reu: 'Réu',
    vitima: 'Vítima',
    investigado: 'Investigado',
    terceiro_interessado: 'Terceiro',
  };
  return map[polo] || polo;
}

/* ── Masks ── */

export function applyCpfMask(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

export function applyCnpjMask(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 14);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`;
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
  if (d.length <= 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

export function applyPhoneMask(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : '';
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function applyCepMask(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 8);
  if (d.length <= 5) return d;
  return `${d.slice(0, 5)}-${d.slice(5)}`;
}

export function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function parseBRL(value: string): number {
  return Number(value.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
}

export function isCPFValid(cpf: string): boolean {
  const d = cpf.replace(/\D/g, '');
  if (d.length !== 11) return false;
  if (/^(\d)\1+$/.test(d)) return false;
  
  let sum = 0;
  let rest;
  for (let i = 1; i <= 9; i++) sum = sum + parseInt(d.substring(i - 1, i)) * (11 - i);
  rest = (sum * 10) % 11;
  if (rest === 10 || rest === 11) rest = 0;
  if (rest !== parseInt(d.substring(9, 10))) return false;
  
  sum = 0;
  for (let i = 1; i <= 10; i++) sum = sum + parseInt(d.substring(i - 1, i)) * (12 - i);
  rest = (sum * 10) % 11;
  if (rest === 10 || rest === 11) rest = 0;
  if (rest !== parseInt(d.substring(10, 11))) return false;
  
  return true;
}

export function isCNPJValid(cnpj: string): boolean {
  const d = cnpj.replace(/\D/g, '');
  if (d.length !== 14) return false;
  if (/^(\d)\1+$/.test(d)) return false;
  
  let size = d.length - 2;
  let numbers = d.substring(0, size);
  const digits = d.substring(size);
  let sum = 0;
  let pos = size - 7;
  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0))) return false;
  
  size = size + 1;
  numbers = d.substring(0, size);
  sum = 0;
  pos = size - 7;
  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(1))) return false;
  
  return true;
}
