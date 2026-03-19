import React from 'react';
import { Processo, Evento } from '../../types';
import { useEventos } from '../../hooks/useEventos';
import { formatDate } from '../../lib/formatters';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

interface ProcessoMovimentacoesTabProps {
  processo: Processo;
}

export function ProcessoMovimentacoesTab({ processo }: ProcessoMovimentacoesTabProps) {
  const { eventos, loading } = useEventos(processo.id);

  const movimentacoes = eventos.filter(e => e.tipo === 'movimentacao');

  if (loading) {
    return <div className="text-center py-8">Carregando movimentações...</div>;
  }

  if (movimentacoes.length === 0) {
    return (
      <Card className="p-6 text-center text-gray-600">
        Nenhuma movimentação registrada
      </Card>
    );
  }

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {movimentacoes.map((evento) => (
            <TableRow key={evento.id}>
              <TableCell>{formatDate(evento.data_inicio)}</TableCell>
              <TableCell>{evento.descricao}</TableCell>
              <TableCell className="capitalize">{evento.tipo}</TableCell>
              <TableCell className="text-right">
                {/* TODO: Implementar ações */}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
