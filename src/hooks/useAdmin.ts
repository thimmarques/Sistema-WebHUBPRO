import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  AdminUsuario,
  AdminUsuarioCreate,
  AdminUsuarioUpdate,
  AdminConfiguracoes,
  AdminBackup,
  AdminLog,
  FiltrosAdminLog,
  AdminResumo,
} from '@/types/admin';
import { useAuth } from '@/contexts/AuthContext';

export function useAdmin() {
  const { currentUser } = useAuth();
  const [usuarios, setUsuarios] = useState<AdminUsuario[]>([]);
  const [configuracoes, setConfiguracoes] = useState<AdminConfiguracoes[]>([]);
  const [backups, setBackups] = useState<AdminBackup[]>([]);
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ✅ NOVO: Buscar todos os usuários
  const getUsuarios = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('id, name, email, role, status, created_at, updated_at')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      const usuariosFormatados: AdminUsuario[] = (data || []).map((u) => ({
        id: u.id,
        nome: u.name,
        email: u.email,
        role: u.role,
        status: u.status || 'ativo',
        dataCreacao: u.created_at,
        ultimoLogin: u.updated_at,
      }));

      setUsuarios(usuariosFormatados);
      setLoading(false);
      return { success: true, data: usuariosFormatados };
    } catch (err) {
      console.error('Erro ao buscar usuários:', err);
      setError('Erro ao buscar usuários');
      setLoading(false);
      return { success: false, error: err instanceof Error ? err.message : 'Erro desconhecido' };
    }
  }, []);

  // ✅ NOVO: Criar novo usuário
  const createUsuario = useCallback(
    async (form: AdminUsuarioCreate) => {
      try {
        if (!currentUser || currentUser.role !== 'admin') {
          throw new Error('Apenas admins podem criar usuários');
        }

        // TODO: Integrar com Supabase Auth para criar usuário
        // Por enquanto, apenas inserir no profiles
        const { data, error: insertError } = await supabase
          .from('profiles')
          .insert([
            {
              name: form.nome,
              email: form.email,
              role: form.role,
              status: 'ativo',
              created_at: new Date().toISOString(),
            },
          ])
          .select();

        if (insertError) throw insertError;

        const novo: AdminUsuario = {
          id: data[0].id,
          nome: data[0].name,
          email: data[0].email,
          role: data[0].role,
          status: 'ativo',
          dataCreacao: data[0].created_at,
        };

        setUsuarios((prev) => [...prev, novo]);

        return { success: true, data: data[0] };
      } catch (err) {
        console.error('Erro ao criar usuário:', err);
        return { success: false, error: err instanceof Error ? err.message : 'Erro desconhecido' };
      }
    },
    [currentUser]
  );

  // ✅ NOVO: Atualizar usuário
  const updateUsuario = useCallback(
    async (usuarioId: string, updates: AdminUsuarioUpdate) => {
      try {
        if (!currentUser || currentUser.role !== 'admin') {
          throw new Error('Apenas admins podem atualizar usuários');
        }

        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            name: updates.nome,
            email: updates.email,
            role: updates.role,
            status: updates.status,
            updated_at: new Date().toISOString(),
          })
          .eq('id', usuarioId);

        if (updateError) throw updateError;

        setUsuarios((prev) =>
          prev.map((u) =>
            u.id === usuarioId
              ? {
                  ...u,
                  nome: updates.nome || u.nome,
                  email: updates.email || u.email,
                  role: updates.role || u.role,
                  status: updates.status || u.status,
                }
              : u
          )
        );

        return { success: true };
      } catch (err) {
        console.error('Erro ao atualizar usuário:', err);
        return { success: false, error: err instanceof Error ? err.message : 'Erro desconhecido' };
      }
    },
    [currentUser]
  );

  // ✅ NOVO: Deletar usuário (soft-delete via status)
  const deleteUsuario = useCallback(
    async (usuarioId: string) => {
      try {
        if (!currentUser || currentUser.role !== 'admin') {
          throw new Error('Apenas admins podem deletar usuários');
        }

        const { error: deleteError } = await supabase
          .from('profiles')
          .update({ status: 'inativo', updated_at: new Date().toISOString() })
          .eq('id', usuarioId);

        if (deleteError) throw deleteError;

        setUsuarios((prev) => prev.filter((u) => u.id !== usuarioId));

        return { success: true };
      } catch (err) {
        console.error('Erro ao deletar usuário:', err);
        return { success: false, error: err instanceof Error ? err.message : 'Erro desconhecido' };
      }
    },
    [currentUser]
  );

  // ✅ NOVO: Buscar logs do sistema
  const getLogsDoSistema = useCallback(async (filtros?: FiltrosAdminLog) => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('atividades')
        .select('*')
        .order('created_at', { ascending: false });

      if (filtros?.tipo) {
        query = query.eq('tipo', filtros.tipo);
      }

      if (filtros?.usuario) {
        query = query.eq('usuario_id', filtros.usuario);
      }

      if (filtros?.dataInicio && filtros?.dataFim) {
        query = query.gte('created_at', filtros.dataInicio).lte('created_at', filtros.dataFim);
      }

      if (filtros?.busca) {
        query = query.ilike('descricao', `%${filtros.busca}%`);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      const logsFormatados: AdminLog[] = (data || []).map((log) => ({
        id: log.id,
        timestamp: log.created_at,
        tipo: 'info' as const, // TODO: Mapear tipo de atividade para tipo de log
        modulo: log.entidade,
        mensagem: log.descricao,
        usuario: log.usuario_id,
        contexto: {
          entidadeId: log.entidade_id,
          dadosAntigos: log.dados_antigos,
          dadosNovos: log.dados_novos,
        },
      }));

      setLogs(logsFormatados);
      setLoading(false);
      return { success: true, data: logsFormatados };
    } catch (err) {
      console.error('Erro ao buscar logs do sistema:', err);
      setError('Erro ao buscar logs');
      setLoading(false);
      return { success: false, error: err instanceof Error ? err.message : 'Erro desconhecido' };
    }
  }, []);

  // ✅ NOVO: Buscar resumo administrativo
  const getAdminResumo = useCallback(async (): Promise<AdminResumo | null> => {
    try {
      // Contar usuários
      const { data: usuariosData, error: usuariosError } = await supabase
        .from('profiles')
        .select('status');

      if (usuariosError) throw usuariosError;

      const totalUsuarios = usuariosData?.length || 0;
      const usuariosAtivos = usuariosData?.filter((u) => u.status === 'ativo').length || 0;
      const usuariosInativos = usuariosData?.filter((u) => u.status === 'inativo').length || 0;

      // Contar logs de hoje
      const hoje = new Date();
      const { data: logsHoje, error: logsError } = await supabase
        .from('atividades')
        .select('*')
        .gte('created_at', hoje.toISOString().split('T')[0]);

      if (logsError) throw logsError;

      const totalLogsHoje = logsHoje?.length || 0;

      // Contar erros de hoje
      const errosHoje = logsHoje?.filter((log) => log.tipo === 'error').length || 0;

      return {
        totalUsuarios,
        usuariosAtivos,
        usuariosInativos,
        ultimoBackup: undefined, // TODO: Buscar último backup
        statusBackupAutomatico: 'ativo',
        logsHoje: totalLogsHoje,
        errosHoje,
        ultimoErro: undefined, // TODO: Buscar último erro
      };
    } catch (err) {
      console.error('Erro ao buscar resumo administrativo:', err);
      return null;
    }
  }, []);

  useEffect(() => {
    if (currentUser?.role === 'admin') {
      getUsuarios();
    }
  }, [currentUser, getUsuarios]);

  return {
    usuarios,
    configuracoes,
    backups,
    logs,
    loading,
    error,
    getUsuarios,
    createUsuario,
    updateUsuario,
    deleteUsuario,
    getLogsDoSistema,
    getAdminResumo,
  };
}
