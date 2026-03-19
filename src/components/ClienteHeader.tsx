import React from 'react';
import { Cliente } from '../types';
import { useAuth } from '../hooks/useAuth';
import { usePermissions } from '../hooks/usePermissions';
import { formatCPF, formatCNPJ, formatDate, formatPhone } from '../lib/formatters';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Edit2, Trash2, Share2 } from 'lucide-react';

interface ClienteHeaderProps {
  cliente: Cliente;
  onEdit?: () => void;
  onDelete?: () => void;
  onShare?: () => void;
}

export function ClienteHeader({ cliente, onEdit, onDelete, onShare }: ClienteHeaderProps) {
  const { currentUser } = useAuth();
  const { canDelete, canEditAll } = usePermissions();

  const isResponsible = cliente.responsible_id === currentUser?.id;
  const canEditThis = canEditAll || isResponsible;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ativo':
        return 'bg-green-100 text-green-800';
      case 'inativo':
        return 'bg-gray-100 text-gray-800';
      case 'arquivado':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getInitials = (nome: string) => {
    return nome
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card className="p-6 mb-6">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16">
            <AvatarFallback>{getInitials(cliente.nome)}</AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold">{cliente.nome}</h1>
              <Badge className={getStatusColor(cliente.status)}>
                {cliente.status.charAt(0).toUpperCase() + cliente.status.slice(1)}
              </Badge>
              {cliente.is_vip && <Badge className="bg-yellow-100 text-yellow-800">VIP</Badge>}
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <span className="font-semibold">
                  {cliente.type === 'pf' ? 'CPF' : 'CNPJ'}:
                </span>
                <span className="ml-2">
                  {cliente.type === 'pf'
                    ? formatCPF(cliente.cpf)
                    : formatCNPJ(cliente.cnpj)}
                </span>
              </div>
              
              {cliente.type === 'pj' && cliente.razao_social && (
                <div>
                  <span className="font-semibold">Razão Social:</span>
                  <span className="ml-2">{cliente.razao_social}</span>
                </div>
              )}

              <div>
                <span className="font-semibold">Área:</span>
                <span className="ml-2 capitalize">{cliente.practice_area}</span>
              </div>

              <div>
                <span className="font-semibold">Cadastrado em:</span>
                <span className="ml-2">{formatDate(cliente.created_at)}</span>
              </div>

              {cliente.email && (
                <div>
                  <span className="font-semibold">E-mail:</span>
                  <span className="ml-2">{cliente.email}</span>
                </div>
              )}

              {cliente.telefone && (
                <div>
                  <span className="font-semibold">Telefone:</span>
                  <span className="ml-2">{formatPhone(cliente.telefone)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          {canEditThis && onEdit && (
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Edit2 className="w-4 h-4 mr-2" />
              Editar
            </Button>
          )}
          {canDelete && onDelete && (
            <Button variant="destructive" size="sm" onClick={onDelete}>
              <Trash2 className="w-4 h-4 mr-2" />
              Deletar
            </Button>
          )}
          {onShare && (
            <Button variant="outline" size="sm" onClick={onShare}>
              <Share2 className="w-4 h-4 mr-2" />
              Compartilhar
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
