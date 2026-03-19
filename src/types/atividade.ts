export type TipoAtividade = 'create' | 'read' | 'update' | 'delete' | 'login' | 'logout' | 'export' | 'import' | 'audiencia_realizada' | 'prazo_cumprido' | 'sistema' | 'anotacao';

export interface Atividade {
  id: string;
  tipo: string;
  tabela: string;
  registro_id: string;
  descricao: string;
  campos_alterados?: Record<string, any>;
  created_by: string;
  created_at: string;
  deleted_at?: string;
  // Campos virtuais/join
  usuario_nome?: string;
}
