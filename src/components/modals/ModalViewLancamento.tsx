import React, { useState } from 'react';
import { AlertCircle, Loader2, Edit2, Trash2 } from 'lucide-react';
import { Lancamento } from '@/types/lancamento';
import { useLancamentos } from '@/hooks/useLancamentos';
import { useAuth } from '@/contexts/AuthContext';

interface ModalViewLancamentoProps {
  isOpen: boolean;
  lancamento: Lancamento | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function ModalViewLancamento({
  isOpen,
  lancamento,
  onClose,
  onSuccess,
}: ModalViewLancamentoProps) {
  const { updateLancamento, deleteLancamento } = useLancamentos();
  const { currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Record<string, any>>({});
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !lancamento) return null;

  const handleSaveEdit = async () => {
    setError(null);
    setIsLoading(true);

    try {
      const result = await updateLancamento(lancamento.id, editData);

      if (!result.success) {
        setError(result.error || 'Erro ao atualizar lançamento');
        setIsLoading(false);
        return;
      }

      setIsEditing(false);
      onSuccess();
      setIsLoading(false);
    } catch (err) {
      setError('Erro ao atualizar lançamento');
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja deletar este lançamento?')) return;

    setError(null);
    setIsLoading(true);

    try {
      if (!deleteLancamento) return;
      await deleteLancamento(lancamento.id);
      
      onSuccess();
      onClose();
    } catch (err) {
      setError('Erro ao deletar lançamento');
      setIsLoading(false);
    }
  };

  const canEdit = currentUser?.id === lancamento.created_by || currentUser?.role === 'admin';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md max-h-96 overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Detalhes do Lançamento</h2>
          {canEdit && !isEditing && (
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setIsEditing(true);
                  setEditData(lancamento);
                }}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-md"
                title="Editar"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={handleDelete}
                disabled={isLoading}
                className="p-2 text-red-600 hover:bg-red-50 rounded-md disabled:opacity-50"
                title="Deletar"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          </div>
        )}

        {!isLoading && (
          <div className="space-y-4">
            {/* Tipo */}
            <div>
              <label className="block text-sm font-medium text-gray-600">Tipo</label>
              <p className="text-sm font-semibold capitalize">{lancamento.tipo}</p>
            </div>

            {/* Valor */}
            <div>
              <label className="block text-sm font-medium text-gray-600">Valor</label>
              {isEditing ? (
                <input
                  type="number"
                  value={editData.valor || lancamento.valor}
                  onChange={(e) => setEditData({ ...editData, valor: parseFloat(e.target.value) })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                />
              ) : (
                <p className="text-sm font-semibold">
                  {lancamento.tipo === 'receita' ? '+' : '-'} R$ {lancamento.valor.toFixed(2)}
                </p>
              )}
            </div>

            {/* Data */}
            <div>
              <label className="block text-sm font-medium text-gray-600">Data</label>
              {isEditing ? (
                <input
                  type="date"
                  value={editData.data || lancamento.data}
                  onChange={(e) => setEditData({ ...editData, data: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                />
              ) : (
                <p className="text-sm font-semibold">{new Date(lancamento.data).toLocaleDateString('pt-BR')}</p>
              )}
            </div>

            {/* Descrição */}
            <div>
              <label className="block text-sm font-medium text-gray-600">Descrição</label>
              {isEditing ? (
                <textarea
                  value={editData.descricao || lancamento.descricao}
                  onChange={(e) => setEditData({ ...editData, descricao: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  rows={2}
                />
              ) : (
                <p className="text-sm">{lancamento.descricao}</p>
              )}
            </div>

            {/* Status Reconciliação */}
            <div>
              <label className="block text-sm font-medium text-gray-600">Status Reconciliação</label>
              <p className="text-sm font-semibold capitalize">{(lancamento as any).status_reconciliacao || 'Pendente'}</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3 flex gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-2 justify-end pt-4">
              {isEditing ? (
                <>
                  <button
                    onClick={() => setIsEditing(false)}
                    disabled={isLoading}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    disabled={isLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                  >
                    Salvar
                  </button>
                </>
              ) : (
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50"
                >
                  Fechar
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
