import React, { useMemo } from 'react';
import {
  Briefcase,
  Users,
  Scale,
  AlertCircle,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Percent,
  LucideIcon,
  Loader2,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useClientes } from '@/hooks/useClientes';
import { useProcessos } from '@/hooks/useProcessos';
import { useEventos } from '@/hooks/useEventos';
import { useLancamentos } from '@/hooks/useLancamentos';
import { useAuditoria } from '@/hooks/useAuditoria';
import StatusBadge from './StatusBadge';
import { format, isWithinInterval, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isAfter, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/* ── KPI Card ── */

interface KpiCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  subtitle?: string;
  subtitleClass?: string;
  loading?: boolean;
}

function KpiCard({ label, value, icon: Icon, iconBg, iconColor, subtitle, subtitleClass, loading }: KpiCardProps) {
  return (
    <div className="bg-card border border-border shadow-sm rounded-lg p-5 flex items-start gap-4">
      <div className={`${iconBg} ${iconColor} rounded-lg p-2.5 shrink-0`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
        {loading ? (
          <div className="h-8 w-16 bg-muted animate-pulse rounded mt-0.5" />
        ) : (
          <p className="text-2xl font-bold text-foreground mt-0.5">{value}</p>
        )}
        {subtitle && (
          <p className={`text-xs mt-1 ${subtitleClass || 'text-muted-foreground'}`}>{subtitle}</p>
        )}
      </div>
    </div>
  );
}

/* ── Dashboard ── */

export default function Dashboard() {
  const { currentUser, isAdmin } = useAuth();
  const admin = isAdmin();

  const { clientes, loading: loadingClientes } = useClientes();
  const { processos, loading: loadingProcessos } = useProcessos();
  const { eventos, loading: loadingEventos } = useEventos();
  const { lancamentos, loading: loadingLancamentos } = useLancamentos();
  const { atividades, loading: loadingAtividades } = useAuditoria();

  const metrics = useMemo(() => {
    const now = new Date();
    const weekStart = startOfWeek(now);
    const weekEnd = endOfWeek(now);
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    // Processos Ativos
    const ativosCount = processos.filter(p => p.status !== 'encerrado').length;
    
    // Próxima Audiência
    const proximasAudiencias = eventos
      .filter(e => e.tipo === 'audiencia' && isAfter(parseISO(e.data_inicio), now))
      .sort((a, b) => parseISO(a.data_inicio).getTime() - parseISO(b.data_inicio).getTime());
    
    const proximaAudiencia = proximasAudiencias[0];
    const proximasAudienciasDisplay = proximasAudiencias.slice(0, 4);

    // Prazos da Semana
    const prazosSemana = eventos.filter(e => 
      e.tipo === 'prazo' && 
      isWithinInterval(parseISO(e.data_inicio), { start: weekStart, end: weekEnd })
    );

    // Financeiro (Admin)
    const receitasAtuais = lancamentos.filter(l => l.tipo === 'receita');
    const aReceber = receitasAtuais
      .filter(l => !l.status || l.status === 'pendente')
      .reduce((acc, curr) => acc + (Number(curr.valor) || 0), 0);
    
    const recebidoMes = receitasAtuais
      .filter(l => l.status === 'pago' && isWithinInterval(parseISO(l.data_pagamento || l.data), { start: monthStart, end: monthEnd }))
      .reduce((acc, curr) => acc + (Number(curr.valor) || 0), 0);
    
    const emAtraso = receitasAtuais
      .filter(l => (!l.status || l.status === 'pendente') && isAfter(now, parseISO(l.data)))
      .reduce((acc, curr) => acc + (Number(curr.valor) || 0), 0);

    // Distribuição por Área
    const areas: Record<string, number> = {
      trabalhista: 0,
      civil: 0,
      criminal: 0,
      previdenciario: 0,
      tributario: 0
    };

    processos.forEach(p => {
      if (p.practice_area && areas[p.practice_area] !== undefined) {
        areas[p.practice_area]++;
      }
    });

    const totalProcessos = processos.length || 1;

    const areaStats = [
      { area: 'trabalhista', count: areas.trabalhista, barColor: 'bg-primary/80' },
      { area: 'civil', count: areas.civil, barColor: 'bg-purple-500' },
      { area: 'criminal', count: areas.criminal, barColor: 'bg-red-500' },
      { area: 'previdenciario', count: areas.previdenciario, barColor: 'bg-green-500' },
      { area: 'tributario', count: areas.tributario, barColor: 'bg-amber-500' },
    ];

    return {
      ativosCount,
      clientesCount: clientes.length,
      proximaAudiencia,
      prazosSemana: prazosSemana.length,
      aReceber,
      recebidoMes,
      emAtraso,
      areaStats,
      totalProcessos,
      audienciasList: proximasAudienciasDisplay
    };
  }, [processos, clientes, eventos, lancamentos]);

  const isLoading = loadingClientes || loadingProcessos || loadingEventos || loadingLancamentos;

  return (
    <div className="space-y-6">
      {/* Section A — KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard 
          label="Processos Ativos" 
          value={metrics.ativosCount} 
          icon={Briefcase} 
          iconBg="bg-primary/10" 
          iconColor="text-primary" 
          loading={loadingProcessos}
        />
        <KpiCard 
          label="Total de Clientes" 
          value={metrics.clientesCount} 
          icon={Users} 
          iconBg="bg-green-50" 
          iconColor="text-green-600" 
          loading={loadingClientes}
        />
        <KpiCard 
          label="Próxima Audiência" 
          value={metrics.proximaAudiencia ? format(parseISO(metrics.proximaAudiencia.data_inicio), "dd/MM HH:mm") : 'Nenhuma'} 
          icon={Scale} 
          iconBg="bg-purple-50" 
          iconColor="text-purple-600" 
          subtitle={metrics.proximaAudiencia?.title}
          loading={loadingEventos}
        />
        <KpiCard 
          label="Prazos Esta Semana" 
          value={metrics.prazosSemana} 
          icon={AlertCircle} 
          iconBg="bg-amber-50" 
          iconColor="text-amber-600" 
          subtitle={`${metrics.prazosSemana} prazos identificados`} 
          loading={loadingEventos}
        />
      </div>

      {admin && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard 
            label="A Receber" 
            value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metrics.aReceber)} 
            icon={DollarSign} 
            iconBg="bg-emerald-50" 
            iconColor="text-emerald-600" 
            loading={loadingLancamentos}
          />
          <KpiCard 
            label="Recebido este Mês" 
            value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metrics.recebidoMes)} 
            icon={TrendingUp} 
            iconBg="bg-teal-50" 
            iconColor="text-teal-600" 
            loading={loadingLancamentos}
          />
          <KpiCard 
            label="Em Atraso" 
            value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metrics.emAtraso)} 
            icon={AlertTriangle} 
            iconBg="bg-red-50" 
            iconColor="text-red-600" 
            loading={loadingLancamentos}
          />
          <KpiCard 
            label="Inadimplência" 
            value={`${metrics.aReceber > 0 ? ((metrics.emAtraso / metrics.aReceber) * 100).toFixed(1) : 0}%`} 
            icon={Percent} 
            iconBg="bg-orange-50" 
            iconColor="text-orange-600" 
            loading={loadingLancamentos}
          />
        </div>
      )}

      {/* Section B — Activity + Hearings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left — Activity */}
        <div className="lg:col-span-2 bg-card border border-border rounded-lg p-6">
          <h2 className="text-base font-semibold text-foreground mb-5">Atividade Recente</h2>
          {loadingAtividades ? (
            <div className="flex justify-center py-12"><Loader2 className="animate-spin text-muted-foreground" /></div>
          ) : atividades.length > 0 ? (
            <div className="relative ml-3 border-l-2 border-border space-y-5 pl-5">
              {atividades.slice(0, 5).map((a) => (
                <div key={a.id} className="relative">
                  <span className="absolute -left-[25px] top-1.5 w-2 h-2 rounded-full bg-primary" />
                  <p className="text-sm text-foreground">{a.descricao}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {format(parseISO(a.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground text-sm">Nenhuma atividade registrada.</div>
          )}
        </div>

        {/* Right — Hearings */}
        <div className="col-span-1 bg-card border border-border rounded-lg p-6">
          <h2 className="text-base font-semibold text-foreground mb-5">Próximas Audiências</h2>
          {loadingEventos ? (
            <div className="flex justify-center py-12"><Loader2 className="animate-spin text-muted-foreground" /></div>
          ) : metrics.audienciasList.length > 0 ? (
            <div className="space-y-4">
              {metrics.audienciasList.map((h) => {
                const date = parseISO(h.data_inicio);
                return (
                  <div key={h.id} className="flex items-start gap-3">
                    <div className="bg-muted/50 rounded-lg p-2 text-center min-w-[48px]">
                      <p className="text-xl font-bold text-foreground leading-tight">{format(date, 'dd')}</p>
                      <p className="text-xs text-muted-foreground uppercase">{format(date, 'MMM', { locale: ptBR })}</p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{h.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Processo: {h.processo_id?.slice(0,8)}...</p>
                      <div className="mt-1">
                        <StatusBadge variant="audiencia" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground text-sm">Nenhuma audiência agendada.</div>
          )}
        </div>
      </div>

      {/* Section C — Area Distribution */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h2 className="text-base font-semibold text-foreground mb-5">Distribuição por Área (Processos)</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {metrics.areaStats.map((s) => (
            <div key={s.area}>
              <div className="flex items-center justify-between mb-2">
                <StatusBadge variant={s.area as any} />
                <span className="text-sm font-semibold text-foreground">{s.count}</span>
              </div>
              <div className="bg-muted rounded-full h-2 overflow-hidden">
                <div
                  className={`${s.barColor} h-2 rounded-full transition-all`}
                  style={{ width: `${(s.count / metrics.totalProcessos) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
