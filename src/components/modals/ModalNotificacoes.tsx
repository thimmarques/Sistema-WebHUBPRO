import React, { useState, useEffect } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useNotificacoes } from '@/hooks/useNotificacoes';

interface ModalNotificacoesProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ModalNotificacoes({
  isOpen,
  onClose,
  onSuccess,
}: ModalNotificacoesProps) {
  const { preferencias, updatePreferencias, loading: loadingPreferencias } = useNotificacoes();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    emailEnabled: true,
    smsEnabled: false,
    pushEnabled: true,
    emailFrequencia: 'imediato' as 'imediato' | 'diario' | 'semanal' | 'nunca',
    smsFrequencia: 'diario' as 'imediato' | 'diario' | 'semanal' | 'nunca',
    pushFrequencia: 'imediato' as 'imediato' | 'diario' | 'semanal' | 'nunca',
    notificarPrazos: true,
    notificarAudiencias: true,
    notificarLancamentos: true,
    notificarMensagens: true,
  });

  useEffect(() => {
    if (preferencias) {
      setFormData({
        emailEnabled: preferencias.emailEnabled,
        smsEnabled: preferencias.smsEnabled,
        pushEnabled: preferencias.pushEnabled,
        emailFrequencia: preferencias.emailFrequencia,
        smsFrequencia: preferencias.smsFrequencia,
        pushFrequencia: preferencias.pushFrequencia,
        notificarPrazos: preferencias.notificarPrazos,
        notificarAudiencias: preferencias.notificarAudiencias,
        notificarLancamentos: preferencias.notificarLancamentos,
        notificarMensagens: preferencias.notificarMensagens,
      });
    }
  }, [preferencias]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const result = await updatePreferencias(formData);

      if (!result.success) {
        setError(result.error || 'Erro ao atualizar preferências');
        setIsLoading(false);
        return;
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError('Erro ao atualizar preferências');
      setIsLoading(false);
    }
  };

  if (loadingPreferencias) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md max-h-96 overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Preferências de Notificações</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div className="border-b pb-4">
            <div className="flex items-center gap-2 mb-2">
              <input
                type="checkbox"
                id="emailEnabled"
                checked={formData.emailEnabled}
                onChange={(e) => setFormData({ ...formData, emailEnabled: e.target.checked })}
                className="w-4 h-4"
              />
              <label htmlFor="emailEnabled" className="text-sm font-medium">
                Notificações por Email
              </label>
            </div>
            {formData.emailEnabled && (
              <select
                value={formData.emailFrequencia}
                onChange={(e) => setFormData({ ...formData, emailFrequencia: e.target.value as any })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm ml-6"
              >
                <option value="imediato">Imediato</option>
                <option value="diario">Diário</option>
                <option value="semanal">Semanal</option>
                <option value="nunca">Nunca</option>
              </select>
            )}
          </div>

          {/* SMS */}
          <div className="border-b pb-4">
            <div className="flex items-center gap-2 mb-2">
              <input
                type="checkbox"
                id="smsEnabled"
                checked={formData.smsEnabled}
                onChange={(e) => setFormData({ ...formData, smsEnabled: e.target.checked })}
                className="w-4 h-4"
              />
              <label htmlFor="smsEnabled" className="text-sm font-medium">
                Notificações por SMS
              </label>
            </div>
            {formData.smsEnabled && (
              <select
                value={formData.smsFrequencia}
                onChange={(e) => setFormData({ ...formData, smsFrequencia: e.target.value as any })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm ml-6"
              >
                <option value="imediato">Imediato</option>
                <option value="diario">Diário</option>
                <option value="semanal">Semanal</option>
                <option value="nunca">Nunca</option>
              </select>
            )}
          </div>

          {/* Push */}
          <div className="border-b pb-4">
            <div className="flex items-center gap-2 mb-2">
              <input
                type="checkbox"
                id="pushEnabled"
                checked={formData.pushEnabled}
                onChange={(e) => setFormData({ ...formData, pushEnabled: e.target.checked })}
                className="w-4 h-4"
              />
              <label htmlFor="pushEnabled" className="text-sm font-medium">
                Notificações Push
              </label>
            </div>
            {formData.pushEnabled && (
              <select
                value={formData.pushFrequencia}
                onChange={(e) => setFormData({ ...formData, pushFrequencia: e.target.value as any })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm ml-6"
              >
                <option value="imediato">Imediato</option>
                <option value="diario">Diário</option>
                <option value="semanal">Semanal</option>
                <option value="nunca">Nunca</option>
              </select>
            )}
          </div>

          {/* Tipos de Notificações */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Notificar sobre:</p>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="notificarPrazos"
                checked={formData.notificarPrazos}
                onChange={(e) => setFormData({ ...formData, notificarPrazos: e.target.checked })}
                className="w-4 h-4"
              />
              <label htmlFor="notificarPrazos" className="text-sm">
                Prazos
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="notificarAudiencias"
                checked={formData.notificarAudiencias}
                onChange={(e) => setFormData({ ...formData, notificarAudiencias: e.target.checked })}
                className="w-4 h-4"
              />
              <label htmlFor="notificarAudiencias" className="text-sm">
                Audiências
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="notificarLancamentos"
                checked={formData.notificarLancamentos}
                onChange={(e) => setFormData({ ...formData, notificarLancamentos: e.target.checked })}
                className="w-4 h-4"
              />
              <label htmlFor="notificarLancamentos" className="text-sm">
                Lançamentos Financeiros
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="notificarMensagens"
                checked={formData.notificarMensagens}
                onChange={(e) => setFormData({ ...formData, notificarMensagens: e.target.checked })}
                className="w-4 h-4"
              />
              <label htmlFor="notificarMensagens" className="text-sm">
                Mensagens
              </label>
            </div>
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
                'Salvar Preferências'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
