import React, { useState } from 'react';
import { Processo, Lancamento } from '../../types';
import { useLancamentos } from '../../hooks/useLancamentos';
import { useAuth } from '../../hooks/useAuth';
import { usePermissions } from '../../hooks/usePermissions';
import { formatDate, formatCurrency } from '../../lib/formatters';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Plus, Eye, Trash2 } from 'lucide-react';

interface ProcessoCustasTabProps {
  processo: Processo;
  onNovasCustas?: () => void;
}

export function ProcessoCustasTab({ processo, onNovasCustas }: ProcessoCustasTabProps) {
  const { lancamentos, loading } = useLancamentos(processo.id);
  const { currentUser } = useAuth();
  const { canCreate, canDelete } = usePermissions();

  // Filtrar apenas despesas (custas)
  const custas = lancamentos.filter(l => l.tipo === 'despesa');

  // Calcular totais
  const totalCustas = custas.reduce((sum, c) => sum + (c.valor || 0), 0);
  const custasPagas = custas.filter(c => c.status === 'pago').reduce((sum, c) => sum + (c.valor || 0), 0);
  const custasPendentes = custas.filter(c => c.status === 'pendente').reduce((sum, c) => sum + (c.valor || 0), 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pago':
        return 'bg-green-100 text-green-800';
      case 'pendente':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelado':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="text-center py-8">Carregando custas...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Resumo de Custas */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-6">
          <p className="text-sm text-gray-600 mb-2">Total de Custas</p>
          <p className="text-2xl font-bold text-orange-600">{formatCurrency(totalCustas)}</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-gray-600 mb-2">Custas Pagas</p>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(custasPagas)}</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-gray-600 mb-2">Custas Pendentes</p>
          <p className="text-2xl font-bold text-yellow-600">{formatCurrency(custasPendentes)}</p>
        </Card>
      </div>

      {/* Tabela de Custas */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Custas Processuais ({custas.length})</h3>
          {canCreate && onNovasCustas && (
            <Button onClick={onNovasCustas} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Novas Custas
            </Button>
          )}
        </div>

        {custas.length === 0 ? (
          <Card className="p-6 text-center text-gray-600">
            Nenhuma custa registrada
          </Card>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {custas.map((custa) => (
                  <TableRow key={custa.id}>
                    <TableCell>{formatDate(custa.data)}</TableCell>
                    <TableCell>{custa.descricao}</TableCell>
                    <TableCell className="capitalize">{custa.categoria || '-'}</TableCell>
                    <TableCell className="font-semibold text-orange-600">
                      {formatCurrency(custa.valor || 0)}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(custa.status)}>
                        {custa.status.charAt(0).toUpperCase() + custa.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                      {(canDelete || currentUser?.id === custa.created_by) && (
                        <Button variant="ghost" size="sm" className="text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>
    </div>
  );
}
