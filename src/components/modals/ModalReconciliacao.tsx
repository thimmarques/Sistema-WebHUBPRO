import React, { useState } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Lancamento } from '@/types/lancamento';
import { useLancamentos } from '@/hooks/useLancamentos';

interface ModalReconciliacaoProps {
  isOpen: boolean;
  lancamento: Lancamento | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function ModalReconciliacao({
  isOpen,
  lancamento,
  onClose,
  onSuccess,
}: ModalReconciliacaoProps) {
  const { reconciliarLancamento } = useLancamentos();
  const [statusReconciliacao, setStatusReconciliacao] = useState('reconciliado');
  const [observacoes, setObservacoes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !lancamento) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (!reconciliarLancamento) return;
      
      const result = await reconciliarLancamento(lancamento.id, statusReconciliacao, observacoes);

      if (!result.success) {
        setError(result.error || 'Erro ao reconciliar lançamento');
        setIsLoading(false);
        return;
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError('Erro ao reconciliar lançamento');
      setIsLoading(false);
    }
  };

  const statusOptions = [
    { value: 'pendente', label: 'Pendente', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'reconciliado', label: 'Reconciliado', color: 'bg-green-100 text-green-800' },
    { value: 'divergencia', label: 'Divergência', color: 'bg-red-100 text-red-800' },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Reconciliar Lançamento</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Lançamento Info */}
          <div className="bg-gray-50 p-3 rounded-md">
            <p className="text-sm text-gray-600">Lançamento</p>
            <p className="font-semibold">{lancamento.descricao}</p>
            <p className="text-sm text-gray-500">
              Valor: {lancamento.tipo === 'receita' ? '+' : '-'} R$ {lancamento.valor.toFixed(2)}
            </p>
            <p className="text-sm text-gray-500">
              Status atual: {(lancamento as any).status_reconciliacao || 'Pendente'}
            </p>
          </div>

          {/* Status Selector */}
          <div>
            <label className="block text-sm font-medium mb-2">Novo Status</label>
            <select
              value={statusReconciliacao}
              onChange={(e) => setStatusReconciliacao(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Observações */}
          <div>
            <label className="block text-sm font-medium mb-2">Observações (Opcional)</label>
            <textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Adicione observações sobre a reconciliação..."
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
                  Reconciliando...
                </>
              ) : (
                'Reconciliar'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
