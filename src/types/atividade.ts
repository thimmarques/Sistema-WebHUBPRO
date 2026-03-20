export type TipoAtividade = 
  | 'login' | 'logout' | 'create' | 'read' | 'update' | 'delete' 
  | 'export' | 'import' | 'error' | 'suspicious' | 'system';

export interface Atividade {
  id: string;
  usuario_id: string;
  created_by: string;
  entidade: string;
  tabela: string;
  entidade_id: string;
  registro_id: string;
  descricao: string;
  tipo: string;
  dados_antigos?: Record<string, any>;
  dados_novos?: Record<string, any>;
  campos_alterados?: Record<string, any>;
  user_agent?: string;
  timestamp: string;
  created_at: string;
  updated_at?: string;
  deleted_at?: string | null;
  usuario_nome?: string;
}

export interface AtividadeCreate {
  usuario_id: string;
  entidade: string;
  entidade_id: string;
  descricao: string;
  tipo: string;
  dados_antigos?: Record<string, any>;
  dados_novos?: Record<string, any>;
  user_agent?: string;
}
