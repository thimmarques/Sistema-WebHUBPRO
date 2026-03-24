import React, { useState } from 'react';
import { Upload, Download, Eye, Trash2, Search, AlertCircle, FileText } from 'lucide-react';
import { useDocumentos } from '@/hooks/useDocumentos';
import { Documento } from '@/types/documento';

export function DocumentosPage() {
  const { documentos, loading, error, deleteDocumento } = useDocumentos();
  const [busca, setBusca] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    // TODO: Implementar upload de arquivo para Supabase Storage
    console.log('Arquivos para upload:', files.map((f) => f.name));
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    // TODO: Implementar upload de arquivo para Supabase Storage
    console.log('Arquivos selecionados:', files.map((f) => f.name));
  };

  const documentosFiltrados: Documento[] = documentos.filter((doc) => {
    const nomeArquivo = doc.nome_arquivo || doc.nome || '';
    const matchBusca = nomeArquivo.toLowerCase().includes(busca.toLowerCase());
    const matchTipo = !filtroTipo || doc.tipo === filtroTipo;
    return matchBusca && matchTipo;
  });

  const formatarTamanho = (bytes?: number): string => {
    if (!bytes) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getIconeExtensao = (tipo: string) => {
    const tipos: Record<string, string> = {
      pdf: '📄',
      docx: '📝',
      doc: '📝',
      xlsx: '📊',
      xls: '📊',
      png: '🖼️',
      jpg: '🖼️',
      jpeg: '🖼️',
    };
    return tipos[tipo?.toLowerCase()] || '📎';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando documentos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Documentos</h1>
            <p className="text-gray-600 mt-2">Gerenciamento centralizado de arquivos</p>
          </div>
          <span className="text-sm text-gray-500 bg-white border border-gray-200 px-3 py-1.5 rounded-lg">
            {documentos.length} documento{documentos.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Upload Area */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-12 text-center mb-6 transition-all ${
            isDragging
              ? 'border-blue-500 bg-blue-50 scale-[1.01]'
              : 'border-gray-300 bg-white hover:border-blue-400 hover:bg-gray-50'
          }`}
        >
          <Upload
            className={`w-12 h-12 mx-auto mb-4 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`}
          />
          <p className="text-lg font-medium text-gray-900 mb-1">
            {isDragging ? 'Solte os arquivos aqui' : 'Arraste arquivos aqui'}
          </p>
          <p className="text-gray-500 text-sm mb-4">PDF, Word, Excel, imagens e mais</p>
          <label className="cursor-pointer">
            <input
              type="file"
              multiple
              className="hidden"
              onChange={handleFileInput}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
            />
            <span className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition">
              Selecionar Arquivos
            </span>
          </label>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar documento..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos os Tipos</option>
              <option value="pdf">PDF</option>
              <option value="docx">Word</option>
              <option value="xlsx">Excel</option>
              <option value="imagem">Imagem</option>
            </select>
          </div>
        </div>

        {/* Tabela de Documentos */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {documentosFiltrados.length === 0 ? (
            <div className="py-16 text-center">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">Nenhum documento encontrado</p>
              <p className="text-gray-400 text-sm mt-1">
                {busca || filtroTipo
                  ? 'Tente ajustar os filtros'
                  : 'Faça upload de um arquivo acima'}
              </p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Nome</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Tipo</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Tamanho</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Data Upload</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {documentosFiltrados.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{getIconeExtensao(doc.tipo)}</span>
                        <span className="truncate max-w-[200px]">
                          {doc.nome_arquivo || doc.nome}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 uppercase">{doc.tipo}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatarTamanho(doc.tamanho)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(doc.data_upload || doc.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        {doc.url && (
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Visualizar"
                          >
                            <Eye className="w-4 h-4" />
                          </a>
                        )}
                        {doc.url && (
                          <a
                            href={doc.url}
                            download={doc.nome_arquivo || doc.nome}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                            title="Download"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        )}
                        <button
                          onClick={() => deleteDocumento(doc.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Deletar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
