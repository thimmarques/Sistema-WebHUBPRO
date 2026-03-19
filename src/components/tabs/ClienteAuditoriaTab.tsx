import React, { useState, useMemo } from 'react';
import { Cliente, Atividade } from '../../types';
import { useAuditoria } from '../../hooks/useAuditoria';
import { usePermissions } from '../../hooks/usePermissions';
import { formatDateTime } from '../../lib/formatters';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Eye, Download, Filter } from 'lucide-react';

interface ClienteAuditoriaTabProps {
  cliente: Cliente;
}

export function ClienteAuditoriaTab({ cliente }: ClienteAuditoriaTabProps) {
  const { atividades, loading } = useAuditoria(cliente.id);
  const { role } = usePermissions();
  const [filtroTipo, setFiltroTipo] = useState<string | null>(null);
  const [filtroUsuario, setFiltroUsuario] = useState<string | null>(null);

  // RBAC: Apenas admin e advogado podem ver auditoria
  if (role === 'estagiario') {
    return (
      <Card className="p-6 text-center text-gray-600">
        Você não tem permissão para visualizar auditoria
      </Card>
    );
  }

  const atividadesFiltradas = useMemo(() => {
    let filtered = atividades;
    
    if (filtroTipo) {
      filtered = filtered.filter(a => a.tipo === filtroTipo);
    }
    
    if (filtroUsuario) {
      filtered = filtered.filter(a => a.usuario_id === filtroUsuario);
    }
    
    return filtered;
  }, [atividades, filtroTipo, filtroUsuario]);

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'create':
        return 'bg-green-100 text-green-800';
      case 'update':
        return 'bg-blue-100 text-blue-800';
      case 'delete':
        return 'bg-red-100 text-red-800';
      case 'read':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const usuariosUnicos = useMemo(() => {
    return [...new Set(atividades.map(a => a.usuario_id))];
  }, [atividades]);

  if (loading) {
    return <div className="text-center py-8">Carregando auditoria...</div>;
  }

  if (atividadesFiltradas.length === 0) {
    return (
      <Card className="p-6 text-center text-gray-600">
        Nenhuma atividade registrada
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
          <option value="create">Criação</option>
          <option value="update">Atualização</option>
          <option value="delete">Deleção</option>
          <option value="read">Leitura</option>
        </select>

        <select
          value={filtroUsuario || ''}
          onChange={(e) => setFiltroUsuario(e.target.value || null)}
          className="px-3 py-2 border rounded text-sm"
        >
          <option value="">Todos os usuários</option>
          {usuariosUnicos.map(usuarioId => (
            <option key={usuarioId} value={usuarioId}>
              {usuarioId}
            </option>
          ))}
        </select>

        {role === 'admin' && (
          <Button variant="outline" size="sm" className="ml-auto">
            <Download className="w-4 h-4 mr-2" />
            Exportar CSV
          </Button>
        )}
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data/Hora</TableHead>
              <TableHead>Usuário</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Entidade</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {atividadesFiltradas.map((atividade) => (
              <TableRow key={atividade.id}>
                <TableCell className="text-sm">
                  {formatDateTime(atividade.created_at)}
                </TableCell>
                <TableCell className="text-sm">{atividade.usuario_id}</TableCell>
                <TableCell>
                  <Badge className={getTipoColor(atividade.tipo)}>
                    {atividade.tipo.charAt(0).toUpperCase() + atividade.tipo.slice(1)}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm capitalize">{atividade.entidade}</TableCell>
                <TableCell className="text-sm">{atividade.descricao}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" title="Visualizar detalhes">
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
