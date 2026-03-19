import { Cliente } from '@/types/cliente';

export const MOCK_CLIENTES: Cliente[] = [
  {
    id: 'cli-001',
    type: 'pf',
    practice_area: 'trabalhista',
    responsible_id: 'user-002',
    status: 'ativo',
    is_vip: false,
    created_at: '2025-08-10',
    updated_at: '2025-08-10',
    created_by: 'user-001',
    nome: 'João Silva Santos',
    email: 'joao.santos@email.com',
    telefone: '(11) 98765-4321',
    logradouro: 'Rua das Flores, 123',
    cidade: 'São Paulo',
    estado: 'SP',
    observacoes: 'Cliente encaminhado pelo sindicato',
    dadosTrabalhista: {
      polo_trabalhista: 'reclamante',
      tipo_demissao: 'sem_justa_causa',
      ctps: '123456 / 001-SP',
      fase_processual: 'conhecimento'
    }
  },
  {
    id: 'cli-002',
    type: 'pj',
    practice_area: 'trabalhista',
    responsible_id: 'user-002',
    status: 'ativo',
    is_vip: true,
    created_at: '2024-11-03',
    updated_at: '2024-11-03',
    created_by: 'user-001',
    nome: 'Construtora Betel S.A.',
    razao_social: 'Construtora Betel S.A. LTDA',
    cnpj: '12.345.678/0001-90',
    ramo_atividade: 'industria',
    numero_funcionarios: 150,
    email: 'juridico@construtorabeltel.com.br',
    telefone: '(11) 3344-5566',
    logradouro: 'Av. Paulista, 1000',
    cidade: 'São Paulo',
    estado: 'SP',
    observacoes: 'Empresa com histórico de reclamações trabalhistas',
    dadosTrabalhista: {
      polo_trabalhista: 'reclamado',
      fase_processual: 'execucao',
      numero_funcionarios_envolvidos: 5,
      departamento_responsavel: 'RH'
    }
  },
  {
    id: 'cli-003',
    type: 'pj',
    practice_area: 'civil',
    responsible_id: 'user-003',
    status: 'ativo',
    is_vip: true,
    created_at: '2024-06-18',
    updated_at: '2024-06-18',
    created_by: 'user-001',
    nome: 'Martins & Associados Ltda',
    razao_social: 'Martins & Associados Consultoria Ltda',
    cnpj: '98.765.432/0001-10',
    ramo_atividade: 'servicos',
    numero_funcionarios: 25,
    email: 'paulo@martinsassociados.com.br',
    telefone: '(11) 97654-3210',
    logradouro: 'Rua Augusta, 500',
    cidade: 'São Paulo',
    estado: 'SP',
    observacoes: 'Disputa societária em andamento',
    dadosCivil: {
      polo_civil: 'réu',
      subtipo: 'outro',
      data_fato_gerador: '2024-06-18',
      fase_processual: 'conhecimento'
    }
  },
  {
    id: 'cli-004',
    type: 'pf',
    practice_area: 'criminal',
    responsible_id: 'user-004',
    status: 'ativo',
    is_vip: false,
    created_at: '2025-10-05',
    updated_at: '2025-10-05',
    created_by: 'user-001',
    nome: 'Pedro Henrique Gomes',
    email: 'pedro.gomes@email.com',
    telefone: '(11) 91234-5678',
    logradouro: 'Rua Voluntários da Pátria, 77',
    cidade: 'São Paulo',
    estado: 'SP',
    observacoes: 'Preso em flagrante, solto com liberdade provisória',
    dadosCriminal: {
      polo_criminal: 'réu',
      crime_imputado: 'Roubo',
      data_dos_fatos: '2025-10-05',
      situacao_prisional: 'solto',
      fase_processual: 'inquerito'
    }
  },
  {
    id: 'cli-005',
    type: 'pf',
    practice_area: 'previdenciario',
    responsible_id: 'user-005',
    status: 'ativo',
    is_vip: false,
    created_at: '2025-08-20',
    updated_at: '2025-08-20',
    created_by: 'user-001',
    nome: 'Maria de Fátima Oliveira',
    email: 'mariafatima@email.com',
    telefone: '(11) 94567-8901',
    logradouro: 'Rua Dom Pedro II, 45',
    cidade: 'São Bernardo do Campo',
    estado: 'SP',
    observacoes: 'CNIS disponível. Perícia agendada para março/2026',
    dadosPrevidenciario: {
      polo_previdenciario: 'segurado',
      especie_beneficio: 'aposentadoria_idade',
      nit: '12345678901',
      data_filiacao: '2010-01-01',
      fase_processual: 'administrativo'
    }
  },
  {
    id: 'cliente-tributario-pf-001',
    type: 'pf',
    practice_area: 'tributario',
    status: 'ativo',
    is_vip: false,
    responsible_id: 'user-001',
    nome: 'Carlos Alberto Silva',
    email: 'carlos@email.com',
    telefone: '(11) 3000-0000',
    celular: '(11) 98000-0000',
    cpf: '123.456.789-00',
    cep: '01310-100',
    logradouro: 'Avenida Paulista',
    numero: '1000',
    complemento: 'Apto 1500',
    bairro: 'Bela Vista',
    cidade: 'São Paulo',
    estado: 'SP',
    observacoes: 'Cliente com questão tributária em fase administrativa',
    created_at: '2026-01-15T10:00:00Z',
    updated_at: '2026-01-15T10:00:00Z',
    created_by: 'user-001',
    deleted_at: null,
    dadosTributario: {
      polo_tributario: 'contribuinte',
      tipo_tributo: 'irpf',
      data_fato_gerador: '2025-06-15',
      fase_processual: 'administrativo',
      orgao_fiscalizador: 'receita_federal',
      valor_tributo: 50000,
      numero_auto_infracao: 'AI-2025-001234',
      data_notificacao: '2025-07-01',
      descricao_questao: 'Divergência em declaração de imposto de renda'
    }
  },
  {
    id: 'cliente-tributario-pj-001',
    type: 'pj',
    practice_area: 'tributario',
    status: 'ativo',
    is_vip: true,
    responsible_id: 'user-001',
    nome: 'Indústria XYZ Ltda',
    cnpj: '12.345.678/0001-90',
    razao_social: 'Indústria XYZ Ltda',
    nome_fantasia: 'XYZ Industrial',
    ramo_atividade: 'industria',
    numero_funcionarios: 150,
    email: 'juridico@xyz.com',
    telefone: '(11) 3500-0000',
    celular: '(11) 99500-0000',
    cep: '01310-100',
    logradouro: 'Avenida Paulista',
    numero: '2000',
    complemento: 'Sala 500',
    bairro: 'Bela Vista',
    cidade: 'São Paulo',
    estado: 'SP',
    observacoes: 'Empresa com questão de ICMS em fase judicial',
    created_at: '2026-01-20T14:30:00Z',
    updated_at: '2026-01-20T14:30:00Z',
    created_by: 'user-001',
    deleted_at: null,
    dadosTributario: {
      polo_tributario: 'contribuinte',
      tipo_tributo: 'icms',
      data_fato_gerador: '2024-12-10',
      fase_processual: 'judicial',
      orgao_fiscalizador: 'sefaz',
      valor_tributo: 250000,
      numero_auto_infracao: 'AI-2025-005678',
      data_notificacao: '2025-01-15',
      descricao_questao: 'Questionamento sobre classificação fiscal de produtos',
      regime_tributario: 'lucro_real',
      numero_funcionarios_envolvidos: 5
    }
  }
];

const WHP_CLIENTES_KEY = 'whp_clientes';

export function loadClientes(): Cliente[] {
  const stored = localStorage.getItem(WHP_CLIENTES_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // fall through
    }
  }
  localStorage.setItem(WHP_CLIENTES_KEY, JSON.stringify(MOCK_CLIENTES));
  return [...MOCK_CLIENTES];
}

export function saveClientes(clientes: Cliente[]): void {
  localStorage.setItem(WHP_CLIENTES_KEY, JSON.stringify(clientes));
}
