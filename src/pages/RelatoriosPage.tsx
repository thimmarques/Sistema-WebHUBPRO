import React, { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, DollarSign, AlertCircle, Download } from 'lucide-react';
import { useRelatorios } from '@/hooks/useRelatorios';
import { FiltrosRelatorio, RelatorioClientes } from '@/types/relatorio';

export function RelatoriosPage() {
  const {
    metricas,
    loading,
    error,
    getRelatorioClientes,
    getRelatorioProcessos,
    getRelatorioFinanceiro,
    getGraficoClientesPorStatus,
    getGraficoProcessosPorFase,
  } = useRelatorios();

  const [activeTab, setActiveTab] = useState<'resumo' | 'clientes' | 'processos' | 'financeiro'>('resumo');
  const [filtros, setFiltros] = useState<FiltrosRelatorio>({});
  const [clientesData, setClientesData] = useState<RelatorioClientes[]>([]);
  const [graficoClientes, setGraficoClientes] = useState<any>(null);
  const [graficoProcessos, setGraficoProcessos] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, [filtros, activeTab]);

  const loadData = async () => {
    if (activeTab === 'clientes') {
      const result = await getRelatorioClientes(filtros);
      if (result.success) {
        setClientesData(result.data || []);
      }
    }

    if (activeTab === 'resumo') {
      const grafico1 = await getGraficoClientesPorStatus();
      const grafico2 = await getGraficoProcessosPorFase();
      setGraficoClientes(grafico1);
      setGraficoProcessos(grafico2);
    }
  };

  if (loading && !metricas) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando relatórios...</p>
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
            <h1 className="text-3xl font-bold text-gray-900">Relatórios</h1>
            <p className="text-gray-600 mt-2">Análise consolidada de dados do sistema</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Download className="w-4 h-4" />
            Exportar
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-gray-200">
          {(['resumo', 'clientes', 'processos', 'financeiro'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 font-medium border-b-2 transition capitalize ${
                activeTab === tab
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab === 'resumo' ? 'Resumo Executivo' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Resumo Executivo */}
        {activeTab === 'resumo' && metricas && (
          <div className="space-y-6">
            {/* Cards de Métricas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricaCard
                titulo="Total de Clientes"
                valor={metricas.totalClientes}
                subtitulo={`${metricas.clientesAtivos} ativos`}
                icon={<BarChart3 className="w-6 h-6" />}
                cor="blue"
              />
              <MetricaCard
                titulo="Total de Processos"
                valor={metricas.totalProcessos}
                subtitulo={`${metricas.processosAtivos} ativos`}
                icon={<TrendingUp className="w-6 h-6" />}
                cor="green"
              />
              <MetricaCard
                titulo="Receita Total"
                valor={`R$ ${metricas.receitaTotal.toFixed(2)}`}
                subtitulo={`Saldo: R$ ${metricas.saldoTotal.toFixed(2)}`}
                icon={<DollarSign className="w-6 h-6" />}
                cor="emerald"
              />
              <MetricaCard
                titulo="Prazos Vencidos"
                valor={metricas.prazosVencidos}
                subtitulo={`${metricas.prazosProximos} próximos`}
                icon={<AlertCircle className="w-6 h-6" />}
                cor="red"
              />
            </div>

            {/* Gráficos Placeholder */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Clientes por Status</h3>
                {graficoClientes && (
                  <div className="space-y-3">
                    {graficoClientes.labels.map((label: string, i: number) => (
                      <div key={label} className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: graficoClientes.datasets[0].backgroundColor[i] }}
                        />
                        <span className="text-sm text-gray-700 flex-1">{label}</span>
                        <span className="text-sm font-semibold text-gray-900">
                          {graficoClientes.datasets[0].data[i]}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Processos por Fase</h3>
                {graficoProcessos && (
                  <div className="space-y-3">
                    {graficoProcessos.labels.map((label: string, i: number) => (
                      <div key={label} className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: graficoProcessos.datasets[0].backgroundColor[i] }}
                        />
                        <span className="text-sm text-gray-700 flex-1">{label}</span>
                        <span className="text-sm font-semibold text-gray-900">
                          {graficoProcessos.datasets[0].data[i]}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Clientes Tab */}
        {activeTab === 'clientes' && (
          <div className="space-y-4">
            {/* Filtros */}
            <div className="bg-white rounded-lg shadow p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  type="text"
                  placeholder="Buscar cliente..."
                  value={filtros.busca || ''}
                  onChange={(e) => setFiltros({ ...filtros, busca: e.target.value })}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
                <select
                  value={filtros.status || ''}
                  onChange={(e) => setFiltros({ ...filtros, status: e.target.value })}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">Todos os Status</option>
                  <option value="ativo">Ativo</option>
                  <option value="inativo">Inativo</option>
                  <option value="suspenso">Suspenso</option>
                  <option value="encerrado">Encerrado</option>
                </select>
              </div>
            </div>

            {/* Tabela */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Nome</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">CPF/CNPJ</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Área</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Data Criação</th>
                  </tr>
                </thead>
                <tbody>
                  {clientesData.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-gray-500 text-sm">
                        Nenhum cliente encontrado
                      </td>
                    </tr>
                  ) : (
                    clientesData.map((cliente) => (
                      <tr key={cliente.id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-900">{cliente.nome}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{cliente.cpfCnpj}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{cliente.area || '-'}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {new Date(cliente.dataCreacao).toLocaleDateString('pt-BR')}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Processos Tab */}
        {activeTab === 'processos' && (
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-500 text-sm">
              Use os filtros acima para gerar o relatório de processos.
            </p>
          </div>
        )}

        {/* Financeiro Tab */}
        {activeTab === 'financeiro' && (
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-500 text-sm">
              Use os filtros acima para gerar o relatório financeiro.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Componente auxiliar para cards de métrica
function MetricaCard({
  titulo,
  valor,
  subtitulo,
  icon,
  cor,
}: {
  titulo: string;
  valor: number | string;
  subtitulo: string;
  icon: React.ReactNode;
  cor: 'blue' | 'green' | 'emerald' | 'red';
}) {
  const corClasses: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    red: 'bg-red-50 text-red-600',
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div
        className={`w-12 h-12 rounded-lg ${corClasses[cor]} flex items-center justify-center mb-4`}
      >
        {icon}
      </div>
      <p className="text-gray-600 text-sm font-medium">{titulo}</p>
      <p className="text-2xl font-bold text-gray-900 mt-2">{valor}</p>
      <p className="text-gray-500 text-xs mt-2">{subtitulo}</p>
    </div>
  );
}
