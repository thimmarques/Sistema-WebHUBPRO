import { supabase } from '@/lib/supabase';
import { Atividade } from '@/types/atividade';

export async function getAuditLog(filters: any = {}) {
  let query = supabase.from('atividades').select('*');
  if (filters.entidade) query = query.eq('entidade', filters.entidade);
  if (filters.entidade_id) query = query.eq('entidade_id', filters.entidade_id);
  if (filters.usuario_id) query = query.eq('usuario_id', filters.usuario_id);
  if (filters.tipo) query = query.eq('tipo', filters.tipo);
  
  const { data, error } = await query.order('created_at', { ascending: false });
  return error ? [] : data as Atividade[];
}

export async function getAuditLogByEntity(e: string, id: string) {
  return getAuditLog({ entidade: e, entidade_id: id });
}

export async function getAuditLogByUser(uid: string) {
  return getAuditLog({ usuario_id: uid });
}

export async function getAuditSummary() { return []; }
export async function getActivityStats() { return {}; }
export async function exportAuditLog() { return ''; }
