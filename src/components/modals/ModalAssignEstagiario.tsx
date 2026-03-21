import React, { useState } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Cliente } from '@/types/cliente';
import { useClientes } from '@/hooks/useClientes';
import { useEquipe } from '@/hooks/useEquipe';

interface ModalAssignEstagiarioProps {
  isOpen: boolean;
  cliente: Cliente | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function ModalAssignEstagiario({
  isOpen,
  cliente,
  onClose,
  onSuccess,
}: ModalAssignEstagiarioProps) {
  const { assignEstagiario } = useClientes();
  const { membros } = useEquipe();
  const [selectedEstagiarioId, setSelectedEstagiarioId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !cliente) return null;

  // Filtrar estagiários ativos
  const estagiarios = membros.filter(
    (m) =>
      m.role === 'estagiario'
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (!selectedEstagiarioId) {
        setError('Selecione um estagiário');
        setIsLoading(false);
        return;
      }

      const result = await assignEstagiario(cliente.id, selectedEstagiarioId);

      if (!result.success) {
        setError(result.error || 'Erro ao atribuir estagiário');
        setIsLoading(false);
        return;
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError('Erro ao atribuir estagiário');
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md text-foreground">
        <h2 className="text-xl font-bold mb-4">Atribuir Estagiário</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Cliente Info */}
          <div className="bg-gray-50 border border-border p-3 rounded-md">
            <p className="text-sm text-muted-foreground">Cliente</p>
            <p className="font-semibold">{cliente.nome}</p>
          </div>

          {/* Estagiário Selector */}
          <div>
            <label className="block text-sm font-medium mb-2">Estagiário</label>
            {estagiarios.length === 0 ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                <p className="text-sm text-yellow-700">
                  Nenhum estagiário disponível no sistema.
                </p>
              </div>
            ) : (
              <select
                value={selectedEstagiarioId}
                onChange={(e) => setSelectedEstagiarioId(e.target.value)}
                className="w-full bg-card border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              >
                <option value="">Selecione um estagiário...</option>
                {estagiarios.map((est) => (
                  <option key={est.id} value={est.id}>
                    {est.name}
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
          <div className="flex gap-3 justify-end mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 border border-border rounded-md text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading || estagiarios.length === 0}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Atribuindo...
                </>
              ) : (
                'Atribuir Estagiário'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
