import React from 'react';
import { Cliente, Lancamento } from '../../types';
import { useLancamentos } from '../../hooks/useLancamentos';
import { formatDate, formatCurrency } from '../../lib/formatters';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Plus, Eye } from 'lucide-react';

interface ClienteFinanceiroTabProps {
  cliente: Cliente;
  onNovoLancamento?: () => void;
  onLancamentoClick?: (lancamento: Lancamento) => void;
}

export function ClienteFinanceiroTab({ cliente, onNovoLancamento, onLancamentoClick }: ClienteFinanceiroTabProps) {
  const { lancamentos, loading } = useLancamentos();

  // Filtrar lançamentos do cliente
  const clienteLancamentos = lancamentos.filter(l => l.cliente_id === cliente.id);

  // Calcular totais
  const totalReceitas = clienteLancamentos
    .filter(l => l.tipo === 'receita' || l.tipo === 'honorario')
    .reduce((sum, l) => sum + (l.valor || 0), 0);

  const totalDespesas = clienteLancamentos
    .filter(l => l.tipo === 'despesa' || l.tipo === 'repasse' || l.tipo === 'custas')
    .reduce((sum, l) => sum + (l.valor || 0), 0);

  const saldo = totalReceitas - totalDespesas;

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

  const isReceita = (tipo: string) => tipo === 'receita' || tipo === 'honorario';

  const getTipoColor = (tipo: string) => {
    return isReceita(tipo)
      ? 'text-green-600 font-semibold'
      : 'text-red-600 font-semibold';
  };

  if (loading) {
    return <div className="text-center py-8">Carregando lançamentos...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Resumo Financeiro */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-6">
          <p className="text-sm text-gray-600 mb-2">Total de Receitas</p>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(totalReceitas)}</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-gray-600 mb-2">Total de Despesas</p>
          <p className="text-2xl font-bold text-red-600">{formatCurrency(totalDespesas)}</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-gray-600 mb-2">Saldo</p>
          <p className={`text-2xl font-bold ${saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(saldo)}
          </p>
        </Card>
      </div>

      {/* Lançamentos */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Lançamentos ({clienteLancamentos.length})</h3>
          {onNovoLancamento && (
            <Button onClick={onNovoLancamento} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Novo Lançamento
            </Button>
          )}
        </div>

        {clienteLancamentos.length === 0 ? (
          <Card className="p-6 text-center text-gray-600">
            Nenhum lançamento cadastrado
          </Card>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clienteLancamentos.map((lancamento) => (
                  <TableRow key={lancamento.id}>
                    <TableCell>{formatDate(lancamento.data)}</TableCell>
                    <TableCell>{lancamento.descricao}</TableCell>
                    <TableCell>
                      <span className={getTipoColor(lancamento.tipo)}>
                        {isReceita(lancamento.tipo) ? '+' : '-'}
                        {lancamento.tipo.charAt(0).toUpperCase() + lancamento.tipo.slice(1)}
                      </span>
                    </TableCell>
                    <TableCell className={getTipoColor(lancamento.tipo)}>
                      {formatCurrency(lancamento.valor || 0)}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(lancamento.status)}>
                        {lancamento.status.charAt(0).toUpperCase() + lancamento.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onLancamentoClick?.(lancamento)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
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
