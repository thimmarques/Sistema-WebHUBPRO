import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Cliente, ClienteForm } from '@/types/cliente';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from './usePermissions';
import { logCreateCliente, logUpdateCliente, logDeleteCliente } from '@/services/activityLogger';

export function useClientes() {
  const { currentUser } = useAuth();
  const { currentScope } = usePermissions();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClientes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('clientes_base')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setClientes((data as Cliente[]) || []);
    } catch (err) {
      console.error('Erro ao buscar clientes:', err);
      setError('Erro ao buscar clientes');
    } finally {
      setLoading(false);
    }
  }, []);

  const filteredClientes = useMemo(() => {
    if (!clientes || !currentUser) return [];

    let filtered = [...clientes];

    if (currentUser.role === 'admin') {
      return filtered;
    }

    if (currentUser.role === 'advogado') {
      filtered = filtered.filter(
        (c) =>
          c.created_by === currentUser.id ||
          c.responsible_id === currentUser.id
      );
    }

    if (currentUser.role === 'estagiario') {
      filtered = filtered.filter(
        (c) =>
          c.responsible_id === currentUser.id ||
          c.created_by === currentUser.id
      );
    }

    return filtered;
  }, [clientes, currentUser]);

  const createCliente = useCallback(
    async (form: ClienteForm) => {
      try {
        if (!currentUser) throw new Error('Usuário não autenticado');

        const newCliente: Cliente = {
          id: crypto.randomUUID(),
          ...form,
          created_by: currentUser.id,
          responsible_id: form.responsible_id || currentUser.id,
          status: form.status || 'ativo',
          created_at: new Date().toISOString(),
          type: 'pf', // Valor padrão para evitar erro de lint se obrigatório
          practice_area: 'civil', // Valor padrão
          is_vip: false,
        } as Cliente;

        const { error: insertError } = await supabase
          .from('clientes_base')
          .insert([newCliente]);

        if (insertError) throw insertError;

        await logCreateCliente(currentUser.id, newCliente.id, newCliente.nome);
        setClientes((prev) => [newCliente, ...prev]);

        return { success: true, data: newCliente };
      } catch (err) {
        console.error('Erro ao criar cliente:', err);
        return { success: false, error: err };
      }
    },
    [currentUser]
  );

  const updateCliente = useCallback(
    async (id: string, updates: Partial<ClienteForm>) => {
      try {
        if (!currentUser) throw new Error('Usuário não autenticado');

        const clienteAtual = clientes.find((c) => c.id === id);
        if (!clienteAtual) throw new Error('Cliente não encontrado');

        const dadosAntigos = { ...clienteAtual };
        const dadosNovos = { ...clienteAtual, ...updates };

        const { error: updateError } = await supabase
          .from('clientes_base')
          .update({
            ...updates,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id);

        if (updateError) throw updateError;

        await logUpdateCliente(currentUser.id, id, clienteAtual.nome, dadosAntigos, dadosNovos);
        setClientes((prev) =>
          prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
        );

        return { success: true };
      } catch (err) {
        console.error('Erro ao atualizar cliente:', err);
        return { success: false, error: err };
      }
    },
    [clientes, currentUser]
  );

  const deleteCliente = useCallback(
    async (id: string) => {
      try {
        if (!currentUser) throw new Error('Usuário não autenticado');

        const clienteAtual = clientes.find((c) => c.id === id);
        if (!clienteAtual) throw new Error('Cliente não encontrado');

        const { error: deleteError } = await supabase
          .from('clientes_base')
          .update({
            deleted_at: new Date().toISOString(),
          })
          .eq('id', id);

        if (deleteError) throw deleteError;

        await logDeleteCliente(currentUser.id, id, clienteAtual.nome);
        setClientes((prev) => prev.filter((c) => c.id !== id));

        return { success: true };
      } catch (err) {
        console.error('Erro ao deletar cliente:', err);
        return { success: false, error: err };
      }
    },
    [clientes, currentUser]
  );

  const saveClientePolymorphic = useCallback(
    async (idOrCliente: string | Cliente, updates?: Partial<ClienteForm>) => {
      if (typeof idOrCliente === 'string') {
        return updateCliente(idOrCliente, updates || {});
      } else {
        const cliente = idOrCliente;
        const exists = clientes.some((c) => c.id === cliente.id);
        if (exists) {
          return updateCliente(cliente.id, cliente);
        } else {
          return createCliente(cliente);
        }
      }
    },
    [clientes, updateCliente, createCliente]
  );

  useEffect(() => {
    fetchClientes();
  }, [fetchClientes]);

  return {
    clientes: filteredClientes,
    loading,
    error,
    createCliente,
    updateCliente,
    deleteCliente,
    refetch: fetchClientes,
    saveCliente: saveClientePolymorphic,
  };
}
