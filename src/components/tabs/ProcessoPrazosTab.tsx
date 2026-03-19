import React from 'react';
import { Processo, Evento } from '../../types';
import { useEventos } from '../../hooks/useEventos';
import { formatDate } from '../../lib/formatters';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

interface ProcessoPrazosTabProps {
  processo: Processo;
}

export function ProcessoPrazosTab({ processo }: ProcessoPrazosTabProps) {
  const { eventos, loading } = useEventos(processo.id);

  const prazos = eventos.filter(e => e.tipo === 'prazo');

  const getStatusColor = (data: string) => {
    const hoje = new Date();
    const dataEvento = new Date(data);
    const diasRestantes = Math.ceil((dataEvento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));

    if (diasRestantes < 0) return 'bg-red-100 text-red-800';
    if (diasRestantes <= 7) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  if (loading) {
    return <div className="text-center py-8">Carregando prazos...</div>;
  }

  if (prazos.length === 0) {
    return (
      <Card className="p-6 text-center text-gray-600">
        Nenhum prazo registrado
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
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {prazos.map((evento) => (
            <TableRow key={evento.id}>
              <TableCell>{formatDate(evento.data_inicio)}</TableCell>
              <TableCell>{evento.descricao}</TableCell>
              <TableCell>
                <Badge className={getStatusColor(evento.data_inicio)}>
                  {new Date(evento.data_inicio) < new Date() ? 'Vencido' : 'Ativo'}
                </Badge>
              </TableCell>
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
