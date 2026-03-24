import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Plus, Search, Download, Wallet, TrendingUp, AlertTriangle, Percent,
  MoreHorizontal, Eye, Edit, Trash2, CheckCircle, DollarSign, X, Info, ChevronUp, ChevronDown, ChevronLeft, ChevronRight,
  Loader2, RefreshCw
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToastContext } from '@/contexts/ToastContext';
import { useLancamentos } from '@/hooks/useLancamentos';
import { useEquipe } from '@/hooks/useEquipe';
import { useClientes } from '@/hooks/useClientes';
import { useProcessos } from '@/hooks/useProcessos';
import AccessDeniedScreen from './AccessDeniedScreen';
import EmptyState from './EmptyState';
import UserAvatar from './UserAvatar';
import StatusBadge from './StatusBadge';
import {
  Lancamento, LancamentoStatus, LancamentoTipo,
  lancamentoStatusLabels, lancamentoStatusColors,
  lancamentoTipoLabels, lancamentoTipoColors,
  tipoDescricaoSuggestion,
} from '@/types/lancamento';
import { areaLabels, areaColors } from '@/types/processo';
import { ModalViewLancamento } from './modals/ModalViewLancamento';
import { ModalReconciliacao } from './modals/ModalReconciliacao';

function formatBRL(v: number): string {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(d: string): string {
  if (!d) return '—';
  const [y, m, day] = d.slice(0, 10).split('-');
  return `${day}/${m}/${y}`;
}

function diffDays(dateStr: string): number {
  if (!dateStr) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + 'T00:00:00');
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function getInitials(name: string): string {
  if (!name) return '??';
  return name.replace(/^(Dr\.|Dra\.)\s+/i, '').split(' ').filter(Boolean).map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

const ITEMS_PER_PAGE = 10;

type SortField = 'cliente_nome' | 'numero_cnj' | 'responsible_id' | 'tipo' | 'descricao' | 'vencimento' | 'valor' | 'status';

export default function FinanceiroPage() {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'socio';
  const { showToast } = useToastContext();
  
  const { lancamentos, loading: loadingLancamentos, saveLancamento, deleteLancamento } = useLancamentos();
  const { membros } = useEquipe();
  
  const [search, setSearch] = useState('');
  const [filterAdvogado, setFilterAdvogado] = useState('');
  const [filterTipo, setFilterTipo] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterArea, setFilterArea] = useState('');
  const [filterPeriodo, setFilterPeriodo] = useState('');
  const [sortField, setSortField] = useState<SortField>('vencimento');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const toggleSort = (f: SortField) => {
    if (sortField === f) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(f); setSortDir('desc'); }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <MoreHorizontal className="w-3 h-3 opacity-20" />;
    return sortDir === 'asc' ? <ChevronUp className="w-4 h-4 text-primary" /> : <ChevronDown className="w-4 h-4 text-primary" />;
  };
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [showPagoModal, setShowPagoModal] = useState<Lancamento | null>(null);
  const [pagoDate, setPagoDate] = useState(new Date().toISOString().slice(0, 10));
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);

  // Modal States
  const [viewLancamentoModal, setViewLancamentoModal] = useState<Lancamento | null>(null);
  const [reconciliacaoModal, setReconciliacaoModal] = useState<Lancamento | null>(null);

  // KPIs
  const metrics = useMemo(() => {
    const now = new Date();
    const currentYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const totalAReceber = lancamentos.filter(l => l.status === 'pendente' || l.status === 'parcelado').reduce((s, l) => s + (l.valor || 0), 0);
    const pagoThisMonth = lancamentos.filter(l => l.status === 'pago' && l.data_pagamento?.startsWith(currentYM));
    const totalRecebidoMes = pagoThisMonth.reduce((s, l) => s + (l.valor || 0), 0);
    const vencidos = lancamentos.filter(l => l.status === 'vencido' || (l.status === 'pendente' && l.vencimento && diffDays(l.vencimento) < 0));
    const totalVencido = vencidos.reduce((s, l) => s + (l.valor || 0), 0);
    const denom = totalAReceber + totalVencido + totalRecebidoMes;
    const taxaInadimplencia = denom > 0 ? (totalVencido / denom) * 100 : 0;
    const pendenteCount = lancamentos.filter(l => l.status === 'pendente' || l.status === 'parcelado').length;
    return { totalAReceber, totalRecebidoMes, totalVencido, taxaInadimplencia, pendenteCount, pagoThisMonthCount: pagoThisMonth.length, vencidoCount: vencidos.length };
  }, [lancamentos]);

  // Resumo por advogado
  const resumoPorAdvogado = useMemo(() => {
    const map: Record<string, { aReceber: number; recebido: number }> = {};
    lancamentos.forEach(l => {
      const respId = l.responsible_id || 'unassigned';
      if (!map[respId]) map[respId] = { aReceber: 0, recebido: 0 };
      if (l.status === 'pago') map[respId].recebido += (l.valor || 0);
      else map[respId].aReceber += (l.valor || 0);
    });
    return Object.entries(map).map(([uid, v]) => {
      const user = membros.find(u => u.id === uid);
      const total = v.aReceber + v.recebido;
      return { 
        uid, 
        name: user?.name || 'Não atribuído', 
        avatar_color: 'bg-primary/10', 
        practice_areas: [], 
        aReceber: v.aReceber, 
        recebido: v.recebido, 
        total, 
        taxaCobranca: total > 0 ? (v.recebido / total) * 100 : 0 
      };
    }).sort((a, b) => b.total - a.total);
  }, [lancamentos, membros]);

  const hasActiveFilters = search || filterAdvogado || filterTipo || filterStatus || filterArea || filterPeriodo;

  const filtered = useMemo(() => {
    let items = [...lancamentos];
    if (search) {
      const s = search.toLowerCase();
      items = items.filter(l => 
        (l.cliente_nome && l.cliente_nome.toLowerCase().includes(s)) || 
        (l.numero_cnj && l.numero_cnj.includes(s)) || 
        (l.descricao && l.descricao.toLowerCase().includes(s))
      );
    }
    if (filterAdvogado) items = items.filter(l => l.responsible_id === filterAdvogado);
    if (filterTipo) items = items.filter(l => l.tipo === filterTipo);
    if (filterStatus) items = items.filter(l => l.status === filterStatus);
    if (filterArea) items = items.filter(l => l.practice_area === filterArea);
    if (filterPeriodo) {
      const now = new Date();
      const y = now.getFullYear();
      const m = now.getMonth();
      items = items.filter(l => {
        const dStr = l.vencimento || l.data || l.created_at;
        if (!dStr) return true;
        const d = new Date(dStr);
        if (filterPeriodo === 'este_mes') return d.getFullYear() === y && d.getMonth() === m;
        if (filterPeriodo === 'mes_anterior') { const pm = m === 0 ? 11 : m - 1; const py = m === 0 ? y - 1 : y; return d.getFullYear() === py && d.getMonth() === pm; }
        if (filterPeriodo === 'trimestre') { const q = Math.floor(m / 3); return d.getFullYear() === y && Math.floor(d.getMonth() / 3) === q; }
        if (filterPeriodo === 'ano') return d.getFullYear() === y;
        return true;
      });
    }
    items.sort((a, b) => {
      let va: any = (a as any)[sortField];
      let vb: any = (b as any)[sortField];
      if (sortField === 'valor') { va = a.valor || 0; vb = b.valor || 0; }
      else { va = String(va || '').toLowerCase(); vb = String(vb || '').toLowerCase(); }
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return items;
  }, [lancamentos, search, filterAdvogado, filterTipo, filterStatus, filterArea, filterPeriodo, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
  const filteredTotal = filtered.reduce((s, l) => s + (l.valor || 0), 0);

  const handleMarkPago = useCallback(async () => {
    if (!showPagoModal) return;
    try {
      await saveLancamento({ 
        ...showPagoModal, 
        status: 'pago', 
        data_pagamento: pagoDate, 
        parcelas_pagas: showPagoModal.parcelas_total || 1 
      });
      setShowPagoModal(null);
      showToast('Pagamento registrado com sucesso', 'success');
    } catch (err) {
      showToast('Erro ao registrar pagamento', 'error');
    }
  }, [showPagoModal, pagoDate, saveLancamento, showToast]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await deleteLancamento(id);
      setDropdownOpen(null);
      showToast('Lançamento excluído', 'success');
    } catch (err) {
      showToast('Erro ao excluir lançamento', 'error');
    }
  }, [deleteLancamento, showToast]);

  const clearFilters = () => { setSearch(''); setFilterAdvogado(''); setFilterTipo(''); setFilterStatus(''); setFilterArea(''); setFilterPeriodo(''); setPage(1); };

  if (!isAdmin) return <AccessDeniedScreen />;

  const now = new Date();
  const currentMonthLabel = now.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }).replace('.', '');

  return (
    <div className="animate-in fade-in duration-500">
      {/* PAGE HEADER */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Financeiro</h1>
          <p className="text-sm text-muted-foreground mt-1">Gestão de honorários, despesas e fluxos financeiros do escritório.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => showToast('Exportação iniciada', 'info')} className="bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl px-4 py-2.5 text-sm flex items-center transition-all shadow-sm">
            <Download className="w-4 h-4 mr-2" />Exportar
          </button>
          <button onClick={() => setShowModal(true)} className="bg-primary text-primary-foreground text-sm font-bold rounded-xl px-5 py-2.5 hover:bg-primary/90 flex items-center shadow-lg shadow-primary/20 transition-all active:scale-95">
            <Plus className="w-4 h-4 mr-2" />+ Novo Lançamento
          </button>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-card border border-border shadow-sm rounded-2xl p-6 flex items-center gap-5 transition-all hover:shadow-md group">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-amber-500/10 text-amber-600 flex-shrink-0 transition-transform group-hover:scale-110"><Wallet className="w-7 h-7" /></div>
          <div>
            <div className="text-2xl font-black text-foreground tabular-nums tracking-tighter">{formatBRL(metrics.totalAReceber)}</div>
            <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mt-0.5">Total a Receber</div>
          </div>
        </div>
        <div className="bg-card border border-border shadow-sm rounded-2xl p-6 flex items-center gap-5 transition-all hover:shadow-md group">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-emerald-500/10 text-emerald-600 flex-shrink-0 transition-transform group-hover:scale-110"><TrendingUp className="w-7 h-7" /></div>
          <div>
            <div className="text-2xl font-black text-foreground tabular-nums tracking-tighter">{formatBRL(metrics.totalRecebidoMes)}</div>
            <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mt-0.5">Recebido este Mês</div>
          </div>
        </div>
        <div className="bg-card border border-border shadow-sm rounded-2xl p-6 flex items-center gap-5 transition-all hover:shadow-md group">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-rose-500/10 text-rose-600 flex-shrink-0 transition-transform group-hover:scale-110 ${metrics.totalVencido > 0 ? 'ring-2 ring-rose-200 ring-offset-2' : ''}`}><AlertTriangle className="w-7 h-7" /></div>
          <div>
            <div className="text-2xl font-black text-rose-600 tabular-nums tracking-tighter">{formatBRL(metrics.totalVencido)}</div>
            <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mt-0.5">Em Atraso</div>
          </div>
        </div>
        <div className="bg-card border border-border shadow-sm rounded-2xl p-6 flex items-center gap-5 transition-all hover:shadow-md group">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-sky-500/10 text-sky-600 flex-shrink-0 transition-transform group-hover:scale-110"><Percent className="w-7 h-7" /></div>
          <div>
            <div className={`text-2xl font-black tabular-nums tracking-tighter ${metrics.taxaInadimplencia >= 15 ? 'text-rose-600' : metrics.taxaInadimplencia >= 8 ? 'text-amber-600' : 'text-emerald-600'}`}>{metrics.taxaInadimplencia.toFixed(1)}%</div>
            <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mt-0.5">Taxa de Inadimplência</div>
          </div>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="bg-card border border-border rounded-2xl p-4 mb-8 flex items-center gap-4 flex-wrap shadow-sm">
        <div className="flex-1 min-w-[20rem] relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Buscar por cliente, processo ou descrição..." className="w-full pl-11 pr-4 py-2.5 bg-muted/30 border-none rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/50" />
        </div>
        <div className="flex gap-4 flex-wrap items-center">
          <select value={filterAdvogado} onChange={e => { setFilterAdvogado(e.target.value); setPage(1); }} className="bg-muted/30 border-none rounded-xl px-4 py-2.5 text-sm font-medium text-foreground focus:ring-2 focus:ring-primary/20 outline-none transition-all cursor-pointer">
            <option value="">Todos Advogados</option>
            {membros.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
          <select value={filterTipo} onChange={e => { setFilterTipo(e.target.value); setPage(1); }} className="bg-muted/30 border-none rounded-xl px-4 py-2.5 text-sm font-medium text-foreground focus:ring-2 focus:ring-primary/20 outline-none transition-all cursor-pointer">
            <option value="">Todos Tipos</option>
            {Object.entries(lancamentoTipoLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }} className="bg-muted/30 border-none rounded-xl px-4 py-2.5 text-sm font-medium text-foreground focus:ring-2 focus:ring-primary/20 outline-none transition-all cursor-pointer">
            <option value="">Todos Status</option>
            {Object.entries(lancamentoStatusLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <select value={filterArea} onChange={e => { setFilterArea(e.target.value); setPage(1); }} className="bg-muted/30 border-none rounded-xl px-4 py-2.5 text-sm font-medium text-foreground focus:ring-2 focus:ring-primary/20 outline-none transition-all cursor-pointer">
            <option value="">Todas áreas</option>
            {Object.entries(areaLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="text-xs font-bold text-muted-foreground hover:text-foreground ml-auto flex items-center gap-1.5 transition-colors px-3 py-1.5 hover:bg-muted rounded-lg uppercase tracking-wider"><X className="w-3.5 h-3.5" />Limpar Filtros</button>
          )}
        </div>
      </div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-12">
        {/* TABLE */}
        <div className="lg:col-span-8">
          {loadingLancamentos ? (
            <div className="bg-card border border-border rounded-2xl shadow-sm p-24 flex flex-col items-center justify-center">
              <Loader2 className="w-12 h-12 text-primary animate-spin mb-6" />
              <p className="text-sm text-muted-foreground font-semibold uppercase tracking-widest">Sincronizando dados...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
              <EmptyState icon={DollarSign} title="Sem registros financeiros" subtitle="Não localizamos lançamentos para os filtros selecionados." ctaLabel="+ Novo Lançamento" onCta={() => setShowModal(true)} />
            </div>
          ) : (
            <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col h-full transition-all">
              <div className="overflow-x-auto flex-1">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-muted/40 border-b border-border">
                      {([
                        ['cliente_nome', 'CLIENTE'],
                        ['tipo', 'TIPO'],
                        ['vencimento', 'VENCIMENTO'],
                        ['valor', 'VALOR'],
                        ['status', 'STATUS'],
                      ] as [SortField, string][]).map(([f, label]) => (
                        <th key={f} onClick={() => toggleSort(f)} className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] px-6 py-5 text-left cursor-pointer hover:text-primary transition-colors select-none">
                          <div className="flex items-center gap-1.5">{label} <SortIcon field={f} /></div>
                        </th>
                      ))}
                      <th className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] px-6 py-5 text-right">AÇÕES</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {paginated.map(l => {
                      const dd = l.vencimento ? diffDays(l.vencimento) : null;
                      const isVencido = l.status !== 'pago' && dd !== null && dd < 0;
                      
                      return (
                        <tr key={l.id} className="group hover:bg-muted/30 transition-all border-b border-border/50 last:border-0 relative">
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-sm font-black leading-none flex-shrink-0 uppercase transition-transform group-hover:scale-110 shadow-sm border border-primary/5">
                                {getInitials(l.cliente_nome)}
                              </div>
                              <div className="min-w-0">
                                <div className="text-sm font-bold text-foreground truncate max-w-[180px]" title={l.cliente_nome}>{l.cliente_nome}</div>
                                <div className="text-[10px] text-muted-foreground truncate uppercase font-bold tracking-tight mt-0.5 opacity-70">{l.descricao}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <span className={`text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest border ${lancamentoTipoColors[l.tipo]}`}>{lancamentoTipoLabels[l.tipo]}</span>
                          </td>
                          <td className="px-6 py-5">
                            {l.status === 'pago' ? (
                              <div className="flex flex-col">
                                <span className="text-[9px] uppercase font-black text-emerald-600/60 leading-tight">Recebido</span>
                                <span className="text-xs font-bold text-emerald-600 tabular-nums">{formatDate(l.data_pagamento || '')}</span>
                              </div>
                            ) : isVencido ? (
                              <div className="flex flex-col">
                                <span className="text-[9px] uppercase font-black text-rose-600/70 leading-tight animate-pulse">Atrasado</span>
                                <span className="text-xs font-black text-rose-600 tabular-nums">{formatDate(l.vencimento || '')}</span>
                              </div>
                            ) : dd !== null && dd <= 7 ? (
                              <div className="flex flex-col">
                                <span className="text-[9px] uppercase font-black text-amber-600/70 leading-tight">Vence em {dd}d</span>
                                <span className="text-xs font-bold text-amber-600 tabular-nums">{formatDate(l.vencimento || '')}</span>
                              </div>
                            ) : (
                              <div className="flex flex-col">
                                <span className="text-[9px] uppercase font-black text-muted-foreground/60 leading-tight">Data Venc.</span>
                                <span className="text-xs font-bold text-foreground/80 tabular-nums">{formatDate(l.vencimento || '')}</span>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-5">
                            <div className="text-sm font-black text-foreground tabular-nums tracking-tighter">{formatBRL(l.valor)}</div>
                            {l.status === 'parcelado' && <div className="text-[9px] text-primary font-black uppercase tracking-widest mt-0.5">{l.parcelas_pagas}/{l.parcelas_total} PARC.</div>}
                          </td>
                          <td className="px-6 py-5">
                            <span className={`text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-[0.1em] border shadow-sm ${lancamentoStatusColors[l.status]}`}>{lancamentoStatusLabels[l.status]}</span>
                          </td>
                          <td className="px-6 py-5 text-right relative">
                            <button onClick={() => setDropdownOpen(dropdownOpen === l.id ? null : l.id)} className="text-muted-foreground hover:text-foreground p-2 rounded-xl hover:bg-muted transition-all active:scale-90 shadow-sm border border-transparent hover:border-border"><MoreHorizontal className="w-5 h-5" /></button>
                            {dropdownOpen === l.id && (
                              <>
                                <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(null)} />
                                <div className="absolute right-6 top-14 bg-card border border-border shadow-2xl rounded-2xl py-2 z-20 w-56 overflow-hidden animate-in slide-in-from-top-2 duration-300">
                                  {l.status !== 'pago' && (
                                    <button onClick={() => { setDropdownOpen(null); setPagoDate(new Date().toISOString().slice(0, 10)); setShowPagoModal(l); }} className="w-full text-left px-5 py-3 text-[13px] font-bold text-emerald-600 hover:bg-emerald-50/50 flex items-center gap-3 transition-colors"><CheckCircle className="w-4 h-4" />Marcar como Pago</button>
                                  )}
                                  <button onClick={() => { setDropdownOpen(null); setReconciliacaoModal(l); }} className="w-full text-left px-5 py-3 text-[13px] font-bold text-foreground/80 hover:bg-muted/50 flex items-center gap-3 transition-colors"><RefreshCw className="w-4 h-4" />Reconciliar</button>
                                  <button onClick={() => { setDropdownOpen(null); setViewLancamentoModal(l); }} className="w-full text-left px-5 py-3 text-[13px] font-bold text-foreground/80 hover:bg-muted/50 flex items-center gap-3 transition-colors"><Eye className="w-4 h-4" />Visualizar/Editar</button>
                                  <div className="h-px bg-border/50 mx-2 my-2" />
                                  <button onClick={() => handleDelete(l.id)} className="w-full text-left px-5 py-3 text-[13px] font-bold text-rose-600 hover:bg-rose-50/50 flex items-center gap-3 transition-colors"><Trash2 className="w-4 h-4" />Excluir Registro</button>
                                </div>
                              </>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {/* TABLE FOOTER */}
              <div className="border-t border-border px-8 py-5 flex items-center justify-between bg-muted/5">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">Página {page} de {totalPages} • Total {filtered.length}</span>
                <div className="flex items-center gap-3 text-sm font-bold text-foreground">
                  Valor Total Filtrado: <span className="tabular-nums tracking-tighter text-lg font-black">{formatBRL(filteredTotal)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="bg-card border border-border rounded-xl p-2.5 text-foreground hover:bg-muted disabled:opacity-20 disabled:cursor-not-allowed transition-all active:scale-95 shadow-sm"><ChevronLeft className="w-5 h-5" /></button>
                  <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="bg-card border border-border rounded-xl p-2.5 text-foreground hover:bg-muted disabled:opacity-20 disabled:cursor-not-allowed transition-all active:scale-95 shadow-sm"><ChevronRight className="w-5 h-5" /></button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SIDE BAR: RESUMO POR ADVOGADO */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden transition-all hover:shadow-md">
            <div className="px-6 py-6 border-b border-border bg-muted/5 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-black text-foreground uppercase tracking-[0.2em] leading-none mb-1">Performance Financeira</h3>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{currentMonthLabel}</p>
              </div>
              <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/10 shadow-sm"><Info className="w-4 h-4 text-primary" /></div>
            </div>
            <div className="px-6 py-2 max-h-[700px] overflow-y-auto divide-y divide-border/50 custom-scrollbar">
              {resumoPorAdvogado.length === 0 ? (
                <div className="py-16 text-center">
                  <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Sem movimentações este mês</p>
                </div>
              ) : resumoPorAdvogado.map(adv => {
                const tcColor = adv.taxaCobranca >= 80 ? 'text-emerald-600' : adv.taxaCobranca >= 50 ? 'text-amber-600' : 'text-rose-600';
                const barColor = adv.taxaCobranca >= 80 ? 'bg-emerald-500' : adv.taxaCobranca >= 50 ? 'bg-amber-400' : 'bg-rose-500';
                return (
                  <div key={adv.uid} className="py-6 group transition-all">
                    <div className="flex items-center gap-4 mb-5">
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center text-sm font-black border border-primary/5 shadow-sm transition-transform group-hover:scale-105">
                        {getInitials(adv.name)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-black text-foreground group-hover:text-primary transition-colors truncate">{adv.name}</div>
                        <div className="text-[9px] text-muted-foreground font-black uppercase tracking-widest mt-0.5 opacity-80 leading-none">Eficiência de Cobrança</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-amber-500/5 border border-amber-200/40 rounded-xl p-4 transition-all group-hover:bg-amber-500/10">
                        <div className="text-[9px] text-amber-600 uppercase font-black tracking-widest mb-1 leading-none">A Receber</div>
                        <div className="text-[15px] font-black text-amber-700 tabular-nums tracking-tighter">{formatBRL(adv.aReceber)}</div>
                      </div>
                      <div className="bg-emerald-500/5 border border-emerald-200/40 rounded-xl p-4 transition-all group-hover:bg-emerald-500/10">
                        <div className="text-[9px] text-emerald-600 uppercase font-black tracking-widest mb-1 leading-none">Recebido</div>
                        <div className="text-[15px] font-black text-emerald-700 tabular-nums tracking-tighter">{formatBRL(adv.recebido)}</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">Percentual de Êxito</span>
                      <span className={`text-xs font-black ${tcColor} tabular-nums`}>{adv.taxaCobranca.toFixed(1)}%</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-muted/60 w-full overflow-hidden shadow-inner flex border border-black/5">
                      <div className={`h-full rounded-full ${barColor} transition-all duration-1000 ease-out shadow-sm`} style={{ width: `${Math.min(adv.taxaCobranca, 100)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="bg-muted px-6 py-5 border-t border-border">
              <div className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-4 opacity-70">Saldos Consolidados Escritório</div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="text-[9px] font-black text-amber-600 uppercase tracking-widest mb-1">Pendente Geral</div>
                  <div className="text-xl font-black text-amber-600 tabular-nums tracking-tighter">{formatBRL(metrics.totalAReceber)}</div>
                </div>
                <div>
                  <div className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1">Liquidado Geral</div>
                  <div className="text-xl font-black text-emerald-600 tabular-nums tracking-tighter">{formatBRL(metrics.totalRecebidoMes)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MARCAR COMO PAGO MODAL */}
      {showPagoModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={() => setShowPagoModal(null)}>
          <div className="bg-card rounded-[2.5rem] shadow-2xl p-10 max-w-md w-full text-center scale-in-center animate-in zoom-in-95 duration-300 relative border border-border" onClick={e => e.stopPropagation()}>
            <div className="w-20 h-20 bg-emerald-500/10 text-emerald-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-emerald-500/20 shadow-inner">
              <CheckCircle className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-black text-foreground tracking-tighter line-clamp-1">Confirmar Recebimento</h3>
            <p className="text-sm text-muted-foreground mt-2 font-medium px-4 line-clamp-2 leading-relaxed">{showPagoModal.descricao}</p>
            
            <div className="mt-8 p-6 bg-muted/50 rounded-[2rem] border border-border shadow-inner group">
              <div className="text-3xl font-black text-emerald-600 tabular-nums tracking-tighter group-hover:scale-105 transition-transform">{formatBRL(showPagoModal.valor)}</div>
              <p className="text-[10px] uppercase font-black text-muted-foreground mt-2 tracking-[0.2em] opacity-60">Valor da Liquidação</p>
            </div>

            <div className="mt-8 mb-10 text-left">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-3 block px-1">Selecione a Data Efetiva</label>
              <input type="date" value={pagoDate} onChange={e => setPagoDate(e.target.value)} className="w-full bg-muted/50 border-2 border-border/50 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all cursor-pointer shadow-sm" />
            </div>

            <div className="flex gap-4">
              <button onClick={() => setShowPagoModal(null)} className="flex-1 text-sm font-black text-muted-foreground hover:bg-muted py-4 rounded-2xl transition-all active:scale-95 uppercase tracking-widest border border-transparent hover:border-border">Voltar</button>
              <button onClick={handleMarkPago} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-black py-4 rounded-2xl shadow-xl shadow-emerald-500/30 transition-all active:scale-95 uppercase tracking-widest">Efetivar Baixa</button>
            </div>
          </div>
        </div>
      )}

      {/* NOVO LANÇAMENTO MODAL */}
      {showModal && (
        <NovoLancamentoModal 
          onClose={() => setShowModal(false)} 
          onSave={async (l) => {
            try {
              await saveLancamento(l);
              setShowModal(false);
              showToast('Lançamento registrado com sucesso', 'success');
            } catch (err) {
              showToast('Erro ao salvar lançamento', 'error');
            }
          }} 
        />
      )}

      {/* MODAL VIEW / EDIT LANÇAMENTO */}
      <ModalViewLancamento
        isOpen={!!viewLancamentoModal}
        lancamento={viewLancamentoModal}
        onClose={() => setViewLancamentoModal(null)}
        onSuccess={() => {
          setViewLancamentoModal(null);
          showToast('Operação realizada com sucesso', 'success');
        }}
      />

      {/* MODAL RECONCILIAÇÃO */}
      <ModalReconciliacao
        isOpen={!!reconciliacaoModal}
        lancamento={reconciliacaoModal}
        onClose={() => setReconciliacaoModal(null)}
        onSuccess={() => {
          setReconciliacaoModal(null);
          showToast('Reconciliação registrada', 'success');
        }}
      />
    </div>
  );

}

