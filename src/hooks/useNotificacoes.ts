import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { NotificacaoPreferencias, NotificacaoPreferenciasUpdate } from '@/types/notificacao';
import { useAuth } from '@/contexts/AuthContext';

export function useNotificacoes() {
  const { currentUser } = useAuth();
  const [preferencias, setPreferencias] = useState<NotificacaoPreferencias | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ✅ NOVO: Buscar preferências de notificações
  const fetchPreferencias = useCallback(async () => {
    try {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('notificacoes_preferencias')
        .select('*')
        .eq('user_id', currentUser.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        // PGRST116 = no rows found, que é esperado para novo usuário
        throw fetchError;
      }

      if (data) {
        setPreferencias(data as NotificacaoPreferencias);
      } else {
        // Criar preferências padrão se não existirem
        const defaultPreferencias: NotificacaoPreferencias = {
          userId: currentUser.id,
          emailEnabled: true,
          smsEnabled: false,
          pushEnabled: true,
          emailFrequencia: 'imediato',
          smsFrequencia: 'diario',
          pushFrequencia: 'imediato',
          notificarPrazos: true,
          notificarAudiencias: true,
          notificarLancamentos: true,
          notificarMensagens: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const { error: insertError } = await supabase
          .from('notificacoes_preferencias')
          .insert([defaultPreferencias]);

        if (insertError) throw insertError;

        setPreferencias(defaultPreferencias);
      }

      setLoading(false);
    } catch (err) {
      console.error('Erro ao buscar preferências de notificações:', err);
      setError('Erro ao buscar preferências');
      setLoading(false);
    }
  }, [currentUser]);

  // ✅ NOVO: Atualizar preferências de notificações
  const updatePreferencias = useCallback(
    async (updates: NotificacaoPreferenciasUpdate) => {
      try {
        if (!currentUser) throw new Error('Usuário não autenticado');
        if (!preferencias) throw new Error('Preferências não carregadas');

        const { error: updateError } = await supabase
          .from('notificacoes_preferencias')
          .update({
            ...updates,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', currentUser.id);

        if (updateError) throw updateError;

        // Registrar auditoria
        await logNotificacoesUpdate(currentUser.id, updates);

        // Atualizar estado local
        setPreferencias((prev) => (prev ? { ...prev, ...updates } : null));

        return { success: true };
      } catch (err) {
        console.error('Erro ao atualizar preferências:', err);
        return { success: false, error: err instanceof Error ? err.message : 'Erro desconhecido' };
      }
    },
    [currentUser, preferencias]
  );

  useEffect(() => {
    fetchPreferencias();
  }, [fetchPreferencias]);

  return {
    preferencias,
    loading,
    error,
    updatePreferencias,
    refetch: fetchPreferencias,
  };
}

// ✅ NOVO: Função auxiliar para log de auditoria
async function logNotificacoesUpdate(userId: string, updates: NotificacaoPreferenciasUpdate) {
  try {
    const { supabase: sb } = await import('@/lib/supabase');

    const activity = {
      usuario_id: userId,
      entidade: 'notificacoes_preferencias',
      entidade_id: userId,
      descricao: `Preferências de notificações atualizadas`,
      tipo: 'update',
      dados_novos: updates,
      user_agent: navigator.userAgent,
    };

    const { error } = await sb.from('atividades').insert([activity]);

    if (error) {
      console.error('Erro ao registrar atualização de notificações:', error);
    }
  } catch (err) {
    console.error('Erro ao registrar atualização de notificações:', err);
  }
}
