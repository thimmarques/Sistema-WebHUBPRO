import React, { useState, useEffect } from 'react';
import { AlertCircle, Loader2, Edit2, Trash2, X } from 'lucide-react';
import { Evento } from '@/types/evento';
import { useEventos } from '@/hooks/useEventos';
import { useAuth } from '@/contexts/AuthContext';

interface ModalViewEventoProps {
  isOpen: boolean;
  eventoId: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function ModalViewEvento({
  isOpen,
  eventoId,
  onClose,
  onSuccess,
}: ModalViewEventoProps) {
  const { getEventoById, updateEvento, deleteEvento } = useEventos();
  const { currentUser } = useAuth();
  const [evento, setEvento] = useState<Evento | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Record<string, any>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && eventoId) {
      loadEvento();
    } else if (!isOpen) {
      setEvento(null);
      setIsEditing(false);
    }
  }, [isOpen, eventoId]);

  const loadEvento = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await getEventoById(eventoId!);

      if (!result.success) {
        setError(result.error || 'Erro ao carregar evento');
        setIsLoading(false);
        return;
      }

      setEvento(result.data);
      setEditData(result.data);
      setIsLoading(false);
    } catch (err) {
      setError('Erro ao carregar evento');
      setIsLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    setError(null);
    setIsLoading(true);

    try {
      const result = await updateEvento(eventoId!, editData);

      if (!result.success) {
        setError(result.error || 'Erro ao atualizar evento');
        setIsLoading(false);
        return;
      }

      setEvento({ ...evento!, ...editData });
      setIsEditing(false);
      onSuccess();
      setIsLoading(false);
    } catch (err) {
      setError('Erro ao atualizar evento');
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja deletar este evento?')) return;

    setError(null);
    setIsLoading(true);

    try {
      const result = await deleteEvento(eventoId!);

      if (!result.success) {
        setError(result.error || 'Erro ao deletar evento');
        setIsLoading(false);
        return;
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError('Erro ao deletar evento');
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const canEdit = currentUser?.id === evento?.created_by || currentUser?.role === 'admin';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto text-slate-900 border border-slate-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Detalhes do Evento</h2>
          <div className="flex items-center gap-2">
            {canEdit && !isEditing && evento && (
              <div className="flex gap-2">
                <button
                  onClick={() => setIsEditing(true)}
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
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-md">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {isLoading && !evento && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          </div>
        )}

        {!isLoading && evento && (
          <div className="space-y-4">
            {/* Tipo */}
            <div>
              <label className="block text-sm font-medium text-gray-600">Tipo</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editData.tipo || ''}
                  onChange={(e) => setEditData({ ...editData, tipo: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              ) : (
                <p className="text-sm font-semibold">{evento.tipo}</p>
              )}
            </div>

            {/* Data */}
            <div>
              <label className="block text-sm font-medium text-gray-600">Data</label>
              {isEditing ? (
                <input
                  type="datetime-local"
                  value={editData.data ? new Date(editData.data).toISOString().slice(0, 16) : ''}
                  onChange={(e) => setEditData({ ...editData, data: new Date(e.target.value).toISOString() })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              ) : (
                <p className="text-sm font-semibold">
                  {evento.data ? new Date(evento.data).toLocaleString('pt-BR') : 'N/A'}
                </p>
              )}
            </div>

            {/* Descrição */}
            <div>
              <label className="block text-sm font-medium text-gray-600">Descrição</label>
              {isEditing ? (
                <textarea
                  value={editData.descricao || ''}
                  onChange={(e) => setEditData({ ...editData, descricao: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400 bg-white"
                  rows={3}
                />
              ) : (
                <p className="text-sm text-slate-700">{evento.descricao || 'Sem descrição'}</p>
              )}
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
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50 disabled:opacity-50 text-slate-600"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    disabled={isLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                    Salvar
                  </button>
                </>
              ) : (
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50 text-slate-600"
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
