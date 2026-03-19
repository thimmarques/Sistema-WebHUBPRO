import React from 'react';
import { Cliente, Processo } from '../../types';
import { useProcessos } from '../../hooks/useProcessos';
import { formatDate } from '../../lib/formatters';
import { formatProcessoCNJ } from '../../lib/cnj';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Plus, Eye } from 'lucide-react';

interface ClienteProcessosTabProps {
  cliente: Cliente;
  onProcessoClick?: (processo: Processo) => void;
  onNovoProcesso?: () => void;
}

export function ClienteProcessosTab({ cliente, onProcessoClick, onNovoProcesso }: ClienteProcessosTabProps) {
  const { processos, loading } = useProcessos(cliente.id);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ativo':
        return 'bg-blue-100 text-blue-800';
      case 'audiencia':
        return 'bg-yellow-100 text-yellow-800';
      case 'pendente':
        return 'bg-orange-100 text-orange-800';
      case 'encerrado':
        return 'bg-green-100 text-green-800';
      case 'recurso':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="text-center py-8">Carregando processos...</div>;
  }

  if (processos.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">Nenhum processo cadastrado</p>
          {onNovoProcesso && (
            <Button onClick={onNovoProcesso}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Processo
            </Button>
          )}
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Processos ({processos.length})</h3>
        {onNovoProcesso && (
          <Button onClick={onNovoProcesso} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Novo Processo
          </Button>
        )}
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Número CNJ</TableHead>
              <TableHead>Área</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Data de Cadastro</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {processos.map((processo) => (
              <TableRow key={processo.id}>
                <TableCell className="font-mono text-sm">
                  {formatProcessoCNJ(processo.numero_cnj)}
                </TableCell>
                <TableCell className="capitalize">{processo.practice_area}</TableCell>
                <TableCell>
                  <Badge className={getStatusColor(processo.status)}>
                    {processo.status.charAt(0).toUpperCase() + processo.status.slice(1)}
                  </Badge>
                </TableCell>
                <TableCell>{formatDate(processo.created_at)}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onProcessoClick?.(processo)}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
