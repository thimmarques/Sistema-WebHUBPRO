import { supabase } from '@/lib/supabase';
import { AtividadeCreate } from '@/types/atividade';

export async function logActivity(activity: any, ...args: any[]) {
  try {
    const act = typeof activity === 'string' 
      ? { usuario_id: activity, entidade: args[0], entidade_id: args[1], descricao: args[2], tipo: args[3] || 'sistema' }
      : activity;

    const { error } = await supabase.from('atividades').insert([{
      ...act,
      created_at: new Date().toISOString()
    }]);
    if (error) console.error('Erro ao logar:', error);
  } catch (err) {
    console.error('Falha no log:', err);
  }
}

export async function logLogin(userId: string, email: string) {
  await logActivity({ usuario_id: userId, entidade: 'usuario', entidade_id: userId, descricao: `Login: ${email}`, tipo: 'login' });
}

export async function logLogout(userId: string, email: string) {
  await logActivity({ usuario_id: userId, entidade: 'usuario', entidade_id: userId, descricao: `Logout: ${email}`, tipo: 'logout' });
}

export async function logCreateCliente(userId: string, id: string, nome: string) {
  await logActivity({ usuario_id: userId, entidade: 'clientes', entidade_id: id, descricao: `Criou: ${nome}`, tipo: 'create' });
}

export async function logUpdateCliente(userId: string, id: string, nome: string, antigo: any, novo: any) {
  await logActivity({ usuario_id: userId, entidade: 'clientes', entidade_id: id, descricao: `Atualizou: ${nome}`, tipo: 'update', dados_antigos: antigo, dados_novos: novo });
}

export async function logDeleteCliente(userId: string, id: string, nome: string) {
  await logActivity({ usuario_id: userId, entidade: 'clientes', entidade_id: id, descricao: `Deletou: ${nome}`, tipo: 'delete' });
}

export const logCreate = logActivity;
export const logUpdate = logActivity;
export const logDelete = logActivity;
export const logExport = logActivity;
export const logImport = logActivity;

export const Descriptions = {
  CLIENTE: 'cliente',
  PROCESSO: 'processo',
  LANCAMENTO: 'lançamento',
  AUDIENCIA: 'audiência',
  EVENTO_ATUALIZADO: 'evento_atualizado',
  EVENTO_CRIADO: 'evento_criado',
  LANCAMENTO_CRIADO: 'lancamento_criado'
};
