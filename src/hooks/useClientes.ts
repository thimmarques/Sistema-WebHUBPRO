import { useState, useEffect, useCallback, useMemo } from 'react';
import { Cliente } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { usePermissions } from './usePermissions';

export function useClientes() {
  const { currentUser } = useAuth();
  const { role, currentScope } = usePermissions();
  
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filtrar clientes baseado em permissões (RBAC)
  const clientesFiltrados = useMemo(() => {
    let filtered = clientes;
    
    if (role === 'admin') {
      // Admin vê todos os clientes
      return filtered;
    } else if (role === 'advogado') {
      // Advogado vê clientes que criou, é responsável, ou seus estagiários criaram
      filtered = filtered.filter(c => 
        c.created_by === currentUser?.id || 
        c.responsible_id === currentUser?.id ||
        c.advogado_responsavel_id === currentUser?.id
      );
    } else if (role === 'estagiario') {
      // Estagiário vê clientes do seu advogado responsável
      filtered = filtered.filter(c => 
        c.advogado_responsavel_id === currentScope?.responsible_id ||
        c.created_by === currentUser?.id
      );
    }
    
    return filtered;
  }, [clientes, role, currentUser?.id, currentScope?.responsible_id]);

  // Carregar clientes do Supabase
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('clientes_base')
        .select('*')
        .is('deleted_at', null) // Excluir soft-deleted
        .order('created_at', { ascending: false });

      if (err) {
        throw err;
      }

      setClientes(data || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar clientes';
      setError(message);
      console.error('Erro ao carregar clientes:', err);
      setClientes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Carregar dados ao montar
  useEffect(() => {
    load();
  }, [load]);

  // Salvar cliente (CREATE ou UPDATE)
  const saveCliente = useCallback(async (cliente: Cliente) => {
    try {
      if (!currentUser?.id) {
        throw new Error('Usuário não autenticado');
      }

      const clienteData = {
        ...cliente,
        updated_at: new Date().toISOString(),
      };

      // Se é novo (não tem ID ou ID começa com 'cliente-')
      if (!cliente.id || cliente.id.startsWith('cliente-')) {
        // INSERT
        const { data, error: err } = await supabase
          .from('clientes_base')
          .insert([{
            ...clienteData,
            id: undefined, // Deixar BD gerar ID
            created_at: new Date().toISOString(),
            created_by: currentUser.id,
            responsible_id: currentUser.id,
          }])
          .select()
          .single();

        if (err) throw err;
        
        // Atualizar estado local
        setClientes(prev => [data, ...prev]);
        return data;
      } else {
        // UPDATE
        const { data, error: err } = await supabase
          .from('clientes_base')
          .update(clienteData)
          .eq('id', cliente.id)
          .select()
          .single();

        if (err) throw err;
        
        // Atualizar estado local
        setClientes(prev => prev.map(c => c.id === cliente.id ? data : c));
        return data;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao salvar cliente';
      setError(message);
      console.error('Erro ao salvar cliente:', err);
      throw err;
    }
  }, [currentUser?.id]);

  // Deletar cliente (soft delete)
  const deleteCliente = useCallback(async (id: string) => {
    try {
      if (!currentUser?.id) {
        throw new Error('Usuário não autenticado');
      }

      const { error: err } = await supabase
        .from('clientes_base')
        .update({ 
          deleted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (err) throw err;
      
      // Atualizar estado local
      setClientes(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao deletar cliente';
      setError(message);
      console.error('Erro ao deletar cliente:', err);
      throw err;
    }
  }, [currentUser?.id]);

  return {
    clientes: clientesFiltrados,
    loading,
    error,
    saveCliente,
    deleteCliente,
    reload: load,
  };
}
