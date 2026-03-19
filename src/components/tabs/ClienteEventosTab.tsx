import React, { useState, useMemo } from 'react';
import { Cliente, Evento } from '../../types';
import { useProcessos } from '../../hooks/useProcessos';
import { useEventos } from '../../hooks/useEventos';
import { formatDate } from '../../lib/formatters';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Calendar, Clock, AlertCircle, Filter } from 'lucide-react';

interface ClienteEventosTabProps {
  cliente: Cliente;
}

export function ClienteEventosTab({ cliente }: ClienteEventosTabProps) {
  const { processos, loading: processosLoading } = useProcessos(cliente.id);
  const [filtroTipo, setFiltroTipo] = useState<string | null>(null);
  const [filtroStatus, setFiltroStatus] = useState<string | null>(null);

  // Agregar eventos de todos os processos do cliente
  const todosEventos = useMemo(() => {
    const eventos: (Evento & { processo_numero: string })[] = [];
    
    processos.forEach(processo => {
      // TODO: Implementar carregamento de eventos por processo
      // Por enquanto, retornar array vazio
    });
    
    return eventos;
  }, [processos]);

  const eventosFiltrados = useMemo(() => {
    let filtered = todosEventos;
    
    if (filtroTipo) {
      filtered = filtered.filter(e => e.tipo === filtroTipo);
    }
    
    if (filtroStatus) {
      filtered = filtered.filter(e => e.status === filtroStatus);
    }
    
    // Ordenar por data (próximos primeiro)
    return filtered.sort((a, b) => 
      new Date(a.data_inicio).getTime() - new Date(b.data_inicio).getTime()
    );
  }, [todosEventos, filtroTipo, filtroStatus]);

  const getStatusColor = (data: string, status: string) => {
    const hoje = new Date();
    const dataEvento = new Date(data);
    const diasRestantes = Math.ceil((dataEvento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));

    if (diasRestantes < 0) return 'bg-red-100 text-red-800';
    if (diasRestantes <= 7) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'audiencia':
        return <Calendar className="w-4 h-4" />;
      case 'prazo':
        return <Clock className="w-4 h-4" />;
      case 'diligencia':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Calendar className="w-4 h-4" />;
    }
  };

  if (processosLoading) {
    return <div className="text-center py-8">Carregando eventos...</div>;
  }

  if (eventosFiltrados.length === 0) {
    return (
      <Card className="p-6 text-center text-gray-600">
        Nenhum evento cadastrado
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-center">
        <Filter className="w-4 h-4 text-gray-600" />
        <select
          value={filtroTipo || ''}
          onChange={(e) => setFiltroTipo(e.target.value || null)}
          className="px-3 py-2 border rounded text-sm"
        >
          <option value="">Todos os tipos</option>
          <option value="audiencia">Audiência</option>
          <option value="prazo">Prazo</option>
          <option value="diligencia">Diligência</option>
        </select>

        <select
          value={filtroStatus || ''}
          onChange={(e) => setFiltroStatus(e.target.value || null)}
          className="px-3 py-2 border rounded text-sm"
        >
          <option value="">Todos os status</option>
          <option value="pendente">Pendente</option>
          <option value="concluido">Concluído</option>
          <option value="cancelado">Cancelado</option>
        </select>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Processo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {eventosFiltrados.map((evento) => (
              <TableRow key={evento.id}>
                <TableCell className="font-mono text-sm">
                  {formatDate(evento.data_inicio)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getTipoIcon(evento.tipo)}
                    <span className="capitalize">{evento.tipo}</span>
                  </div>
                </TableCell>
                <TableCell>{evento.descricao}</TableCell>
                <TableCell className="font-mono text-sm">{evento.processo_numero}</TableCell>
                <TableCell>
                  <Badge className={getStatusColor(evento.data_inicio, evento.status)}>
                    {new Date(evento.data_inicio) < new Date() ? 'Vencido' : 'Ativo'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm">
                    Ver
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
