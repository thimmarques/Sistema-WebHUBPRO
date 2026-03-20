import { PracticeArea } from '@/types';

/* ── Base interfaces ── */

export interface ClienteBase {
  id: string
  type: 'pf' | 'pj'
  practice_area: PracticeArea
  status: 'ativo' | 'inativo' | 'suspenso' | 'encerrado' | 'arquivado'
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
  cpf_cnpj?: string
  metadata?: Record<string, any>
  created_at: string
  updated_at?: string
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
  tipo_monitoramento?: string
}

export interface ClienteTrabalhista {
  polo_trabalhista: 'reclamante' | 'reclamado'
  nit?: string
  ctps?: string
  data_admissao?: string
  data_demissao?: string
  salario_base?: number
  fase_processual: string
  tipo_demissao?: string
  motivo_justa_causa?: string
  data_justa_causa?: string
  motivo_demissao?: string
  numero_funcionarios_envolvidos?: number
  departamento_responsavel?: string
}

export interface ClienteCivil {
  polo_civil: 'autor' | 'réu' | 'terceiro'
  subtipo: string
  valor_causa?: number
  data_fato_gerador: string
  fase_processual: string
  tipo_familia?: string
  tem_filhos?: boolean
  numero_filhos?: number
  tipo_contrato?: string
  valor_contrato?: number
  tipo_imovel?: string
  valor_imovel?: number
  endereco_imovel?: string
  tipo_consumidor?: string
  valor_reclamado?: number
  tipo_sucessao?: string
  valor_monte_mor?: number
}

export interface ClientePrevidenciario {
  polo_previdenciario: 'segurado' | 'dependente'
  nit: string
  especie_beneficio: string
  data_filiacao: string
  fase_processual: string
  data_nascimento?: string
  tempo_contribuicao_meses?: number
  data_ultimo_recolhimento?: string
  data_incapacidade?: string
  laudo_medico?: string
  data_inicio_afastamento?: string
  data_acidente?: string
  data_obito?: string
  grau_parentesco?: string
  renda_familiar?: number
  numero_dependentes?: number
  deficiencia_comprovada?: boolean
}

export interface ClienteTributario {
  polo_tributario: 'contribuinte' | 'representante'
  tipo_tributo: string
  fase_processual: string
  orgao_fiscalizador: string
  regime_tributario?: string
  valor_tributo?: number
  numero_auto_infracao?: string
}

export interface ClienteForm extends ClienteBase {
  dadosCriminal?: ClienteCriminal
  dadosTrabalhista?: ClienteTrabalhista
  dadosCivil?: ClienteCivil
  dadosPrevidenciario?: ClientePrevidenciario
  dadosTributario?: ClienteTributario
}

export type Cliente = ClienteForm;

/* ── Helpers ── */

export function getClienteName(c: Cliente): string {
  return c.nome || c.razao_social || '';
}

export function getClienteDoc(c: any): string {
  return c.cpf || c.cnpj || c.cpf_cnpj || '';
}

export function getClienteEmail(c: Cliente): string {
  return c.email || '';
}

export function maskCpf(cpf: string): string {
  if (!cpf) return '';
  const d = cpf.replace(/\D/g, '');
  return d.length === 11 ? `${d.slice(0, 3)}.***.**-${d.slice(9)}` : d;
}

export function maskCnpj(cnpj: string): string {
  if (!cnpj) return '';
  const d = cnpj.replace(/\D/g, '');
  return d.length === 14 ? `${d.slice(0, 2)}.${d.slice(2, 5)}.***/***--${d.slice(12)}` : d;
}

export function getPoloLabel(polo: string): string {
  return polo;
}

export function formatBRL(v: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
}

export function applyPhoneMask(v: string) { return v; }
export function applyCpfMask(v: string) { return v; }
export function applyCnpjMask(v: string) { return v; }
export function applyCepMask(v: string) { return v; }
export function isCPFValid(v: string) { return true; }
export function isCNPJValid(v: string) { return true; }
