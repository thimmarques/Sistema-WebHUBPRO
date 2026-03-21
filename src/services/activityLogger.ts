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

export async function logStatusChange(
  userId: string,
  clienteId: string,
  statusAntigo: string,
  statusNovo: string,
  motivo: string
) {
  try {
    const activity: AtividadeCreate = {
      usuario_id: userId,
      entidade: 'clientes_base',
      entidade_id: clienteId,
      descricao: `Status alterado de ${statusAntigo} para ${statusNovo}. Motivo: ${motivo}`,
      tipo: 'update',
      dados_antigos: { status: statusAntigo },
      dados_novos: { status: statusNovo },
      user_agent: navigator.userAgent,
    };

    const { error } = await supabase.from('atividades').insert([activity]);

    if (error) {
      console.error('Erro ao registrar mudança de status:', error);
    }
  } catch (err) {
    console.error('Erro ao registrar mudança de status:', err);
  }
}

export async function logAssignAdvogado(
  userId: string,
  clienteId: string,
  advogadoId: string,
  tipo: 'principal' | 'secundario'
) {
  try {
    const activity: AtividadeCreate = {
      usuario_id: userId,
      entidade: 'cliente_advogados',
      entidade_id: clienteId,
      descricao: `Advogado ${tipo} atribuído ao cliente. Advogado ID: ${advogadoId}`,
      tipo: 'create',
      user_agent: navigator.userAgent,
    };

    const { error } = await supabase.from('atividades').insert([activity]);

    if (error) {
      console.error('Erro ao registrar atribuição de advogado:', error);
    }
  } catch (err) {
    console.error('Erro ao registrar atribuição de advogado:', err);
  }
}

export async function logAssignEstagiario(
  userId: string,
  clienteId: string,
  estagiarioId: string
) {
  try {
    const activity: AtividadeCreate = {
      usuario_id: userId,
      entidade: 'cliente_advogados',
      entidade_id: clienteId,
      descricao: `Estagiário atribuído ao cliente. Estagiário ID: ${estagiarioId}`,
      tipo: 'create',
      user_agent: navigator.userAgent,
    };

    const { error } = await supabase.from('atividades').insert([activity]);

    if (error) {
      console.error('Erro ao registrar atribuição de estagiário:', error);
    }
  } catch (err) {
    console.error('Erro ao registrar atribuição de estagiário:', err);
  }
}

// ✅ NOVO: Log de mudança de fase
export async function logPhaseChange(
  userId: string,
  processoId: string,
  faseAntiga: string,
  faseNova: string
) {
  try {
    const activity: AtividadeCreate = {
      usuario_id: userId,
      entidade: 'processos',
      entidade_id: processoId,
      descricao: `Fase alterada de ${faseAntiga} para ${faseNova}`,
      tipo: 'update',
      dados_antigos: { fase: faseAntiga },
      dados_novos: { fase: faseNova },
      user_agent: navigator.userAgent,
    };

    const { error } = await supabase.from('atividades').insert([activity]);

    if (error) {
      console.error('Erro ao registrar mudança de fase:', error);
    }
  } catch (err) {
    console.error('Erro ao registrar mudança de fase:', err);
  }
}

// ✅ NOVO: Log de encerramento de processo
export async function logEncerramento(
  userId: string,
  processoId: string,
  resultado: string,
  observacoes?: string
) {
  try {
    const activity: AtividadeCreate = {
      usuario_id: userId,
      entidade: 'processos',
      entidade_id: processoId,
      descricao: `Processo encerrado com resultado: ${resultado}. Observações: ${observacoes || 'Nenhuma'}`,
      tipo: 'update',
      dados_novos: { fase: 'encerrado', resultado, observacoes },
      user_agent: navigator.userAgent,
    };

    const { error } = await supabase.from('atividades').insert([activity]);

    if (error) {
      console.error('Erro ao registrar encerramento:', error);
    }
  } catch (err) {
    console.error('Erro ao registrar encerramento:', err);
  }
}