/* ─── NOVO LANÇAMENTO MODAL ─── */
function NovoLancamentoModal({ onClose, onSave }: { onClose: () => void; onSave: (l: Lancamento) => Promise<void> | void }) {
  const { clientes, loading: loadingClientes } = useClientes();
  const { processos, loading: loadingProcessos } = useProcessos();
  const { membros, loading: loadingEquipe } = useEquipe();
  
  const [clienteSearch, setClienteSearch] = useState('');
  const [selectedCliente, setSelectedCliente] = useState<any>(null);
  const [showClienteList, setShowClienteList] = useState(false);
  const [processoId, setProcessoId] = useState('');
  const [responsibleId, setResponsibleId] = useState('');
  const [tipo, setTipo] = useState<LancamentoTipo | ''>('');
  const [area, setArea] = useState('');
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [vencimento, setVencimento] = useState('');
  const [status, setStatus] = useState<LancamentoStatus>('pendente');
  const [dataPagamento, setDataPagamento] = useState(new Date().toISOString().slice(0, 10));
  const [parcelasTotal, setParcelasTotal] = useState(2);
  const [parcelasPagas, setParcelasPagas] = useState(0);
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [isSaving, setIsSaving] = useState(false);

  const filteredClientes = useMemo(() => {
    if (!clienteSearch) return [];
    const s = clienteSearch.toLowerCase();
    return clientes.filter(c => {
      const name = c.nome || c.razao_social || '';
      return name.toLowerCase().includes(s);
    });
  }, [clientes, clienteSearch]);

  const relatedProcessos = useMemo(() => {
    if (!selectedCliente) return [];
    return processos.filter(p => p.polo_ativo_id === selectedCliente.id);
  }, [selectedCliente, processos]);

  const handleSelectCliente = (c: any) => {
    setSelectedCliente(c);
    setClienteSearch(c.nome || c.razao_social || '');
    setShowClienteList(false);
    setProcessoId('');
    if (c.practice_area) setArea(c.practice_area);
  };

  const handleSelectProcesso = (pid: string) => {
    setProcessoId(pid);
    const proc = processos.find(p => p.id === pid);
    if (proc) {
      if (proc.responsible_id) setResponsibleId(proc.responsible_id);
      if (proc.practice_area) setArea(proc.practice_area);
    }
  };

  const handleTipoChange = (t: LancamentoTipo) => {
    setTipo(t);
    if (!descricao || Object.values(tipoDescricaoSuggestion).some(s => descricao.startsWith(s))) {
      setDescricao(tipoDescricaoSuggestion[t]);
    }
  };

  const parseValor = (v: string): number => {
    const cleaned = v.replace(/[R$\s.]/g, '').replace(',', '.');
    return parseFloat(cleaned) || 0;
  };

  const handleValorBlur = () => {
    const num = parseValor(valor);
    if (num > 0) setValor(num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
  };

  const handleSave = async () => {
    const errs: Record<string, boolean> = {};
    if (!selectedCliente) errs.cliente = true;
    if (!responsibleId) errs.responsible = true;
    if (!tipo) errs.tipo = true;
    if (!descricao.trim()) errs.descricao = true;
    if (!parseValor(valor)) errs.valor = true;
    if (!vencimento) errs.vencimento = true;
    if (status === 'pago' && !dataPagamento) errs.dataPagamento = true;
    
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setIsSaving(true);
    try {
      const lancamento: Partial<Lancamento> = {
        processo_id: processoId || undefined,
        cliente_id: selectedCliente.id,
        responsible_id: responsibleId,
        practice_area: (area || 'civil') as any,
        tipo: tipo as LancamentoTipo,
        descricao: descricao.trim(),
        valor: parseValor(valor),
        data: vencimento, // Vencimento é a data base
        vencimento,
        status,
        data_pagamento: status === 'pago' ? dataPagamento : undefined,
        parcelas_total: status === 'parcelado' ? parcelasTotal : 1,
        parcelas_pagas: status === 'parcelado' ? parcelasPagas : status === 'pago' ? 1 : 0,
      };

      await onSave(lancamento as Lancamento);
    } catch (err) {
      console.error('Error saving lancamento:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={onClose}>
      <div className="bg-card w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-border flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        {/* MODAL HEADER */}
        <div className="px-10 py-8 border-b border-border bg-muted/30 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-foreground tracking-tighter">Novo Lançamento</h2>
            <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mt-1 opacity-70">Registro de movimentação financeira</p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-muted rounded-2xl transition-all text-muted-foreground hover:text-foreground active:scale-90"><X className="w-6 h-6" /></button>
        </div>

        {/* MODAL BODY */}
        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* CLIENTE & PROCESSO */}
            <div className="space-y-6">
              <div className="relative">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-2.5 block px-1">Cliente *</label>
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <input 
                    value={clienteSearch} 
                    onChange={e => { setClienteSearch(e.target.value); setShowClienteList(true); }} 
                    onFocus={() => setShowClienteList(true)}
                    placeholder="Pesquisar cliente..." 
                    className={`w-full pl-11 pr-4 py-3.5 bg-muted/50 border-2 rounded-2xl text-sm font-bold focus:outline-none transition-all ${errors.cliente ? 'border-rose-500/50 focus:border-rose-500 ring-rose-500/10' : 'border-transparent focus:border-primary/50 focus:ring-4 focus:ring-primary/5 shadow-sm hover:bg-muted/70'}`}
                  />
                </div>
                {showClienteList && filteredClientes.length > 0 && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowClienteList(false)} />
                    <div className="absolute z-20 w-full mt-2 bg-card border border-border shadow-2xl rounded-2xl overflow-hidden max-h-48 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
                      {filteredClientes.map(c => (
                        <button key={c.id} onClick={() => handleSelectCliente(c)} className="w-full text-left px-5 py-3 text-sm font-bold text-foreground hover:bg-primary/10 hover:text-primary transition-all flex items-center gap-3">
                          <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center text-[10px]">{getInitials(c.nome || c.razao_social || '')}</div>
                          {c.nome || c.razao_social}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div>
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-2.5 block px-1">Processo Vinculado</label>
                <select 
                  value={processoId} 
                  onChange={e => handleSelectProcesso(e.target.value)} 
                  disabled={!selectedCliente}
                  className="w-full px-5 py-3.5 bg-muted/50 border-2 border-transparent rounded-2xl text-sm font-bold focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all shadow-sm hover:bg-muted/70 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed appearance-none"
                >
                  <option value="">Selecione um processo...</option>
                  {relatedProcessos.map(p => (
                    <option key={p.id} value={p.id}>{p.numero_cnj} {p.descricao ? `- ${p.descricao.slice(0, 30)}...` : ''}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-2.5 block px-1">Responsável *</label>
                <select 
                  value={responsibleId} 
                  onChange={e => setResponsibleId(e.target.value)} 
                  className={`w-full px-5 py-3.5 bg-muted/50 border-2 rounded-2xl text-sm font-bold focus:outline-none transition-all ${errors.responsible ? 'border-rose-500/50 focus:border-rose-500 ring-rose-500/10' : 'border-transparent focus:border-primary/50 focus:ring-4 focus:ring-primary/5 shadow-sm hover:bg-muted/70'} cursor-pointer appearance-none`}
                >
                  <option value="">Atribuir profissional...</option>
                  {membros.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
            </div>

            {/* FINANCEIRO DETAILS */}
            <div className="space-y-6 border-l border-border/50 pl-0 md:pl-8">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-2.5 block px-1">Tipo *</label>
                  <select 
                    value={tipo} 
                    onChange={e => handleTipoChange(e.target.value as LancamentoTipo)} 
                    className={`w-full px-5 py-3.5 bg-muted/50 border-2 rounded-2xl text-sm font-bold focus:outline-none transition-all ${errors.tipo ? 'border-rose-500/50 focus:border-rose-500 ring-rose-500/10' : 'border-transparent focus:border-primary/50 focus:ring-4 focus:ring-primary/5 shadow-sm hover:bg-muted/70'} cursor-pointer appearance-none`}
                  >
                    <option value="">Tipo...</option>
                    {Object.entries(lancamentoTipoLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-2.5 block px-1">Valor *</label>
                  <div className="relative group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black text-muted-foreground/50">R$</span>
                    <input 
                      value={valor} 
                      onChange={e => setValor(e.target.value)} 
                      onBlur={handleValorBlur}
                      placeholder="0,00" 
                      className={`w-full pl-10 pr-4 py-3.5 bg-muted/50 border-2 rounded-2xl text-[15px] font-black tabular-nums focus:outline-none transition-all ${errors.valor ? 'border-rose-500/50 focus:border-rose-500 ring-rose-500/10' : 'border-transparent focus:border-primary/50 focus:ring-4 focus:ring-primary/5 shadow-sm hover:bg-muted/70'}`}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-2.5 block px-1">Descrição do Lançamento *</label>
                <input 
                  value={descricao} 
                  onChange={e => setDescricao(e.target.value)} 
                  placeholder="Ex: Honorários iniciais contencioso..." 
                  className={`w-full px-5 py-3.5 bg-muted/50 border-2 rounded-2xl text-sm font-bold focus:outline-none transition-all ${errors.descricao ? 'border-rose-500/50 focus:border-rose-500 ring-rose-500/10' : 'border-transparent focus:border-primary/50 focus:ring-4 focus:ring-primary/5 shadow-sm hover:bg-muted/70'}`}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-2.5 block px-1">Vencimento *</label>
                  <input 
                    type="date" 
                    value={vencimento} 
                    onChange={e => setVencimento(e.target.value)} 
                    className={`w-full px-5 py-3.5 bg-muted/50 border-2 rounded-2xl text-sm font-bold focus:outline-none transition-all ${errors.vencimento ? 'border-rose-500/50 focus:border-rose-500 ring-rose-500/10' : 'border-transparent focus:border-primary/50 focus:ring-4 focus:ring-primary/5 shadow-sm hover:bg-muted/70'} cursor-pointer`}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-2.5 block px-1">Status Base</label>
                  <select 
                    value={status} 
                    onChange={e => setStatus(e.target.value as LancamentoStatus)} 
                    className="w-full px-5 py-3.5 bg-muted/50 border-2 border-transparent rounded-2xl text-sm font-bold focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/5 shadow-sm hover:bg-muted/70 cursor-pointer appearance-none"
                  >
                    {Object.entries(lancamentoStatusLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
              </div>

              {status === 'pago' && (
                <div className="animate-in slide-in-from-top-2 duration-300">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-2.5 block px-1">Data Efetiva da Baixa *</label>
                  <input 
                    type="date" 
                    value={dataPagamento} 
                    onChange={e => setDataPagamento(e.target.value)} 
                    className={`w-full px-5 py-3.5 bg-emerald-500/5 border-2 rounded-2xl text-sm font-bold focus:outline-none transition-all ${errors.dataPagamento ? 'border-rose-500/50 focus:border-rose-500 ring-rose-500/10' : 'border-emerald-500/30 focus:border-emerald-500 ring-emerald-500/5 shadow-sm hover:bg-emerald-500/10'} cursor-pointer`}
                  />
                </div>
              )}

              {status === 'parcelado' && (
                <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-300">
                  <div>
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-2.5 block px-1">Nº de Parcelas</label>
                    <input type="number" value={parcelasTotal} onChange={e => setParcelasTotal(Number(e.target.value))} className="w-full px-5 py-3.5 bg-muted/50 border-2 border-transparent rounded-2xl text-sm font-bold focus:outline-none focus:border-primary/50 transition-all shadow-sm" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-2.5 block px-1">Pagas Iniciais</label>
                    <input type="number" value={parcelasPagas} onChange={e => setParcelasPagas(Number(e.target.value))} className="w-full px-5 py-3.5 bg-muted/50 border-2 border-transparent rounded-2xl text-sm font-bold focus:outline-none focus:border-primary/50 transition-all shadow-sm" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className="px-10 py-8 border-t border-border bg-muted/30 flex items-center justify-end gap-4">
          <button 
            onClick={onClose} 
            disabled={isSaving}
            className="text-sm font-black text-muted-foreground hover:bg-muted px-8 py-3.5 rounded-2xl transition-all active:scale-95 uppercase tracking-widest disabled:opacity-50"
          >
            Cancelar
          </button>
          <button 
            onClick={handleSave} 
            disabled={isSaving}
            className="bg-primary text-primary-foreground text-sm font-black px-10 py-3.5 rounded-2xl shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95 flex items-center gap-2 uppercase tracking-widest disabled:opacity-70"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Confirmar Registro
          </button>
        </div>
      </div>
    </div>
  );
}
