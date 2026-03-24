import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  MetricasGerais,
  RelatorioClientes,
  RelatorioProcessos,
  RelatorioFinanceiro,
  RelatorioPrazos,
  FiltrosRelatorio,
  DadosGrafico,
} from '@/types/relatorio';
import { useAuth } from '@/contexts/AuthContext';

export function useRelatorios() {
  const { currentUser } = useAuth();
  const [metricas, setMetricas] = useState<MetricasGerais | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ✅ NOVO: Buscar métricas gerais
  const getMetricasGerais = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Contar clientes por status
      const { data: clientesPorStatus, error: clientesError } = await supabase
        .from('clientes_base')
        .select('status')
        .is('deleted_at', null);

      if (clientesError) throw clientesError;

      const clientesAtivos = clientesPorStatus?.filter((c) => c.status === 'ativo').length || 0;
      const clientesInativos = clientesPorStatus?.filter((c) => c.status === 'inativo').length || 0;
      const clientesSuspensos = clientesPorStatus?.filter((c) => c.status === 'suspenso').length || 0;
      const clientesEncerrados = clientesPorStatus?.filter((c) => c.status === 'encerrado').length || 0;

      // Contar processos por fase
      const { data: processosPorFase, error: processosError } = await supabase
        .from('processos')
        .select('fase')
        .is('deleted_at', null);

      if (processosError) throw processosError;

      const processosAtivos = processosPorFase?.filter((p) => p.fase === 'ativo').length || 0;
      const processosSentenciados = processosPorFase?.filter((p) => p.fase === 'sentenciado').length || 0;
      const processosEncerrados = processosPorFase?.filter((p) => p.fase === 'encerrado').length || 0;

      // Buscar lançamentos
      const { data: lancamentos, error: lancamentosError } = await supabase
        .from('lancamentos')
        .select('tipo, valor')
        .is('deleted_at', null);

      if (lancamentosError) throw lancamentosError;

      const receitaTotal =
        lancamentos?.filter((l) => l.tipo === 'receita').reduce((sum, l) => sum + l.valor, 0) || 0;

      const despesaTotal =
        lancamentos?.filter((l) => l.tipo === 'despesa').reduce((sum, l) => sum + l.valor, 0) || 0;

      // Buscar prazos vencidos
      const { data: eventos, error: eventosError } = await supabase
        .from('eventos')
        .select('data')
        .lt('data', new Date().toISOString())
        .is('deleted_at', null);

      if (eventosError) throw eventosError;

      const prazosVencidos = eventos?.length || 0;

      // Buscar prazos próximos (próximos 7 dias)
      const dataFim = new Date();
      dataFim.setDate(dataFim.getDate() + 7);

      const { data: eventosProximos, error: eventosProximosError } = await supabase
        .from('eventos')
        .select('data')
        .gte('data', new Date().toISOString())
        .lte('data', dataFim.toISOString())
        .is('deleted_at', null);

      if (eventosProximosError) throw eventosProximosError;

      const prazosProximos = eventosProximos?.length || 0;

      const metricasGerais: MetricasGerais = {
        totalClientes: clientesPorStatus?.length || 0,
        clientesAtivos,
        clientesInativos,
        clientesSuspensos,
        clientesEncerrados,
        totalProcessos: processosPorFase?.length || 0,
        processosAtivos,
        processosSentenciados,
        processosEncerrados,
        receitaTotal,
        despesaTotal,
        saldoTotal: receitaTotal - despesaTotal,
        prazosVencidos,
        prazosProximos,
      };

      setMetricas(metricasGerais);
      setLoading(false);
      return { success: true, data: metricasGerais };
    } catch (err) {
      console.error('Erro ao buscar métricas gerais:', err);
      setError('Erro ao buscar métricas');
      setLoading(false);
      return { success: false, error: err instanceof Error ? err.message : 'Erro desconhecido' };
    }
  }, []);

  // ✅ NOVO: Buscar relatório de clientes
  const getRelatorioClientes = useCallback(async (filtros?: FiltrosRelatorio) => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('clientes_base')
        .select('id, nome, cpf_cnpj, status, created_at, responsible_id')
        .is('deleted_at', null);

      if (filtros?.status) {
        query = query.eq('status', filtros.status);
      }

      if (filtros?.advogado) {
        query = query.eq('responsible_id', filtros.advogado);
      }

      if (filtros?.busca) {
        query = query.ilike('nome', `%${filtros.busca}%`);
      }

      const { data, error: fetchError } = await query.order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      const mapped: RelatorioClientes[] = (data || []).map((r) => ({
        id: r.id,
        nome: r.nome,
        cpfCnpj: r.cpf_cnpj,
        area: '',
        advogadoResponsavel: r.responsible_id,
        dataCreacao: r.created_at,
        totalProcessos: 0,
        receitaTotal: 0,
      }));

      setLoading(false);
      return { success: true, data: mapped };
    } catch (err) {
      console.error('Erro ao buscar relatório de clientes:', err);
      setError('Erro ao buscar relatório');
      setLoading(false);
      return { success: false, error: err instanceof Error ? err.message : 'Erro desconhecido' };
    }
  }, []);

  // ✅ NOVO: Buscar relatório de processos
  const getRelatorioProcessos = useCallback(async (filtros?: FiltrosRelatorio) => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('processos')
        .select('id, numero_cnj, cliente_id, area, fase, resultado, created_at, responsible_id')
        .is('deleted_at', null);

      if (filtros?.status) {
        query = query.eq('fase', filtros.status);
      }

      if (filtros?.advogado) {
        query = query.eq('responsible_id', filtros.advogado);
      }

      if (filtros?.busca) {
        query = query.ilike('numero_cnj', `%${filtros.busca}%`);
      }

      const { data, error: fetchError } = await query.order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      const mapped: RelatorioProcessos[] = (data || []).map((p) => ({
        id: p.id,
        numeroCnj: p.numero_cnj,
        cliente: p.cliente_id,
        area: p.area,
        advogado: p.responsible_id,
        dataCreacao: p.created_at,
        dataEncerramento: undefined,
      }));

      setLoading(false);
      return { success: true, data: mapped };
    } catch (err) {
      console.error('Erro ao buscar relatório de processos:', err);
      setError('Erro ao buscar relatório');
      setLoading(false);
      return { success: false, error: err instanceof Error ? err.message : 'Erro desconhecido' };
    }
  }, []);

  // ✅ NOVO: Buscar relatório financeiro
  const getRelatorioFinanceiro = useCallback(async (filtros?: FiltrosRelatorio) => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('lancamentos')
        .select('id, tipo, valor, data, descricao, cliente_id, processo_id, categoria, status_reconciliacao')
        .is('deleted_at', null);

      if (filtros?.status) {
        query = query.eq('tipo', filtros.status);
      }

      if (filtros?.dataInicio && filtros?.dataFim) {
        query = query.gte('data', filtros.dataInicio).lte('data', filtros.dataFim);
      }

      if (filtros?.busca) {
        query = query.ilike('descricao', `%${filtros.busca}%`);
      }

      const { data, error: fetchError } = await query.order('data', { ascending: false });

      if (fetchError) throw fetchError;

      setLoading(false);
      return { success: true, data: data as RelatorioFinanceiro[] };
    } catch (err) {
      console.error('Erro ao buscar relatório financeiro:', err);
      setError('Erro ao buscar relatório');
      setLoading(false);
      return { success: false, error: err instanceof Error ? err.message : 'Erro desconhecido' };
    }
  }, []);

  // ✅ NOVO: Buscar relatório de prazos
  const getRelatorioPrazos = useCallback(async (filtros?: FiltrosRelatorio) => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('eventos')
        .select('id, tipo, data, processo_id, descricao')
        .is('deleted_at', null);

      if (filtros?.dataInicio && filtros?.dataFim) {
        query = query.gte('data', filtros.dataInicio).lte('data', filtros.dataFim);
      }

      if (filtros?.busca) {
        query = query.ilike('descricao', `%${filtros.busca}%`);
      }

      const { data, error: fetchError } = await query.order('data', { ascending: true });

      if (fetchError) throw fetchError;

      // Processar dados para adicionar status e dias restantes
      const prazos = data?.map((evento) => {
        const dataEvento = new Date(evento.data);
        const dataAtual = new Date();
        const diasRestantes = Math.ceil(
          (dataEvento.getTime() - dataAtual.getTime()) / (1000 * 60 * 60 * 24)
        );

        return {
          id: evento.id,
          tipo: evento.tipo,
          data: evento.data,
          processo: evento.processo_id,
          cliente: '',
          descricao: evento.descricao,
          diasRestantes,
        };
      }) as RelatorioPrazos[];

      setLoading(false);
      return { success: true, data: prazos };
    } catch (err) {
      console.error('Erro ao buscar relatório de prazos:', err);
      setError('Erro ao buscar relatório');
      setLoading(false);
      return { success: false, error: err instanceof Error ? err.message : 'Erro desconhecido' };
    }
  }, []);

  // ✅ NOVO: Gerar dados para gráfico de clientes por status
  const getGraficoClientesPorStatus = useCallback(async (): Promise<DadosGrafico> => {
    try {
      const { data, error } = await supabase
        .from('clientes_base')
        .select('status')
        .is('deleted_at', null);

      if (error) throw error;

      const statusCounts = {
        ativo: data?.filter((c) => c.status === 'ativo').length || 0,
        inativo: data?.filter((c) => c.status === 'inativo').length || 0,
        suspenso: data?.filter((c) => c.status === 'suspenso').length || 0,
        encerrado: data?.filter((c) => c.status === 'encerrado').length || 0,
      };

      return {
        labels: ['Ativo', 'Inativo', 'Suspenso', 'Encerrado'],
        datasets: [
          {
            label: 'Clientes por Status',
            data: [
              statusCounts.ativo,
              statusCounts.inativo,
              statusCounts.suspenso,
              statusCounts.encerrado,
            ],
            backgroundColor: ['#10b981', '#6b7280', '#f59e0b', '#ef4444'],
          },
        ],
      };
    } catch (err) {
      console.error('Erro ao gerar gráfico de clientes por status:', err);
      return { labels: [], datasets: [] };
    }
  }, []);

  // ✅ NOVO: Gerar dados para gráfico de processos por fase
  const getGraficoProcessosPorFase = useCallback(async (): Promise<DadosGrafico> => {
    try {
      const { data, error } = await supabase
        .from('processos')
        .select('fase')
        .is('deleted_at', null);

      if (error) throw error;

      const faseCounts = {
        ativo: data?.filter((p) => p.fase === 'ativo').length || 0,
        sentenciado: data?.filter((p) => p.fase === 'sentenciado').length || 0,
        encerrado: data?.filter((p) => p.fase === 'encerrado').length || 0,
      };

      return {
        labels: ['Ativo', 'Sentenciado', 'Encerrado'],
        datasets: [
          {
            label: 'Processos por Fase',
            data: [faseCounts.ativo, faseCounts.sentenciado, faseCounts.encerrado],
            backgroundColor: ['#3b82f6', '#f59e0b', '#ef4444'],
          },
        ],
      };
    } catch (err) {
      console.error('Erro ao gerar gráfico de processos por fase:', err);
      return { labels: [], datasets: [] };
    }
  }, []);

  useEffect(() => {
    getMetricasGerais();
  }, [getMetricasGerais]);

  return {
    metricas,
    loading,
    error,
    getMetricasGerais,
    getRelatorioClientes,
    getRelatorioProcessos,
    getRelatorioFinanceiro,
    getRelatorioPrazos,
    getGraficoClientesPorStatus,
    getGraficoProcessosPorFase,
  };
}
