export type TipoAtividade = 'create' | 'read' | 'update' | 'delete' | 'login' | 'logout' | 'export' | 'import';

export interface Atividade {
  id: string;
  usuario_id: string;
  tipo: TipoAtividade;
  entidade: string;
  entidade_id: string;
  descricao: string;
  dados_antigos?: Record<string, any>;
  dados_novos?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  timestamp: string;
  created_at: string;
}
