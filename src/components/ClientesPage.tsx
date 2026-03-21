import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Users,
  Star,
  Loader2,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToastContext } from '@/contexts/ToastContext';
import { useClientes, useEquipe } from '@/hooks';
import {
  Cliente,
  getClienteName,
  getClienteDoc,
  maskCpf,
  maskCnpj,
  getPoloLabel,
} from '@/types/cliente';
import StatusBadge from './StatusBadge';
import UserAvatar from './UserAvatar';
import EmptyState from './EmptyState';
import ClienteSlideOver from './ClienteSlideOver';
import { ModalChangeStatus } from './modals/ModalChangeStatus';
import { ModalAssignAdvogado } from './modals/ModalAssignAdvogado';
import { ModalAssignEstagiario } from './modals/ModalAssignEstagiario';


const ITEMS_PER_PAGE = 10;

type SortField = 'name' | 'area' | 'status';
type SortDir = 'asc' | 'desc';

interface ClientesPageProps {
  onNavigateDetail?: (clientId: string) => void;
}

export default function ClientesPage({ onNavigateDetail }: ClientesPageProps) {
  const { isAdmin } = useAuth();
  const { showToast } = useToastContext();
  const admin = isAdmin();

  const { clientes, loading: loadingClientes, saveCliente, deleteCliente } = useClientes();
  const { membros } = useEquipe();

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'' | 'pf' | 'pj'>('');
  const [filterArea, setFilterArea] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [page, setPage] = useState(1);

  // slide-over
  const [slideOpen, setSlideOpen] = useState(false);
  const [editCliente, setEditCliente] = useState<Cliente | null>(null);

  // dropdown
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // delete confirmation
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // modals
  const [selectedClienteForStatus, setSelectedClienteForStatus] = useState<Cliente | null>(null);
  const [selectedClienteForAdvogado, setSelectedClienteForAdvogado] = useState<Cliente | null>(null);
  const [selectedClienteForEstagiario, setSelectedClienteForEstagiario] = useState<Cliente | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showAdvogadoModal, setShowAdvogadoModal] = useState(false);
  const [showEstagiarioModal, setShowEstagiarioModal] = useState(false);


  // close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // filter
  const filtered = useMemo(() => {
    let items = clientes;

    if (search) {
      const q = search.toLowerCase();
      items = items.filter((c) => {
        const name = getClienteName(c).toLowerCase();
        const doc = getClienteDoc(c).toLowerCase();
        return name.includes(q) || doc.includes(q);
      });
    }
    if (filterType) items = items.filter((c) => c.type === filterType);
    if (filterArea) items = items.filter((c) => c.practice_area === filterArea);
    if (filterStatus) items = items.filter((c) => c.status === filterStatus);

    // sort
    items = [...items].sort((a, b) => {
      let cmp = 0;
      if (sortField === 'name') cmp = (getClienteName(a) || '').localeCompare(getClienteName(b) || '');
      else if (sortField === 'area') cmp = (a.practice_area || '').localeCompare(b.practice_area || '');
      else if (sortField === 'status') cmp = (a.status || '').localeCompare(b.status || '');
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return items;
  }, [clientes, search, filterType, filterArea, filterStatus, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const pageItems = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortField(field); setSortDir('asc'); }
  };

  const SortIcon = ({ field }: { field: SortField }) =>
    sortField === field ? (
      sortDir === 'asc' ? <ChevronUp className="w-3 h-3 inline ml-1" /> : <ChevronDown className="w-3 h-3 inline ml-1" />
    ) : null;

  const handleSave = async (cliente: Cliente) => {
    try {
      await saveCliente(cliente);
      setSlideOpen(false);
      setEditCliente(null);
      showToast('Cliente salvo com sucesso', 'success');
    } catch (err) {
      showToast('Erro ao salvar cliente', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCliente(id);
      setDeleteId(null);
      setOpenDropdown(null);
      showToast('Cliente removido', 'info');
    } catch (err) {
      showToast('Erro ao remover cliente', 'error');
    }
  };

  const openNew = () => {
    setEditCliente(null);
    setSlideOpen(true);
  };

  const openEdit = (c: Cliente) => {
    setSlideOpen(true);
    setOpenDropdown(null);
  };

  const handleOpenStatusModal = (cliente: Cliente) => {
    setSelectedClienteForStatus(cliente);
    setShowStatusModal(true);
    setOpenDropdown(null);
  };

  const handleOpenAdvogadoModal = (cliente: Cliente) => {
    setSelectedClienteForAdvogado(cliente);
    setShowAdvogadoModal(true);
    setOpenDropdown(null);
  };

  const handleOpenEstagiarioModal = (cliente: Cliente) => {
    setSelectedClienteForEstagiario(cliente);
    setShowEstagiarioModal(true);
    setOpenDropdown(null);
  };

  const handleModalSuccess = () => {
    showToast('Operação realizada com sucesso', 'success');
  };


  const getMembroById = (id: string) => membros.find((u) => u.id === id);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Clientes</h1>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium rounded-md px-4 py-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Novo Cliente
        </button>
      </div>

      {/* Filter bar */}
      <div className="bg-card border border-border rounded-lg p-3 mb-4 flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            className="w-full bg-card border border-border rounded-md pl-9 pr-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-accent transition-colors"
            placeholder="Buscar por nome, CPF ou CNPJ..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select className="bg-card border border-border rounded-md px-3 py-2 text-sm text-muted-foreground" value={filterType} onChange={(e) => { setFilterType(e.target.value as any); setPage(1); }}>
          <option value="">Tipo: Todos</option>
          <option value="pf">PF</option>
          <option value="pj">PJ</option>
        </select>
        <select className="bg-card border border-border rounded-md px-3 py-2 text-sm text-muted-foreground" value={filterArea} onChange={(e) => { setFilterArea(e.target.value); setPage(1); }}>
          <option value="">Área: Todas</option>
          <option value="trabalhista">Trabalhista</option>
          <option value="civil">Civil</option>
          <option value="criminal">Criminal</option>
          <option value="previdenciario">Previdenciário</option>
          <option value="tributario">Tributário</option>
        </select>
        <select className="bg-card border border-border rounded-md px-3 py-2 text-sm text-muted-foreground" value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}>
          <option value="">Status: Todos</option>
          <option value="ativo">Ativo</option>
          <option value="inativo">Inativo</option>
        </select>
      </div>

      {/* Table or empty */}
      {loadingClientes ? (
        <div className="flex justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-lg">
          <EmptyState
            icon={Users}
            title="Nenhum cliente encontrado"
            subtitle="Tente ajustar os filtros ou cadastre um novo cliente"
            ctaLabel="+ Novo Cliente"
            onCta={openNew}
          />
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3 cursor-pointer select-none" onClick={() => toggleSort('name')}>
                  Cliente <SortIcon field="name" />
                </th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">Tipo</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3 cursor-pointer select-none" onClick={() => toggleSort('area')}>
                  Área <SortIcon field="area" />
                </th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">Polo</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3 cursor-pointer select-none" onClick={() => toggleSort('status')}>
                  Status <SortIcon field="status" />
                </th>
                {admin && (
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">Responsável</th>
                )}
                <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((c) => {
                const name = getClienteName(c);
                const doc = getClienteDoc(c);
                const maskedDoc = c.type === 'pf' ? maskCpf(doc) : maskCnpj(doc);
                const initials = name
                  .split(' ')
                  .filter(Boolean)
                  .map((w) => w[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2);
                const responsible = getMembroById(c.responsible_id || '');

                return (
                  <tr key={c.id} className="hover:bg-muted/50 transition-colors border-b border-border/50 last:border-0 border-l-4 border-l-transparent hover:border-l-primary/30">
                    {/* CLIENTE */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium shrink-0 ${
                          c.type === 'pf' ? 'bg-muted text-muted-foreground' : 'bg-primary/20 text-primary'
                        }`}>
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate flex items-center gap-1.5">
                            {name}
                            {c.is_vip && <Star className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />}
                          </p>
                          <p className="text-xs text-muted-foreground">{maskedDoc}</p>
                        </div>
                      </div>
                    </td>
                    {/* TIPO */}
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full ${
                        c.type === 'pf' ? 'bg-muted text-muted-foreground' : 'bg-primary/20 text-primary'
                      }`}>
                        {c.type.toUpperCase()}
                      </span>
                    </td>
                    {/* ÁREA */}
                    <td className="px-4 py-3">
                      <StatusBadge variant={c.practice_area} />
                    </td>
                    {/* POLO */}
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {getPoloLabel((c as any).polo || '')}
                    </td>
                    {/* STATUS */}
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full ${
                        c.status === 'ativo'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {c.status === 'ativo' ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    {/* RESPONSÁVEL */}
                    {admin && (
                      <td className="px-4 py-3">
                        {responsible && (
                          <div className="flex items-center gap-2">
                            <UserAvatar name={responsible.name} color={responsible.avatar_color} size="sm" />
                            <span className="text-sm text-muted-foreground truncate">{responsible.name}</span>
                          </div>
                        )}
                      </td>
                    )}
                    {/* AÇÕES */}
                    <td className="px-4 py-3 text-right">
                      <div className="relative inline-block" ref={openDropdown === c.id ? dropdownRef : undefined}>
                        <button
                          onClick={() => setOpenDropdown(openDropdown === c.id ? null : c.id)}
                          className="text-muted-foreground hover:text-foreground transition-colors p-1"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                        {openDropdown === c.id && (
                          <div className="absolute right-0 top-full mt-1 bg-card border border-border shadow-lg rounded-lg py-1 z-10 w-40">
                            <button
                              onClick={() => { onNavigateDetail?.(c.id); setOpenDropdown(null); }}
                               className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted/50 transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                              Ver Detalhes
                            </button>
                            <button
                              onClick={() => openEdit(c)}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted/50 transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                               Editar
                             </button>
                             <button
                               onClick={() => handleOpenStatusModal(c)}
                               className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted/50 transition-colors"
                             >
                               <Users className="w-4 h-4" />
                               Alterar Status
                             </button>
                             <button
                               onClick={() => handleOpenAdvogadoModal(c)}
                               className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted/50 transition-colors"
                             >
                               <UserAvatar name="A" color="blue" size="sm" />
                               Atribuir Advogado
                             </button>
                             <button
                               onClick={() => handleOpenEstagiarioModal(c)}
                               className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted/50 transition-colors"
                             >
                               <UserAvatar name="E" color="green" size="sm" />
                               Atribuir Estagiário
                             </button>
                             <div className="border-t border-border/50 my-1" />

                            <button
                              onClick={() => { setDeleteId(c.id); setOpenDropdown(null); }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                              Excluir
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="border-t border-border px-4 py-3 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Mostrando {(page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, filtered.length)} de {filtered.length} clientes
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="bg-card border border-border rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted/50 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="bg-card border border-border rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted/50 disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Slide-over */}
      {slideOpen && (
        <ClienteSlideOver
          open={slideOpen}
          onClose={() => { setSlideOpen(false); setEditCliente(null); }}
          onSave={handleSave}
          editCliente={editCliente}
        />
      )}

      {/* Delete confirmation modal */}
      {deleteId && (
        <>
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40" onClick={() => setDeleteId(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-card rounded-xl shadow-xl p-6 w-full max-w-sm">
              <h3 className="text-lg font-semibold text-foreground mb-2">Confirmar exclusão</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita.
              </p>
              <div className="flex justify-end gap-3">
                <button onClick={() => setDeleteId(null)} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Cancelar
                </button>
                <button
                  onClick={() => handleDelete(deleteId)}
                  className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-md px-4 py-2 transition-colors"
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      <ModalChangeStatus
        isOpen={showStatusModal}
        cliente={selectedClienteForStatus}
        onClose={() => setShowStatusModal(false)}
        onSuccess={handleModalSuccess}
      />

      <ModalAssignAdvogado
        isOpen={showAdvogadoModal}
        cliente={selectedClienteForAdvogado}
        onClose={() => setShowAdvogadoModal(false)}
        onSuccess={handleModalSuccess}
      />

      <ModalAssignEstagiario
        isOpen={showEstagiarioModal}
        cliente={selectedClienteForEstagiario}
        onClose={() => setShowEstagiarioModal(false)}
        onSuccess={handleModalSuccess}
      />
    </div>

  );
}
