import React, { useState, useEffect } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Cliente } from '@/types/cliente';
import { useClientes } from '@/hooks/useClientes';
import { useEquipe } from '@/hooks/useEquipe';

interface ModalAssignAdvogadoProps {
  isOpen: boolean;
  cliente: Cliente | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function ModalAssignAdvogado({
  isOpen,
  cliente,
  onClose,
  onSuccess,
}: ModalAssignAdvogadoProps) {
  const { assignAdvogado } = useClientes();
  const { membros } = useEquipe();
  const [selectedAdvogadoId, setSelectedAdvogadoId] = useState('');
  const [tipo, setTipo] = useState<'principal' | 'secundario'>('secundario');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !cliente) return null;

  // Filtrar apenas advogados (conforme UserRole e mapeamento em useEquipe)
  const advogados = membros.filter((m) => m.role === 'advogado' || m.role === 'socio');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (!selectedAdvogadoId) {
        setError('Selecione um advogado');
        setIsLoading(false);
        return;
      }

      const result = await assignAdvogado(cliente.id, selectedAdvogadoId, tipo);

      if (!result.success) {
        setError(result.error || 'Erro ao atribuir advogado');
        setIsLoading(false);
        return;
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError('Erro ao atribuir advogado');
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md text-foreground">
        <h2 className="text-xl font-bold mb-4">Atribuir Advogado</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Cliente Info */}
          <div className="bg-gray-50 border border-border p-3 rounded-md">
            <p className="text-sm text-muted-foreground">Cliente</p>
            <p className="font-semibold">{cliente.nome}</p>
          </div>

          {/* Tipo de Atribuição */}
          <div>
            <label className="block text-sm font-medium mb-2">Tipo de Atribuição</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  value="principal"
                  checked={tipo === 'principal'}
                  onChange={(e) => setTipo(e.target.value as any)}
                  className="w-4 h-4 text-primary focus:ring-primary/20"
                />
                <span className="text-sm">Principal</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  value="secundario"
                  checked={tipo === 'secundario'}
                  onChange={(e) => setTipo(e.target.value as any)}
                  className="w-4 h-4 text-primary focus:ring-primary/20"
                />
                <span className="text-sm">Secundário</span>
              </label>
            </div>
          </div>

          {/* Advogado Selector */}
          <div>
            <label className="block text-sm font-medium mb-2">Advogado</label>
            <select
              value={selectedAdvogadoId}
              onChange={(e) => setSelectedAdvogadoId(e.target.value)}
              className="w-full bg-card border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            >
              <option value="">Selecione um advogado...</option>
              {advogados.map((adv) => (
                <option key={adv.id} value={adv.id}>
                  {adv.name} ({adv.oab || 'Sem OAB'})
                </option>
              ))}
            </select>
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
              disabled={isLoading}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Atribuindo...
                </>
              ) : (
                'Atribuir Advogado'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
