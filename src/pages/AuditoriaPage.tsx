import React, { useEffect, useState } from 'react';
import { Filter, AlertCircle, ChevronDown } from 'lucide-react';
import { useAuditoria } from '@/hooks/useAuditoria';
import { FiltrosAuditoria, AuditoriaDetalhes, AuditoriaResumo } from '@/types/auditoria';

export function AuditoriaPage() {
  const { loading, error, getAuditLogWithFilters, getAuditoriaResumo } = useAuditoria();
  const [logs, setLogs] = useState<AuditoriaDetalhes[]>([]);
  const [resumo, setResumo] = useState<AuditoriaResumo | null>(null);
  const [filtros, setFiltros] = useState<FiltrosAuditoria>({});
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [filtros]);

  const loadData = async () => {
    const [logsResult, resumoResult] = await Promise.all([
      getAuditLogWithFilters(filtros),
      getAuditoriaResumo(),
    ]);

    if (logsResult.success) {
      setLogs(logsResult.data || []);
    }
    setResumo(resumoResult);
  };

  if (loading && logs.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando auditoria...</p>
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
            <h1 className="text-3xl font-bold text-gray-900">Auditoria</h1>
            <p className="text-gray-600 mt-2">Logs de atividades e alterações do sistema</p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Cards de Resumo */}
        {resumo && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-gray-500 text-sm">Logs Hoje</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{resumo.logsHoje}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-gray-500 text-sm">Logs Esta Semana</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{resumo.logsEstaSemanA}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-gray-500 text-sm">Total de Logs</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{resumo.totalLogs}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-gray-500 text-sm">Usuários Ativos</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {resumo.usuariosMaisAtivos.length}
              </p>
            </div>
          </div>
        )}

        {/* Filtros Avançados */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-4 h-4 text-gray-500" />
            <h3 className="font-semibold text-gray-900 text-sm">Filtros Avançados</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input
              type="text"
              placeholder="Buscar por descrição..."
              value={filtros.busca || ''}
              onChange={(e) => setFiltros({ ...filtros, busca: e.target.value })}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={filtros.tipo || ''}
              onChange={(e) =>
                setFiltros({ ...filtros, tipo: e.target.value as FiltrosAuditoria['tipo'] || undefined })
              }
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos os Tipos</option>
              <option value="create">Criar</option>
              <option value="update">Atualizar</option>
              <option value="delete">Deletar</option>
              <option value="status_change">Mudança de Status</option>
              <option value="assign">Atribuição</option>
            </select>
            <select
              value={filtros.entidade || ''}
              onChange={(e) => setFiltros({ ...filtros, entidade: e.target.value || undefined })}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas as Entidades</option>
              <option value="clientes_base">Clientes</option>
              <option value="processos">Processos</option>
              <option value="eventos">Eventos</option>
              <option value="lancamentos">Lançamentos</option>
              <option value="documentos">Documentos</option>
            </select>
            <input
              type="date"
              value={filtros.dataInicio || ''}
              onChange={(e) => setFiltros({ ...filtros, dataInicio: e.target.value || undefined })}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {(filtros.busca || filtros.tipo || filtros.entidade || filtros.dataInicio) && (
            <button
              onClick={() => setFiltros({})}
              className="mt-3 text-sm text-blue-600 hover:underline"
            >
              Limpar filtros
            </button>
          )}
        </div>

        {/* Lista de Logs */}
        <div className="space-y-2">
          {logs.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <p className="text-gray-500">Nenhum log encontrado para os filtros aplicados.</p>
            </div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="bg-white rounded-lg shadow overflow-hidden">
                <button
                  onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition text-left"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    {/* Indicador de tipo */}
                    <div
                      className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${getTipoCor(log.tipo)}`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {log.descricao || `${getTipoLabel(log.tipo)} em ${log.entidade}`}
                      </p>
                      <p className="text-sm text-gray-500 mt-0.5">
                        <span className="font-medium">{log.usuarioNome || log.usuarioId}</span>
                        {' · '}
                        <span className="capitalize">{log.entidade}</span>
                        {' · '}
                        <span>{new Date(log.timestamp).toLocaleString('pt-BR')}</span>
                      </p>
                    </div>
                    {/* Badge de tipo */}
                    <span
                      className={`flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${getTipoBadge(log.tipo)}`}
                    >
                      {getTipoLabel(log.tipo)}
                    </span>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-gray-400 ml-4 flex-shrink-0 transition-transform ${
                      expandedLog === log.id ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {/* Detalhe expandido */}
                {expandedLog === log.id && (
                  <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                          Dados Anteriores
                        </p>
                        <pre className="text-xs bg-white p-3 rounded-lg border border-gray-200 overflow-auto max-h-40">
                          {log.dadosAntigos
                            ? JSON.stringify(log.dadosAntigos, null, 2)
                            : '(sem dados anteriores)'}
                        </pre>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                          Dados Novos
                        </p>
                        <pre className="text-xs bg-white p-3 rounded-lg border border-gray-200 overflow-auto max-h-40">
                          {log.dadosNovos
                            ? JSON.stringify(log.dadosNovos, null, 2)
                            : '(sem dados novos)'}
                        </pre>
                      </div>
                    </div>
                    {(log.ipAddress || log.userAgent) && (
                      <div className="mt-3 text-xs text-gray-400">
                        {log.ipAddress && <span>IP: {log.ipAddress}</span>}
                        {log.ipAddress && log.userAgent && <span> · </span>}
                        {log.userAgent && (
                          <span className="truncate">Agente: {log.userAgent}</span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Rodapé com contagem */}
        {logs.length > 0 && (
          <p className="text-center text-sm text-gray-400 mt-4">
            Exibindo {logs.length} log{logs.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>
    </div>
  );
}

// Funções auxiliares de cor/label por tipo
function getTipoCor(tipo: string): string {
  const cores: Record<string, string> = {
    create: 'bg-green-500',
    update: 'bg-blue-500',
    delete: 'bg-red-500',
    status_change: 'bg-yellow-500',
    assign: 'bg-purple-500',
    reconciliacao: 'bg-teal-500',
    password_change: 'bg-orange-500',
  };
  return cores[tipo] || 'bg-gray-400';
}

function getTipoBadge(tipo: string): string {
  const badges: Record<string, string> = {
    create: 'bg-green-100 text-green-700',
    update: 'bg-blue-100 text-blue-700',
    delete: 'bg-red-100 text-red-700',
    status_change: 'bg-yellow-100 text-yellow-700',
    assign: 'bg-purple-100 text-purple-700',
    reconciliacao: 'bg-teal-100 text-teal-700',
    password_change: 'bg-orange-100 text-orange-700',
  };
  return badges[tipo] || 'bg-gray-100 text-gray-600';
}

function getTipoLabel(tipo: string): string {
  const labels: Record<string, string> = {
    create: 'Criação',
    update: 'Atualização',
    delete: 'Exclusão',
    status_change: 'Status',
    assign: 'Atribuição',
    reconciliacao: 'Reconciliação',
    password_change: 'Senha',
  };
  return labels[tipo] || tipo;
}
