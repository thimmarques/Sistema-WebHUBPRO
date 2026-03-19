import React from 'react';
import { Processo } from '../../types';
import { formatDate, formatCurrency } from '../../lib/formatters';
import { formatProcessoCNJ } from '../../lib/cnj';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';

interface ProcessoGeralTabProps {
  processo: Processo;
}

export function ProcessoGeralTab({ processo }: ProcessoGeralTabProps) {
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

  return (
    <div className="space-y-6">
      {/* Informações Principais */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Informações Principais</h3>
        
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-medium text-gray-600">Número CNJ</label>
            <p className="mt-1 text-base font-mono">{formatProcessoCNJ(processo.numero_cnj)}</p>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-600">Status</label>
            <div className="mt-1">
              <Badge className={getStatusColor(processo.status)}>
                {processo.status.charAt(0).toUpperCase() + processo.status.slice(1)}
              </Badge>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600">Área de Atuação</label>
            <p className="mt-1 text-base capitalize">{processo.practice_area}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600">Data de Cadastro</label>
            <p className="mt-1 text-base">{formatDate(processo.created_at)}</p>
          </div>

          <div className="col-span-2">
            <label className="text-sm font-medium text-gray-600">Polo Ativo</label>
            <p className="mt-1 text-base">{processo.polo_ativo_nome}</p>
          </div>

          <div className="col-span-2">
            <label className="text-sm font-medium text-gray-600">Polo Passivo</label>
            <p className="mt-1 text-base">{processo.polo_passivo_nome}</p>
          </div>
        </div>
      </Card>

      {/* Descrição */}
      {processo.descricao && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Descrição</h3>
          <p className="text-base text-gray-700 whitespace-pre-wrap">{processo.descricao}</p>
        </Card>
      )}
    </div>
  );
}
