import React, { useState } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Processo } from '@/types/processo';
import { useProcessos } from '@/hooks/useProcessos';

interface ModalChangePhaseProps {
  isOpen: boolean;
  processo: Processo | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function ModalChangePhase({
  isOpen,
  processo,
  onClose,
  onSuccess,
}: ModalChangePhaseProps) {
  const { changeProcessoPhase } = useProcessos();
  const [newFase, setNewFase] = useState('sentenciado');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !processo) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const result = await changeProcessoPhase(processo.id, newFase);

      if (!result.success) {
        setError(result.error || 'Erro ao alterar fase');
        setIsLoading(false);
        return;
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError('Erro ao alterar fase');
      setIsLoading(false);
    }
  };

  const faseOptions = [
    { value: 'ativo', label: 'Ativo', color: 'bg-blue-100 text-blue-800' },
    { value: 'sentenciado', label: 'Sentenciado', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'encerrado', label: 'Encerrado', color: 'bg-red-100 text-red-800' },
  ];

  // Filtrar apenas fases permitidas baseado na fase atual
  const allowedFases = faseOptions.filter((f) => {
    if (processo.fase === 'ativo') return f.value !== 'ativo';
    if (processo.fase === 'sentenciado') return f.value !== 'sentenciado' && f.value !== 'ativo';
    return false;
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md text-slate-900 border border-slate-200">
        <h2 className="text-xl font-bold mb-4">Alterar Fase do Processo</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Processo Info */}
          <div className="bg-gray-50 p-3 rounded-md">
            <p className="text-sm text-gray-600">Processo</p>
            <p className="font-semibold">{processo.numero_cnj}</p>
            <p className="text-sm text-gray-500">Fase atual: {processo.fase}</p>
          </div>

          {/* Fase Selector */}
          <div>
            <label className="block text-sm font-medium mb-2">Nova Fase</label>
            {allowedFases.length === 0 ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                <p className="text-sm text-yellow-700">
                  Nenhuma transição de fase permitida para este processo
                </p>
              </div>
            ) : (
              <select
                value={newFase}
                onChange={(e) => setNewFase(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {allowedFases.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
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
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50 disabled:opacity-50 text-slate-600"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading || allowedFases.length === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Alterando...
                </>
              ) : (
                'Alterar Fase'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
