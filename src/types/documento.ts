export interface Documento {
  id: string;
  cliente_id: string;
  processo_id?: string;
  nome: string;
  nome_arquivo?: string;
  tipo: string;
  url: string;
  tamanho?: number;
  mime_type?: string;
  data_upload?: string;
  uploader_id?: string;
  uploader_nome?: string;
  created_by: string;
  created_at: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface DocumentoCreate {
  cliente_id: string;
  processo_id?: string;
  nome: string;
  tipo: string;
  url: string;
}
