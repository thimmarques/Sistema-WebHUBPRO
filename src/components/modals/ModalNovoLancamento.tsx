import React, { useState } from 'react';
import { Lancamento } from '../../types';
import { useLancamentos } from '../../hooks/useLancamentos';
import { useAuth } from '../../hooks/useAuth';
import { usePermissions } from '../../hooks/usePermissions';
import { logCreate, Descriptions } from '../../services/activityLogger';
import { formatCurrency } from '../../lib/formatters';
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

export interface ModalNovoLancamentoProps {
  isOpen: boolean;
  onClose: () => void;
  clienteId: string;
  processoId?: string;
  onSuccess?: () => void;
}

export function ModalNovoLancamento({
  isOpen,
  onClose,
  clienteId,
  processoId,
  onSuccess,
}: ModalNovoLancamentoProps) {
  const { currentUser } = useAuth();
  const { canCreate } = usePermissions();
  const { saveLancamento } = useLancamentos();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    data: new Date().toISOString().split('T')[0],
    descricao: '',
    tipo: 'receita' as 'receita' | 'despesa',
    valor: '',
    status: 'pendente' as 'pendente' | 'pago' | 'cancelado',
    categoria: '',
    observacoes: '',
  });

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.data) {
      newErrors.data = 'Data é obrigatória';
    }

    if (!formData.descricao) {
      newErrors.descricao = 'Descrição é obrigatória';
    }

    if (!formData.valor) {
      newErrors.valor = 'Valor é obrigatório';
    } else if (isNaN(parseFloat(formData.valor)) || parseFloat(formData.valor) <= 0) {
      newErrors.valor = 'Valor deve ser maior que 0';
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
      const novoLancamento: Lancamento = {
        id: `lancamento-${Date.now()}`,
        cliente_id: clienteId,
        processo_id: processoId || null,
        tipo: formData.tipo,
        data: new Date(formData.data).toISOString(),
        descricao: formData.descricao,
        valor: parseFloat(formData.valor),
        status: formData.status,
        categoria: formData.categoria || null,
        observacoes: formData.observacoes || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: currentUser.id,
        responsible_id: currentUser.id,
        deleted_at: null,
      };

      await saveLancamento(novoLancamento);

      // Log de auditoria
      await logCreate(
        currentUser.id,
        'lancamento',
        novoLancamento.id,
        novoLancamento,
        Descriptions.LANCAMENTO_CRIADO
      );

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Erro ao salvar lançamento:', error);
      setErrors({ submit: 'Erro ao salvar lançamento' });
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
            Você não tem permissão para criar lançamentos.
          </p>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Novo Lançamento</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="data">Data *</Label>
              <Input
                id="data"
                type="date"
                value={formData.data}
                onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                className={errors.data ? 'border-red-500' : ''}
              />
              {errors.data && (
                <p className="text-xs text-red-500 mt-1">{errors.data}</p>
              )}
            </div>

            <div>
              <Label htmlFor="tipo">Tipo *</Label>
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
                  <SelectItem value="receita">Receita</SelectItem>
                  <SelectItem value="despesa">Despesa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="descricao">Descrição *</Label>
            <Input
              id="descricao"
              placeholder="Ex: Honorários, Custas processuais, etc."
              value={formData.descricao}
              onChange={(e) =>
                setFormData({ ...formData, descricao: e.target.value })
              }
              className={errors.descricao ? 'border-red-500' : ''}
            />
            {errors.descricao && (
              <p className="text-xs text-red-500 mt-1">{errors.descricao}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="valor">Valor (R$) *</Label>
              <Input
                id="valor"
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                value={formData.valor}
                onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                className={errors.valor ? 'border-red-500' : ''}
              />
              {errors.valor && (
                <p className="text-xs text-red-500 mt-1">{errors.valor}</p>
              )}
            </div>

            <div>
              <Label htmlFor="status">Status *</Label>
              <Select
                value={formData.status}
                onValueChange={(value: any) =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="pago">Pago</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="categoria">Categoria</Label>
            <Select
              value={formData.categoria}
              onValueChange={(value) =>
                setFormData({ ...formData, categoria: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="honorarios">Honorários</SelectItem>
                <SelectItem value="custas">Custas Processuais</SelectItem>
                <SelectItem value="despesas">Despesas Gerais</SelectItem>
                <SelectItem value="reembolso">Reembolso</SelectItem>
                <SelectItem value="outro">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              placeholder="Observações adicionais"
              value={formData.observacoes}
              onChange={(e) =>
                setFormData({ ...formData, observacoes: e.target.value })
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
              {loading ? 'Salvando...' : 'Salvar Lançamento'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
