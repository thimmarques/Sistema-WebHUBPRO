import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Documento, DocumentoCreate } from '@/types/documento';
import { useAuth } from '@/contexts/AuthContext';

export function useDocumentos(clienteId?: string, processoId?: string) {
  const { currentUser } = useAuth();
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDocumentos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('documentos')
        .select('*')
        .is('deleted_at', null);

      if (clienteId) {
        query = query.eq('cliente_id', clienteId);
      }

      if (processoId) {
        query = query.eq('processo_id', processoId);
      }

      const { data, error: fetchError } = await query.order('created_at', {
        ascending: false,
      });

      if (fetchError) throw fetchError;

      setDocumentos((data as Documento[]) || []);
    } catch (err) {
      console.error('Erro ao buscar documentos:', err);
      setError('Erro ao buscar documentos');
    } finally {
      setLoading(false);
    }
  }, [clienteId, processoId]);

  const createDocumento = useCallback(
    async (form: DocumentoCreate) => {
      try {
        if (!currentUser) throw new Error('Usuário não autenticado');

        const newDocumento: Documento = {
          id: crypto.randomUUID(),
          ...form,
          created_by: currentUser.id,
          created_at: new Date().toISOString(),
          nome_arquivo: form.nome, // Alias para compatibilidade
          data_upload: new Date().toISOString(),
          uploader_id: currentUser.id,
        } as Documento;

        const { error: insertError } = await supabase
          .from('documentos')
          .insert([newDocumento]);

        if (insertError) throw insertError;

        setDocumentos((prev) => [newDocumento, ...prev]);
        return { success: true, data: newDocumento };
      } catch (err) {
        console.error('Erro ao criar documento:', err);
        return { success: false, error: err };
      }
    },
    [currentUser]
  );

  const deleteDocumento = useCallback(
    async (id: string) => {
      try {
        if (!currentUser) throw new Error('Usuário não autenticado');

        const { error: deleteError } = await supabase
          .from('documentos')
          .update({
            deleted_at: new Date().toISOString(),
          })
          .eq('id', id);

        if (deleteError) throw deleteError;

        setDocumentos((prev) => prev.filter((d) => d.id !== id));
        return { success: true };
      } catch (err) {
        console.error('Erro ao deletar documento:', err);
        return { success: false, error: err };
      }
    },
    [currentUser]
  );

  useEffect(() => {
    fetchDocumentos();
  }, [fetchDocumentos]);

  return {
    documentos,
    loading,
    error,
    createDocumento,
    deleteDocumento,
    refetch: fetchDocumentos,
  };
}
