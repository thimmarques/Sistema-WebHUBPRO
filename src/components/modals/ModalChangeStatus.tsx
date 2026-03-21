import React, { useState } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Cliente } from '@/types/cliente';
import { useClientes } from '@/hooks/useClientes';

interface ModalChangeStatusProps {
  isOpen: boolean;
  cliente: Cliente | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function ModalChangeStatus({
  isOpen,
  cliente,
  onClose,
  onSuccess,
}: ModalChangeStatusProps) {
  const { changeClientStatus } = useClientes();
  const [newStatus, setNewStatus] = useState<'ativo' | 'inativo' | 'suspenso' | 'encerrado'>('ativo');
  const [motivo, setMotivo] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !cliente) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (!motivo.trim()) {
        setError('Motivo é obrigatório');
        setIsLoading(false);
        return;
      }

      const result = await changeClientStatus(cliente.id, newStatus, motivo);

      if (!result.success) {
        setError(result.error || 'Erro ao alterar status');
        setIsLoading(false);
        return;
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError('Erro ao alterar status');
      setIsLoading(false);
    }
  };

  const statusOptions = [
    { value: 'ativo', label: 'Ativo', color: 'bg-green-100 text-green-800' },
    { value: 'inativo', label: 'Inativo', color: 'bg-gray-100 text-gray-800' },
    { value: 'suspenso', label: 'Suspenso', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'encerrado', label: 'Encerrado', color: 'bg-red-100 text-red-800' },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Alterar Status do Cliente</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Cliente Info */}
          <div className="bg-gray-50 p-3 rounded-md">
            <p className="text-sm text-gray-600">Cliente</p>
            <p className="font-semibold">{cliente.nome}</p>
            <p className="text-sm text-gray-500">Status atual: {cliente.status}</p>
          </div>

          {/* Status Selector */}
          <div>
            <label className="block text-sm font-medium mb-2">Novo Status</label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as any)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Motivo */}
          <div>
            <label className="block text-sm font-medium mb-2">Motivo da Alteração</label>
            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Descreva o motivo da alteração..."
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 flex gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Alterar Status'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
