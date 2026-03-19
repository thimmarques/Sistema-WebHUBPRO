import React, { useState, useEffect } from 'react';
import { Evento } from '../../types';
import { useEventos } from '../../hooks/useEventos';
import { useAuth } from '../../hooks/useAuth';
import { usePermissions } from '../../hooks/usePermissions';
import { logCreate, logUpdate, Descriptions } from '../../services/activityLogger';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Textarea } from '../ui/textarea';

export interface ModalAudienciaProps {
  isOpen: boolean;
  onClose: () => void;
  processoId: string;
  eventoId?: string; // Se fornecido, é edição
  onSuccess?: () => void;
}

export function ModalAudiencia({
  isOpen,
  onClose,
  processoId,
  eventoId,
  onSuccess,
}: ModalAudienciaProps) {
  const { currentUser } = useAuth();
  const { canCreate } = usePermissions();
  const { eventos, saveEvento } = useEventos(processoId);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const eventoExistente = eventoId ? eventos.find(e => e.id === eventoId) : null;

  const [formData, setFormData] = useState({
    tipo: 'audiencia' as const,
    data_inicio: '',
    hora_inicio: '',
    local: '',
    descricao: '',
    resultado: '',
  });

  useEffect(() => {
    if (eventoExistente) {
      const dataInicio = new Date(eventoExistente.data_inicio);
      const hora = dataInicio.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      });

      setFormData({
        tipo: eventoExistente.tipo as any,
        data_inicio: dataInicio.toISOString().split('T')[0],
        hora_inicio: hora,
        local: eventoExistente.local || '',
        descricao: eventoExistente.descricao || '',
        resultado: eventoExistente.resultado || '',
      });
    } else {
      setFormData({
        tipo: 'audiencia',
        data_inicio: '',
        hora_inicio: '',
        local: '',
        descricao: '',
        resultado: '',
      });
    }
  }, [eventoExistente, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.data_inicio) {
      newErrors.data_inicio = 'Data é obrigatória';
    } else {
      const dataEvento = new Date(formData.data_inicio);
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      if (dataEvento < hoje && !eventoExistente) {
        newErrors.data_inicio = 'Data não pode ser no passado';
      }
    }

    if (!formData.hora_inicio) {
      newErrors.hora_inicio = 'Hora é obrigatória';
    } else if (!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(formData.hora_inicio)) {
      newErrors.hora_inicio = 'Hora inválida (use HH:mm)';
    }

    if (!formData.local) {
      newErrors.local = 'Local é obrigatório';
    }

    if (!formData.descricao) {
      newErrors.descricao = 'Descrição é obrigatória';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;
    if (!currentUser?.id) return;

    setLoading(true);

    try {
      const dataCompleta = new Date(`${formData.data_inicio}T${formData.hora_inicio}`);

      const evento: Evento = {
        id: eventoExistente?.id || `evento-${Date.now()}`,
        processo_id: processoId,
        tipo: formData.tipo,
        data_inicio: dataCompleta.toISOString(),
        data_fim: dataCompleta.toISOString(),
        data: formData.data_inicio,
        hora_inicio: formData.hora_inicio,
        hora_fim: formData.hora_inicio,
        local: formData.local,
        descricao: formData.descricao,
        title: formData.descricao,
        resultado: formData.resultado || null,
        notes: formData.resultado || '',
        status: 'pendente',
        audiencia_status: 'agendada',
        created_at: eventoExistente?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: eventoExistente?.created_by || currentUser.id,
        responsible_id: currentUser.id,
        deleted_at: null,
        cliente_nome: eventoExistente?.cliente_nome || '',
      };

      await saveEvento(evento);

      // Log de auditoria
      if (eventoExistente) {
        await logUpdate(
          currentUser.id,
          'evento',
          evento.id,
          eventoExistente,
          evento,
          Descriptions.EVENTO_ATUALIZADO
        );
      } else {
        await logCreate(
          currentUser.id,
          'evento',
          evento.id,
          evento,
          Descriptions.EVENTO_CRIADO
        );
      }

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Erro ao salvar audiência:', error);
      setErrors({ submit: 'Erro ao salvar audiência' });
    } finally {
      setLoading(false);
    }
  };

  if (!canCreate) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Acesso Negado</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">
            Você não tem permissão para criar audiências.
          </p>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {eventoExistente ? 'Editar Audiência' : 'Nova Audiência'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="data_inicio">Data *</Label>
              <Input
                id="data_inicio"
                type="date"
                value={formData.data_inicio}
                onChange={(e) =>
                  setFormData({ ...formData, data_inicio: e.target.value })
                }
                className={errors.data_inicio ? 'border-red-500' : ''}
              />
              {errors.data_inicio && (
                <p className="text-xs text-red-500 mt-1">{errors.data_inicio}</p>
              )}
            </div>

            <div>
              <Label htmlFor="hora_inicio">Hora *</Label>
              <Input
                id="hora_inicio"
                type="time"
                value={formData.hora_inicio}
                onChange={(e) =>
                  setFormData({ ...formData, hora_inicio: e.target.value })
                }
                className={errors.hora_inicio ? 'border-red-500' : ''}
              />
              {errors.hora_inicio && (
                <p className="text-xs text-red-500 mt-1">{errors.hora_inicio}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="tipo">Tipo de Evento *</Label>
            <Select
              value={formData.tipo}
              onValueChange={(value: any) =>
                setFormData({ ...formData, tipo: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="audiencia">Audiência</SelectItem>
                <SelectItem value="diligencia">Diligência</SelectItem>
                <SelectItem value="prazo">Prazo</SelectItem>
                <SelectItem value="outro">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="local">Local *</Label>
            <Input
              id="local"
              placeholder="Ex: Fórum de São Paulo, Sala 101"
              value={formData.local}
              onChange={(e) => setFormData({ ...formData, local: e.target.value })}
              className={errors.local ? 'border-red-500' : ''}
            />
            {errors.local && (
              <p className="text-xs text-red-500 mt-1">{errors.local}</p>
            )}
          </div>

          <div>
            <Label htmlFor="descricao">Descrição *</Label>
            <Textarea
              id="descricao"
              placeholder="Descreva a audiência ou evento"
              value={formData.descricao}
              onChange={(e) =>
                setFormData({ ...formData, descricao: e.target.value })
              }
              rows={3}
              className={errors.descricao ? 'border-red-500' : ''}
            />
            {errors.descricao && (
              <p className="text-xs text-red-500 mt-1">{errors.descricao}</p>
            )}
          </div>

          <div>
            <Label htmlFor="resultado">Resultado</Label>
            <Textarea
              id="resultado"
              placeholder="Resultado da audiência (preenchido após o evento)"
              value={formData.resultado}
              onChange={(e) =>
                setFormData({ ...formData, resultado: e.target.value })
              }
              rows={2}
            />
          </div>

          {errors.submit && (
            <p className="text-sm text-red-600">{errors.submit}</p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar Audiência'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
