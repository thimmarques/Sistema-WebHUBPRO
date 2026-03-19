import React, { useState } from 'react';
import { Cliente, Documento } from '../../types';
import { useDocumentos } from '../../hooks/useDocumentos';
import { useAuth } from '../../hooks/useAuth';
import { usePermissions } from '../../hooks/usePermissions';
import { formatDate } from '../../lib/formatters';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Upload, Download, Trash2, Eye, Plus } from 'lucide-react';

interface ClienteDocumentosTabProps {
  clientId: string;
  onUpload?: () => void;
}

export function ClienteDocumentosTab({ clientId, onUpload }: ClienteDocumentosTabProps) {
  const { documentos, loading } = useDocumentos(clientId);
  const { currentUser } = useAuth();
  const { canCreate, canDelete } = usePermissions();

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'procuracao':
        return 'bg-blue-100 text-blue-800';
      case 'contrato':
        return 'bg-green-100 text-green-800';
      case 'sentenca':
        return 'bg-purple-100 text-purple-800';
      case 'peticao':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatarTamanho = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  if (loading) {
    return <div className="text-center py-8">Carregando documentos...</div>;
  }

  if (documentos.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">Nenhum documento cadastrado</p>
          {canCreate && onUpload && (
            <Button onClick={onUpload}>
              <Upload className="w-4 h-4 mr-2" />
              Fazer Upload
            </Button>
          )}
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Documentos ({documentos.length})</h3>
        {canCreate && onUpload && (
          <Button onClick={onUpload} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Fazer Upload
          </Button>
        )}
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome do Arquivo</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Tamanho</TableHead>
              <TableHead>Data de Upload</TableHead>
              <TableHead>Uploader</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documentos.map((documento) => (
              <TableRow key={documento.id}>
                <TableCell className="font-medium">{documento.nome_arquivo}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${getTipoColor(documento.tipo)}`}>
                    {documento.tipo.charAt(0).toUpperCase() + documento.tipo.slice(1)}
                  </span>
                </TableCell>
                <TableCell>{formatarTamanho(documento.tamanho)}</TableCell>
                <TableCell>{formatDate(documento.data_upload)}</TableCell>
                <TableCell>{documento.uploader_nome}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="ghost" size="sm" title="Visualizar">
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" title="Download">
                    <Download className="w-4 h-4" />
                  </Button>
                  {(canDelete || currentUser?.id === documento.uploader_id) && (
                    <Button variant="ghost" size="sm" title="Deletar" className="text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
