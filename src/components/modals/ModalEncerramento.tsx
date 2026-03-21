import React, { useState } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Processo } from '@/types/processo';
import { useProcessos } from '@/hooks/useProcessos';

interface ModalEncerramentoProps {
  isOpen: boolean;
  processo: Processo | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function ModalEncerramento({
  isOpen,
  processo,
  onClose,
  onSuccess,
}: ModalEncerramentoProps) {
  const { encerrarProcesso } = useProcessos();
  const [resultado, setResultado] = useState('ganho');
  const [observacoes, setObservacoes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !processo) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const result = await encerrarProcesso(processo.id, resultado, observacoes);

      if (!result.success) {
        setError(result.error || 'Erro ao encerrar processo');
        setIsLoading(false);
        return;
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError('Erro ao encerrar processo');
      setIsLoading(false);
    }
  };

  const resultadoOptions = [
    { value: 'ganho', label: 'Ganho', color: 'bg-green-100 text-green-800' },
    { value: 'perdido', label: 'Perdido', color: 'bg-red-100 text-red-800' },
    { value: 'desistencia', label: 'Desistência', color: 'bg-gray-100 text-gray-800' },
    { value: 'acordo', label: 'Acordo', color: 'bg-blue-100 text-blue-800' },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md text-slate-900 border border-slate-200">
        <h2 className="text-xl font-bold mb-4">Encerrar Processo</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Processo Info */}
          <div className="bg-gray-50 p-3 rounded-md">
            <p className="text-sm text-gray-600">Processo</p>
            <p className="font-semibold">{processo.numero_cnj}</p>
            <p className="text-sm text-gray-500">Fase atual: {processo.fase}</p>
          </div>

          {/* Resultado Selector */}
          <div>
            <label className="block text-sm font-medium mb-2">Resultado</label>
            <select
              value={resultado}
              onChange={(e) => setResultado(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {resultadoOptions.map((option) => (
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
              placeholder="Adicione observações sobre o encerramento..."
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400 bg-white"
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
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50 disabled:opacity-50 text-slate-600"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Encerrando...
                </>
              ) : (
                'Encerrar Processo'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
