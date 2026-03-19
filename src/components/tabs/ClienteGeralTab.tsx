import React from 'react';
import { Cliente } from '../../types';
import { formatDate, formatPhone, formatCEP } from '../../lib/formatters';
import { Card } from '../ui/card';

interface ClienteGeralTabProps {
  cliente: Cliente;
}

export function ClienteGeralTab({ cliente }: ClienteGeralTabProps) {
  return (
    <div className="space-y-6">
      {/* Informações Pessoais/Jurídicas */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">
          {cliente.type === 'pf' ? 'Informações Pessoais' : 'Informações Jurídicas'}
        </h3>
        
        <div className="grid grid-cols-2 gap-6">
          {cliente.type === 'pf' ? (
            <>
              <div>
                <label className="text-sm font-medium text-gray-600">Nome Completo</label>
                <p className="mt-1 text-base">{cliente.nome}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">CPF</label>
                <p className="mt-1 text-base">{cliente.cpf}</p>
              </div>
              {cliente.data_nascimento && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Data de Nascimento</label>
                  <p className="mt-1 text-base">{formatDate(cliente.data_nascimento)}</p>
                </div>
              )}
            </>
          ) : (
            <>
              <div>
                <label className="text-sm font-medium text-gray-600">Razão Social</label>
                <p className="mt-1 text-base">{cliente.razao_social}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">CNPJ</label>
                <p className="mt-1 text-base">{cliente.cnpj}</p>
              </div>
              {cliente.nome_fantasia && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Nome Fantasia</label>
                  <p className="mt-1 text-base">{cliente.nome_fantasia}</p>
                </div>
              )}
              {cliente.ramo_atividade && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Ramo de Atividade</label>
                  <p className="mt-1 text-base capitalize">{cliente.ramo_atividade}</p>
                </div>
              )}
            </>
          )}
        </div>
      </Card>

      {/* Contato */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Contato</h3>
        
        <div className="grid grid-cols-2 gap-6">
          {cliente.email && (
            <div>
              <label className="text-sm font-medium text-gray-600">E-mail</label>
              <p className="mt-1 text-base">{cliente.email}</p>
            </div>
          )}
          {cliente.telefone && (
            <div>
              <label className="text-sm font-medium text-gray-600">Telefone</label>
              <p className="mt-1 text-base">{formatPhone(cliente.telefone)}</p>
            </div>
          )}
          {cliente.celular && (
            <div>
              <label className="text-sm font-medium text-gray-600">Celular</label>
              <p className="mt-1 text-base">{formatPhone(cliente.celular)}</p>
            </div>
          )}
        </div>
      </Card>

      {/* Endereço */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Endereço</h3>
        
        <div className="grid grid-cols-2 gap-6">
          {cliente.cep && (
            <div>
              <label className="text-sm font-medium text-gray-600">CEP</label>
              <p className="mt-1 text-base">{formatCEP(cliente.cep)}</p>
            </div>
          )}
          {cliente.logradouro && (
            <div>
              <label className="text-sm font-medium text-gray-600">Logradouro</label>
              <p className="mt-1 text-base">{cliente.logradouro}</p>
            </div>
          )}
          {cliente.numero && (
            <div>
              <label className="text-sm font-medium text-gray-600">Número</label>
              <p className="mt-1 text-base">{cliente.numero}</p>
            </div>
          )}
          {cliente.complemento && (
            <div>
              <label className="text-sm font-medium text-gray-600">Complemento</label>
              <p className="mt-1 text-base">{cliente.complemento}</p>
            </div>
          )}
          {cliente.bairro && (
            <div>
              <label className="text-sm font-medium text-gray-600">Bairro</label>
              <p className="mt-1 text-base">{cliente.bairro}</p>
            </div>
          )}
          {cliente.cidade && (
            <div>
              <label className="text-sm font-medium text-gray-600">Cidade</label>
              <p className="mt-1 text-base">{cliente.cidade}</p>
            </div>
          )}
          {cliente.estado && (
            <div>
              <label className="text-sm font-medium text-gray-600">Estado</label>
              <p className="mt-1 text-base">{cliente.estado}</p>
            </div>
          )}
        </div>
      </Card>

      {/* Observações */}
      {cliente.observacoes && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Observações</h3>
          <p className="text-base text-gray-700 whitespace-pre-wrap">{cliente.observacoes}</p>
        </Card>
      )}
    </div>
  );
}
