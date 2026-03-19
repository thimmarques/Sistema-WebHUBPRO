import { useState, useEffect, useCallback, useMemo } from 'react';
import { Documento } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { usePermissions } from './usePermissions';

export function useDocumentos(clienteId?: string, processoId?: string) {
  const { currentUser } = useAuth();
  const { role, currentScope } = usePermissions();
  
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filtrar documentos baseado em permissões
  const documentosFiltrados = useMemo(() => {
    let filtered = documentos;
    
    // RBAC: Filtrar por escopo de acesso
    if (role === 'advogado') {
      // Advogado vê apenas documentos de clientes que criou ou é responsável
      filtered = filtered.filter(d => 
        d.uploader_id === currentUser?.id || 
        d.created_by === currentUser?.id
      );
    } else if (role === 'estagiario') {
      // Estagiário vê apenas documentos de clientes do seu advogado responsável
      filtered = filtered.filter(d => 
        d.uploader_id === currentScope?.responsible_id
      );
    }
    // Admin vê tudo
    
    // Filtrar por clienteId se fornecido
    if (clienteId) {
      filtered = filtered.filter(d => d.cliente_id === clienteId);
    }
    
    // Filtrar por processoId se fornecido
    if (processoId) {
      filtered = filtered.filter(d => d.processo_id === processoId);
    }
    
    // Ordenar por data decrescente
    return filtered.sort((a, b) => 
      new Date(b.data_upload).getTime() - new Date(a.data_upload).getTime()
    );
  }, [documentos, clienteId, processoId, role, currentUser?.id, currentScope?.responsible_id]);

  // Carregar documentos do Supabase
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from('documentos')
        .select('*')
        .is('deleted_at', null) // Excluir soft-deleted
        .order('data_upload', { ascending: false });

      // Filtrar por clienteId se fornecido
      if (clienteId) {
        query = query.eq('cliente_id', clienteId);
      }
      
      // Filtrar por processoId se fornecido
      if (processoId) {
        query = query.eq('processo_id', processoId);
      }

      const { data, error: err } = await query;

      if (err) {
        throw err;
      }

      setDocumentos(data || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar documentos';
      setError(message);
      console.error('Erro ao carregar documentos:', err);
      setDocumentos([]);
    } finally {
      setLoading(false);
    }
  }, [clienteId, processoId]);

  // Carregar dados ao montar ou quando clienteId/processoId mudar
  useEffect(() => {
    load();
  }, [load]);

  // Upload de documento
  const uploadDocumento = useCallback(async (documento: Documento) => {
    try {
      if (!currentUser?.id) {
        throw new Error('Usuário não autenticado');
      }

      const documentoData = {
        ...documento,
        uploader_id: currentUser.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error: err } = await supabase
        .from('documentos')
        .insert([documentoData])
        .select()
        .single();

      if (err) throw err;
      
      setDocumentos(prev => [data, ...prev]);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao fazer upload de documento';
      setError(message);
      console.error('Erro ao fazer upload de documento:', err);
      throw err;
    }
  }, [currentUser?.id]);

  // Deletar documento (soft delete)
  const deleteDocumento = useCallback(async (id: string) => {
    try {
      if (!currentUser?.id) {
        throw new Error('Usuário não autenticado');
      }

      const { error: err } = await supabase
        .from('documentos')
        .update({ 
          deleted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (err) throw err;
      
      setDocumentos(prev => prev.filter(d => d.id !== id));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao deletar documento';
      setError(message);
      console.error('Erro ao deletar documento:', err);
      throw err;
    }
  }, [currentUser?.id]);

  // Download de documento
  const downloadDocumento = useCallback(async (id: string) => {
    try {
      const documento = documentos.find(d => d.id === id);
      if (!documento) {
        throw new Error('Documento não encontrado');
      }

      // TODO: Implementar download do Supabase Storage
      console.log('Download de documento:', documento.url);
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao fazer download de documento';
      setError(message);
      console.error('Erro ao fazer download de documento:', err);
      throw err;
    }
  }, [documentos]);

  return {
    documentos: documentosFiltrados,
    loading,
    error,
    uploadDocumento,
    deleteDocumento,
    downloadDocumento,
    reload: load,
  };
}
