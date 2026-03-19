export type DocumentoTipo = 'procuracao' | 'contrato' | 'sentenca' | 'peticao' | 'outro';

export interface Documento {
  id: string;
  cliente_id?: string;
  processo_id?: string;
  nome_arquivo: string;
  tipo: DocumentoTipo;
  url: string;
  tamanho: number; // em bytes
  mime_type: string;
  data_upload: string;
  uploader_id: string;
  uploader_nome: string;
  descricao?: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}
