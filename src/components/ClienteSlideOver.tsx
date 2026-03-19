import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Star, Users, Building2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  ClienteForm,
  ClienteCriminal,
  ClienteTrabalhista,
  ClienteCivil,
  ClientePrevidenciario,
  ClienteTributario,
  applyPhoneMask,
  applyCpfMask,
  applyCnpjMask,
  applyCepMask,
  isCPFValid,
  isCNPJValid,
} from '@/types/cliente';

interface FieldProps {
  label: string;
  required?: boolean;
  error?: string;
  colSpan?: 2;
  children: React.ReactNode;
}

function Field({ label, required, error, colSpan, children }: FieldProps) {
  return (
    <div className={colSpan === 2 ? 'col-span-2' : ''}>
      <label className="block text-sm font-medium text-foreground/80 mb-1">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

const inputCls =
  'w-full bg-card border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent';
const inputErrCls =
  'w-full bg-card border border-red-300 rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent';
const sectionTitle = 'text-sm font-semibold text-foreground mb-4 pb-2 border-b border-border/50 col-span-2 mt-4';

interface ClienteSlideOverProps {
  open: boolean;
  onClose: () => void;
  onSave: (cliente: any) => void;
  editCliente?: any | null;
}

export default function ClienteSlideOver({ open, onClose, onSave, editCliente }: ClienteSlideOverProps) {
  const { currentUser } = useAuth();

  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState<'pf' | 'pj' | null>(null);
  const [selectedArea, setSelectedArea] = useState<'criminal' | 'trabalhista' | 'civil' | 'previdenciario' | 'tributario' | null>(null);
  const [office, setOffice] = useState<any>(null);
  const [form, setForm] = useState<Partial<ClienteForm>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const savedOffice = localStorage.getItem('whp_office');
    if (savedOffice) {
      setOffice(JSON.parse(savedOffice));
    }

    if (open) {
      if (editCliente) {
        setSelectedType(editCliente.type || 'pf');
        setSelectedArea(editCliente.practice_area || 'criminal');
        setForm({ ...editCliente });
        setStep(1);
      } else {
        setSelectedType(null);
        setSelectedArea(null);
        setForm({
          status: 'ativo',
          is_vip: false,
        });
        setStep(1);
      }
      setErrors({});
    }
  }, [open, editCliente]);

  const set = (key: string, value: any) => {
    setForm((p) => {
      if (key.includes('.')) {
        const [parent, child] = key.split('.');
        return {
          ...p,
          [parent]: {
            ...(p[parent as keyof ClienteForm] as any || {}),
            [child]: value
          }
        };
      }
      return { ...p, [key]: value };
    });
    if (errors[key]) setErrors((p) => { const n = { ...p }; delete n[key]; return n; });
  };

  const validateStep2 = () => {
    const errs: Record<string, string> = {};
    
    if (selectedType === 'pf') {
      if (!form.nome) errs.nome = 'Nome é obrigatório';
      if (!form.cpf) errs.cpf = 'CPF é obrigatório';
      else if (!isCPFValid(form.cpf)) errs.cpf = 'CPF inválido';
    } else if (selectedType === 'pj') {
      if (!form.cnpj) errs.cnpj = 'CNPJ é obrigatório';
      else if (!isCNPJValid(form.cnpj)) errs.cnpj = 'CNPJ inválido';
      if (!form.razao_social) errs.razao_social = 'Razão Social é obrigatória';
      if (!form.ramo_atividade) errs.ramo_atividade = 'Ramo de atividade é obrigatório';
    }

    if (selectedArea === 'criminal') {
      const d = (form.dadosCriminal || {}) as ClienteCriminal;
      if (!d.polo_criminal) errs['dadosCriminal.polo_criminal'] = 'Polo é obrigatório';
      if (!d.crime_imputado) errs['dadosCriminal.crime_imputado'] = 'Crime é obrigatório';
      if (!d.data_dos_fatos) errs['dadosCriminal.data_dos_fatos'] = 'Data dos fatos é obrigatória';
      if (!d.fase_processual) errs['dadosCriminal.fase_processual'] = 'Fase Processual é obrigatória';
      if (!d.situacao_prisional) errs['dadosCriminal.situacao_prisional'] = 'Situação Prisional é obrigatória';
      
      if (['preso_preventivo', 'preso_condenado', 'monitorado'].includes(d.situacao_prisional || '')) {
        if (!d.preso_em) errs['dadosCriminal.preso_em'] = 'Data da prisão é obrigatória';
      }
      if (d.situacao_prisional === 'preso_condenado') {
        if (!d.data_condenacao) errs['dadosCriminal.data_condenacao'] = 'Data da condenação é obrigatória';
        if (d.pena_anos === undefined || d.pena_anos < 0) errs['dadosCriminal.pena_anos'] = 'Pena inválida';
      }
      if (d.situacao_prisional === 'monitorado') {
        if (!d.tipo_monitoramento) errs['dadosCriminal.tipo_monitoramento'] = 'Tipo de monitoramento é obrigatório';
      }

    } else if (selectedArea === 'trabalhista') {
      const d = (form.dadosTrabalhista || {}) as ClienteTrabalhista;
      if (!d.polo_trabalhista) errs['dadosTrabalhista.polo_trabalhista'] = 'Polo é obrigatório';
      if (!d.fase_processual) errs['dadosTrabalhista.fase_processual'] = 'Fase Processual é obrigatória';
      
      if (d.polo_trabalhista === 'reclamante') {
        if (!d.tipo_demissao) errs['dadosTrabalhista.tipo_demissao'] = 'Tipo de demissão é obrigatório';
        if (!d.data_admissao) errs['dadosTrabalhista.data_admissao'] = 'Data de admissão é obrigatória';
        if (!d.data_demissao) errs['dadosTrabalhista.data_demissao'] = 'Data de demissão é obrigatória';
      }

      if (d.tipo_demissao === 'justa_causa') {
        if (!d.motivo_justa_causa) errs['dadosTrabalhista.motivo_justa_causa'] = 'Motivo é obrigatório';
        if (!d.data_justa_causa) errs['dadosTrabalhista.data_justa_causa'] = 'Data é obrigatória';
      }

      if (['sem_justa_causa', 'pedido_demissao', 'rescisao_indireta'].includes(d.tipo_demissao || '')) {
        if (!d.motivo_demissao) errs['dadosTrabalhista.motivo_demissao'] = 'Motivo da demissão é obrigatório';
      }

    } else if (selectedArea === 'civil') {
      const d = (form.dadosCivil || {}) as ClienteCivil;
      if (!d.polo_civil) errs['dadosCivil.polo_civil'] = 'Polo é obrigatório';
      if (!d.subtipo) errs['dadosCivil.subtipo'] = 'Subtipo é obrigatório';
      if (!d.data_fato_gerador) errs['dadosCivil.data_fato_gerador'] = 'Data do fato gerador é obrigatória';
      if (!d.fase_processual) errs['dadosCivil.fase_processual'] = 'Fase Processual é obrigatória';

      if (d.subtipo === 'familia') {
        if (!d.tipo_familia) errs['dadosCivil.tipo_familia'] = 'Tipo de ação familiar é obrigatório';
        if (d.tem_filhos && (!d.numero_filhos || d.numero_filhos < 1)) errs['dadosCivil.numero_filhos'] = 'Número de filhos inválido';
      } else if (d.subtipo === 'contratos') {
        if (!d.tipo_contrato) errs['dadosCivil.tipo_contrato'] = 'Tipo de contrato é obrigatório';
        if (d.valor_contrato === undefined || d.valor_contrato < 0) errs['dadosCivil.valor_contrato'] = 'Valor do contrato inválido';
      } else if (d.subtipo === 'imoveis') {
        if (!d.tipo_imovel) errs['dadosCivil.tipo_imovel'] = 'Tipo de imóvel é obrigatório';
        if (!d.endereco_imovel) errs['dadosCivil.endereco_imovel'] = 'Endereço é obrigatório';
      } else if (d.subtipo === 'consumidor') {
        if (!d.tipo_consumidor) errs['dadosCivil.tipo_consumidor'] = 'Tipo de demanda é obrigatório';
        if (d.valor_reclamado === undefined || d.valor_reclamado < 0) errs['dadosCivil.valor_reclamado'] = 'Valor reclamado inválido';
      } else if (d.subtipo === 'sucessoes') {
        if (!d.tipo_sucessao) errs['dadosCivil.tipo_sucessao'] = 'Tipo de sucessão é obrigatório';
        if (d.valor_monte_mor === undefined || d.valor_monte_mor < 0) errs['dadosCivil.valor_monte_mor'] = 'Valor do monte-mor inválido';
      }

    } else if (selectedArea === 'previdenciario') {
      const d = (form.dadosPrevidenciario || {}) as ClientePrevidenciario;
      if (!d.polo_previdenciario) errs['dadosPrevidenciario.polo_previdenciario'] = 'Qualidade do Segurado é obrigatória';
      if (!d.especie_beneficio) errs['dadosPrevidenciario.especie_beneficio'] = 'Espécie do benefício é obrigatória';
      if (!d.nit) errs['dadosPrevidenciario.nit'] = 'NIT é obrigatório';
      if (!d.data_filiacao) errs['dadosPrevidenciario.data_filiacao'] = 'Data de filiação é obrigatória';
      if (!d.fase_processual) errs['dadosPrevidenciario.fase_processual'] = 'Fase Processual é obrigatória';

      if (d.especie_beneficio === 'aposentadoria_idade') {
        if (!d.data_nascimento) errs['dadosPrevidenciario.data_nascimento'] = 'Data de nascimento é obrigatória';
        if (d.tempo_contribuicao_meses === undefined || d.tempo_contribuicao_meses < 0) errs['dadosPrevidenciario.tempo_contribuicao_meses'] = 'Tempo de contribuição inválido';
      } else if (d.especie_beneficio === 'aposentadoria_tempo') {
        if (d.tempo_contribuicao_meses === undefined || d.tempo_contribuicao_meses < 0) errs['dadosPrevidenciario.tempo_contribuicao_meses'] = 'Tempo de contribuição inválido';
        if (!d.data_ultimo_recolhimento) errs['dadosPrevidenciario.data_ultimo_recolhimento'] = 'Data do último recolhimento é obrigatória';
      } else if (d.especie_beneficio === 'aposentadoria_invalidez') {
        if (!d.data_incapacidade) errs['dadosPrevidenciario.data_incapacidade'] = 'Data da incapacidade é obrigatória';
        if (!d.laudo_medico) errs['dadosPrevidenciario.laudo_medico'] = 'Laudo médico é obrigatório';
      } else if (d.especie_beneficio === 'auxilio_doenca') {
        if (!d.data_inicio_afastamento) errs['dadosPrevidenciario.data_inicio_afastamento'] = 'Data de início do afastamento é obrigatória';
        if (!d.laudo_medico) errs['dadosPrevidenciario.laudo_medico'] = 'Laudo médico é obrigatório';
      } else if (d.especie_beneficio === 'auxilio_acidente') {
        if (!d.data_acidente) errs['dadosPrevidenciario.data_acidente'] = 'Data do acidente é obrigatória';
      } else if (d.especie_beneficio === 'pensao_morte') {
        if (!d.data_obito) errs['dadosPrevidenciario.data_obito'] = 'Data do óbito é obrigatória';
        if (!d.grau_parentesco) errs['dadosPrevidenciario.grau_parentesco'] = 'Grau de parentesco é obrigatório';
      } else if (d.especie_beneficio === 'bpc_loas') {
        if (d.renda_familiar === undefined || d.renda_familiar < 0) errs['dadosPrevidenciario.renda_familiar'] = 'Renda familiar inválida';
        if (d.numero_dependentes === undefined || d.numero_dependentes < 0) errs['dadosPrevidenciario.numero_dependentes'] = 'Número de dependentes inválido';
        if (d.deficiencia_comprovada === undefined) errs['dadosPrevidenciario.deficiencia_comprovada'] = 'Campo obrigatório';
      }
    } else if (selectedArea === 'tributario') {
      const d = (form.dadosTributario || {}) as ClienteTributario;
      if (!d.polo_tributario) errs['dadosTributario.polo_tributario'] = 'Polo é obrigatório';
      if (!d.tipo_tributo) errs['dadosTributario.tipo_tributo'] = 'Tipo de tributo é obrigatório';
      if (!d.fase_processual) errs['dadosTributario.fase_processual'] = 'Fase Processual é obrigatória';
      if (!d.orgao_fiscalizador) errs['dadosTributario.orgao_fiscalizador'] = 'Órgão fiscalizador é obrigatório';

      if (selectedType === 'pj') {
        if (!d.regime_tributario) errs['dadosTributario.regime_tributario'] = 'Regime tributário é obrigatório';
      }
    }
    
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (step === 1) {
      if (!selectedType || !selectedArea) return;
      setStep(2);
    }
  };

  const handleSave = () => {
    if (!validateStep2()) return;

    const cliente: any = {
      ...form,
      type: selectedType,
      practice_area: selectedArea,
      id: editCliente?.id || `cli-${Date.now()}`,
      created_at: editCliente?.created_at || new Date().toISOString().split('T')[0],
      updated_at: new Date().toISOString().split('T')[0],
      created_by: editCliente?.created_by || currentUser!.id,
      responsible_id: form.responsible_id || currentUser!.id,
    };

    if (cliente.practice_area !== 'criminal') delete cliente.dadosCriminal;
    if (cliente.practice_area !== 'trabalhista') delete cliente.dadosTrabalhista;
    if (cliente.practice_area !== 'civil') delete cliente.dadosCivil;
    if (cliente.practice_area !== 'previdenciario') delete cliente.dadosPrevidenciario;
    if (cliente.practice_area !== 'tributario') delete cliente.dadosTributario;

    onSave(cliente);
  };

  if (!open) return null;

  const stepLabel = step === 1 ? 'Passo 1 de 2 — Tipo e Área' : 'Passo 2 de 2 — Dados do Cliente';
  const ic = (k: string) => (errors[k] ? inputErrCls : inputCls);

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40" onClick={onClose} />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-2xl bg-card shadow-xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              {editCliente ? 'Editar Cliente' : 'Novo Cliente'}
            </h2>
            <p className="text-sm text-muted-foreground">{stepLabel}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-secondary-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {step === 1 && (
            <div className="space-y-8">
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-4">Tipo de cliente</h3>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setSelectedType('pf')}
                    className={`flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all ${
                      selectedType === 'pf'
                        ? 'border-primary bg-primary/5'
                        : 'border-border bg-card hover:border-primary/50'
                    }`}
                  >
                    <Users className={`w-8 h-8 mb-3 ${selectedType === 'pf' ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className="font-medium text-foreground">Pessoa Física</span>
                    <span className="text-xs text-muted-foreground mt-1">CPF, dados pessoais</span>
                  </button>
                  <button
                    onClick={() => setSelectedType('pj')}
                    className={`flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all ${
                      selectedType === 'pj'
                        ? 'border-primary bg-primary/5'
                        : 'border-border bg-card hover:border-primary/50'
                    }`}
                  >
                    <Building2 className={`w-8 h-8 mb-3 ${selectedType === 'pj' ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className="font-medium text-foreground">Pessoa Jurídica</span>
                    <span className="text-xs text-muted-foreground mt-1">CNPJ, razão social</span>
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-foreground mb-4">Área do Direito</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {(office?.active_areas || ['trabalhista', 'civil', 'criminal', 'previdenciario', 'tributario']).map((areaId: string) => {
                    const areaLabels: Record<string, string> = {
                      trabalhista: 'Trabalhista',
                      civil: 'Civil',
                      criminal: 'Criminal',
                      previdenciario: 'Previdenciário',
                      tributario: 'Tributário'
                    };
                    
                    // Filter areas based on client type if needed
                    if (selectedType === 'pj' && (areaId === 'criminal' || areaId === 'previdenciario')) return null;

                    return (
                      <button
                        key={areaId}
                        onClick={() => setSelectedArea(areaId as any)}
                        className={`py-3 px-2 rounded-lg border-2 text-sm font-medium transition-all ${
                          selectedArea === areaId
                            ? {
                                trabalhista: 'border-badge-trabalhista bg-badge-trabalhista text-badge-trabalhista-foreground',
                                civil: 'border-badge-civil bg-badge-civil text-badge-civil-foreground',
                                criminal: 'border-badge-criminal bg-badge-criminal text-badge-criminal-foreground',
                                previdenciario: 'border-badge-previdenciario bg-badge-previdenciario text-badge-previdenciario-foreground',
                                tributario: 'border-badge-tributario bg-badge-tributario text-badge-tributario-foreground',
                              }[areaId]
                            : 'border-border bg-card text-foreground hover:border-primary/50'
                        }`}
                      >
                        {areaLabels[areaId] || areaId}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="grid grid-cols-2 gap-4">
              <h3 className="text-sm font-semibold text-foreground mb-4 pb-2 border-b border-border/50 col-span-2">Dados Básicos</h3>
              
              {selectedType === 'pf' ? (
                <>
                  <Field label="Nome Completo" required colSpan={2} error={errors.nome}>
                    <input className={ic('nome')} value={form.nome || ''} onChange={(e) => set('nome', e.target.value)} placeholder="Nome completo" />
                  </Field>
                  <Field label="CPF" required error={errors.cpf}>
                    <input className={ic('cpf')} value={form.cpf || ''} onChange={(e) => set('cpf', applyCpfMask(e.target.value))} placeholder="000.000.000-00" />
                  </Field>
                  <Field label="RG">
                    <input className={inputCls} value={form.rg || ''} onChange={(e) => set('rg', e.target.value)} placeholder="RG" />
                  </Field>
                  <Field label="Data de Nascimento">
                    <input type="date" className={inputCls} value={form.data_nascimento || ''} onChange={(e) => set('data_nascimento', e.target.value)} />
                  </Field>
                </>
              ) : (
                <>
                  <Field label="CNPJ" required error={errors.cnpj}>
                    <input className={ic('cnpj')} value={form.cnpj || ''} onChange={(e) => set('cnpj', applyCnpjMask(e.target.value))} placeholder="00.000.000/0000-00" />
                  </Field>
                  <Field label="Razão Social" required error={errors.razao_social} colSpan={2}>
                    <input className={ic('razao_social')} value={form.razao_social || ''} onChange={(e) => set('razao_social', e.target.value)} placeholder="Razão Social" />
                  </Field>
                  <Field label="Nome Fantasia" colSpan={2}>
                    <input className={inputCls} value={form.nome || ''} onChange={(e) => set('nome', e.target.value)} placeholder="Nome Fantasia" />
                  </Field>
                  <Field label="Ramo de Atividade" required error={errors.ramo_atividade}>
                    <select className={ic('ramo_atividade')} value={form.ramo_atividade || ''} onChange={(e) => set('ramo_atividade', e.target.value)}>
                      <option value="">Selecione</option>
                      <option value="comercio">Comércio</option>
                      <option value="industria">Indústria</option>
                      <option value="servicos">Serviços</option>
                      <option value="financeiro">Financeiro</option>
                      <option value="tecnologia">Tecnologia</option>
                      <option value="saude">Saúde</option>
                      <option value="educacao">Educação</option>
                      <option value="outro">Outro</option>
                    </select>
                  </Field>
                  <Field label="Número de Funcionários">
                    <input type="number" min="0" className={inputCls} value={form.numero_funcionarios ?? ''} onChange={(e) => set('numero_funcionarios', e.target.value ? parseInt(e.target.value) : undefined)} />
                  </Field>
                </>
              )}

              <Field label="Status">
                <select className={inputCls} value={form.status || 'ativo'} onChange={(e) => set('status', e.target.value)}>
                  <option value="ativo">Ativo</option>
                  <option value="inativo">Inativo</option>
                  <option value="arquivado">Arquivado</option>
                </select>
              </Field>
              <Field label="Cliente VIP">
                <label className="flex items-center gap-3 cursor-pointer mt-2">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={form.is_vip || false}
                    onClick={() => set('is_vip', !form.is_vip)}
                    className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors ${
                      form.is_vip ? 'bg-primary' : 'bg-secondary'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 rounded-full bg-card shadow transform transition-transform mt-0.5 ${form.is_vip ? 'translate-x-4 ml-0.5' : 'translate-x-0.5'}`} />
                  </button>
                  <Star className={`w-4 h-4 ${form.is_vip ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/80'}`} />
                </label>
              </Field>
              <Field label="E-mail" colSpan={2}>
                <input type="email" className={inputCls} value={form.email || ''} onChange={(e) => set('email', e.target.value)} placeholder="email@exemplo.com" />
              </Field>
              <Field label="Telefone">
                <input className={inputCls} value={form.telefone || ''} onChange={(e) => set('telefone', applyPhoneMask(e.target.value))} placeholder="(00) 0000-0000" />
              </Field>
              <Field label="Celular">
                <input className={inputCls} value={form.celular || ''} onChange={(e) => set('celular', applyPhoneMask(e.target.value))} placeholder="(00) 00000-0000" />
              </Field>
              <Field label="CEP">
                <input className={inputCls} value={form.cep || ''} onChange={(e) => set('cep', applyCepMask(e.target.value))} placeholder="00000-000" />
              </Field>
              <Field label="Logradouro" colSpan={2}>
                <input className={inputCls} value={form.logradouro || ''} onChange={(e) => set('logradouro', e.target.value)} placeholder="Rua, Avenida, etc." />
              </Field>
              <Field label="Número">
                <input className={inputCls} value={form.numero || ''} onChange={(e) => set('numero', e.target.value)} placeholder="Número" />
              </Field>
              <Field label="Complemento">
                <input className={inputCls} value={form.complemento || ''} onChange={(e) => set('complemento', e.target.value)} placeholder="Apto, Bloco, etc." />
              </Field>
              <Field label="Bairro">
                <input className={inputCls} value={form.bairro || ''} onChange={(e) => set('bairro', e.target.value)} placeholder="Bairro" />
              </Field>
              <Field label="Cidade">
                <input className={inputCls} value={form.cidade || ''} onChange={(e) => set('cidade', e.target.value)} placeholder="Cidade" />
              </Field>
              <Field label="Estado">
                <select className={inputCls} value={form.estado || ''} onChange={(e) => set('estado', e.target.value)}>
                  <option value="">Selecione</option>
                  {['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'].map(uf => (
                    <option key={uf} value={uf}>{uf}</option>
                  ))}
                </select>
              </Field>
              <Field label="Observações" colSpan={2}>
                <textarea
                  rows={3}
                  maxLength={500}
                  className={inputCls}
                  value={form.observacoes || ''}
                  onChange={(e) => set('observacoes', e.target.value)}
                  placeholder="Observações internas sobre este cliente..."
                />
              </Field>

              {selectedArea === 'criminal' && (
                <>
                  <h3 className={sectionTitle}>Dados Criminal</h3>
                  <Field label="Polo no Processo" required error={errors['dadosCriminal.polo_criminal']}>
                    <select className={ic('dadosCriminal.polo_criminal')} value={form.dadosCriminal?.polo_criminal || ''} onChange={(e) => set('dadosCriminal.polo_criminal', e.target.value)}>
                      <option value="">Selecione</option>
                      <option value="réu">Réu</option>
                      <option value="vítima">Vítima</option>
                      <option value="investigado">Investigado</option>
                    </select>
                  </Field>
                  <Field label="Crime Imputado" required error={errors['dadosCriminal.crime_imputado']}>
                    <input className={ic('dadosCriminal.crime_imputado')} value={form.dadosCriminal?.crime_imputado || ''} onChange={(e) => set('dadosCriminal.crime_imputado', e.target.value)} placeholder="Ex: Roubo, Homicídio" />
                  </Field>
                  <Field label="Data dos Fatos" required error={errors['dadosCriminal.data_dos_fatos']}>
                    <input type="date" className={ic('dadosCriminal.data_dos_fatos')} value={form.dadosCriminal?.data_dos_fatos || ''} onChange={(e) => set('dadosCriminal.data_dos_fatos', e.target.value)} />
                  </Field>
                  <Field label="Fase Processual" required error={errors['dadosCriminal.fase_processual']}>
                    <select className={ic('dadosCriminal.fase_processual')} value={form.dadosCriminal?.fase_processual || ''} onChange={(e) => set('dadosCriminal.fase_processual', e.target.value)}>
                      <option value="">Selecione</option>
                      <option value="inquerito">Inquérito Policial</option>
                      <option value="instrucao">Instrução Criminal</option>
                      <option value="recurso">Recurso</option>
                    </select>
                  </Field>
                  <Field label="Situação Prisional" required error={errors['dadosCriminal.situacao_prisional']}>
                    <select className={ic('dadosCriminal.situacao_prisional')} value={form.dadosCriminal?.situacao_prisional || ''} onChange={(e) => set('dadosCriminal.situacao_prisional', e.target.value)}>
                      <option value="">Selecione</option>
                      <option value="solto">Solto</option>
                      <option value="preso_preventivo">Preso Preventivo</option>
                      <option value="preso_condenado">Preso Condenado</option>
                      <option value="monitorado">Monitorado</option>
                    </select>
                  </Field>

                  {['preso_preventivo', 'preso_condenado', 'monitorado'].includes(form.dadosCriminal?.situacao_prisional || '') && (
                    <Field label="Preso em" required error={errors['dadosCriminal.preso_em']}>
                      <input type="date" className={ic('dadosCriminal.preso_em')} value={form.dadosCriminal?.preso_em || ''} onChange={(e) => set('dadosCriminal.preso_em', e.target.value)} />
                    </Field>
                  )}

                  {form.dadosCriminal?.situacao_prisional === 'preso_condenado' && (
                    <>
                      <Field label="Data da Condenação" required error={errors['dadosCriminal.data_condenacao']}>
                        <input type="date" className={ic('dadosCriminal.data_condenacao')} value={form.dadosCriminal?.data_condenacao || ''} onChange={(e) => set('dadosCriminal.data_condenacao', e.target.value)} />
                      </Field>
                      <Field label="Pena (anos)" required error={errors['dadosCriminal.pena_anos']}>
                        <input type="number" min="0" className={ic('dadosCriminal.pena_anos')} value={form.dadosCriminal?.pena_anos ?? ''} onChange={(e) => set('dadosCriminal.pena_anos', e.target.value ? parseInt(e.target.value) : undefined)} />
                      </Field>
                    </>
                  )}

                  {form.dadosCriminal?.situacao_prisional === 'monitorado' && (
                    <Field label="Tipo de Monitoramento" required error={errors['dadosCriminal.tipo_monitoramento']} colSpan={2}>
                      <select className={ic('dadosCriminal.tipo_monitoramento')} value={form.dadosCriminal?.tipo_monitoramento || ''} onChange={(e) => set('dadosCriminal.tipo_monitoramento', e.target.value)}>
                        <option value="">Selecione</option>
                        <option value="tornozeleira_eletronica">Tornozeleira Eletrônica</option>
                        <option value="comparecimento_periodico">Comparecimento Periódico</option>
                        <option value="outro">Outro</option>
                      </select>
                    </Field>
                  )}
                </>
              )}

              {selectedArea === 'trabalhista' && (
                <>
                  <h3 className={sectionTitle}>Dados Trabalhista</h3>
                  <Field label="Polo no Processo" required error={errors['dadosTrabalhista.polo_trabalhista']}>
                    <select className={ic('dadosTrabalhista.polo_trabalhista')} value={form.dadosTrabalhista?.polo_trabalhista || ''} onChange={(e) => set('dadosTrabalhista.polo_trabalhista', e.target.value)}>
                      <option value="">Selecione</option>
                      <option value="reclamante">Reclamante</option>
                      <option value="reclamado">Reclamado</option>
                    </select>
                  </Field>
                  <Field label="Fase Processual" required error={errors['dadosTrabalhista.fase_processual']}>
                    <select className={ic('dadosTrabalhista.fase_processual')} value={form.dadosTrabalhista?.fase_processual || ''} onChange={(e) => set('dadosTrabalhista.fase_processual', e.target.value)}>
                      <option value="">Selecione</option>
                      <option value="conhecimento">Conhecimento</option>
                      <option value="execucao">Execução</option>
                      <option value="recurso">Recurso</option>
                    </select>
                  </Field>

                  {selectedType === 'pf' ? (
                    <>
                      <Field label="NIT / PIS / PASEP">
                        <input className={inputCls} value={form.dadosTrabalhista?.nit || ''} onChange={(e) => set('dadosTrabalhista.nit', e.target.value)} placeholder="Ex: 12345678901" />
                      </Field>
                      <Field label="Número da CTPS">
                        <input className={inputCls} value={form.dadosTrabalhista?.ctps || ''} onChange={(e) => set('dadosTrabalhista.ctps', e.target.value)} placeholder="Ex: 000123" />
                      </Field>
                      <Field label="Salário Base (R$)">
                        <input type="number" min="0" className={inputCls} value={form.dadosTrabalhista?.salario_base ?? ''} onChange={(e) => set('dadosTrabalhista.salario_base', e.target.value ? parseFloat(e.target.value) : undefined)} placeholder="0.00" />
                      </Field>

                      {form.dadosTrabalhista?.polo_trabalhista === 'reclamante' && (
                        <>
                          <Field label="Tipo de Demissão" required error={errors['dadosTrabalhista.tipo_demissao']}>
                            <select className={ic('dadosTrabalhista.tipo_demissao')} value={form.dadosTrabalhista?.tipo_demissao || ''} onChange={(e) => set('dadosTrabalhista.tipo_demissao', e.target.value)}>
                              <option value="">Selecione</option>
                              <option value="sem_justa_causa">Sem Justa Causa</option>
                              <option value="justa_causa">Justa Causa</option>
                              <option value="pedido_demissao">Pedido de Demissão</option>
                              <option value="rescisao_indireta">Rescisão Indireta</option>
                              <option value="rescisao_comum">Rescisão Comum</option>
                              <option value="nao_aplicavel">Não Aplicável</option>
                            </select>
                          </Field>
                          <Field label="Data de Admissão" required error={errors['dadosTrabalhista.data_admissao']}>
                            <input type="date" className={ic('dadosTrabalhista.data_admissao')} value={form.dadosTrabalhista?.data_admissao || ''} onChange={(e) => set('dadosTrabalhista.data_admissao', e.target.value)} />
                          </Field>
                          <Field label="Data de Demissão" required error={errors['dadosTrabalhista.data_demissao']}>
                            <input type="date" className={ic('dadosTrabalhista.data_demissao')} value={form.dadosTrabalhista?.data_demissao || ''} onChange={(e) => set('dadosTrabalhista.data_demissao', e.target.value)} />
                          </Field>

                          {['sem_justa_causa', 'pedido_demissao', 'rescisao_indireta'].includes(form.dadosTrabalhista?.tipo_demissao || '') && (
                            <Field label="Motivo da Demissão" required error={errors['dadosTrabalhista.motivo_demissao']} colSpan={2}>
                              <textarea rows={2} maxLength={500} className={ic('dadosTrabalhista.motivo_demissao')} value={form.dadosTrabalhista?.motivo_demissao || ''} onChange={(e) => set('dadosTrabalhista.motivo_demissao', e.target.value)} placeholder="Descreva o motivo..." />
                            </Field>
                          )}

                          {form.dadosTrabalhista?.tipo_demissao === 'justa_causa' && (
                            <>
                              <Field label="Motivo da Justa Causa" required error={errors['dadosTrabalhista.motivo_justa_causa']} colSpan={2}>
                                <textarea rows={2} maxLength={500} className={ic('dadosTrabalhista.motivo_justa_causa')} value={form.dadosTrabalhista?.motivo_justa_causa || ''} onChange={(e) => set('dadosTrabalhista.motivo_justa_causa', e.target.value)} placeholder="Descreva o motivo..." />
                              </Field>
                              <Field label="Data da Justa Causa" required error={errors['dadosTrabalhista.data_justa_causa']}>
                                <input type="date" className={ic('dadosTrabalhista.data_justa_causa')} value={form.dadosTrabalhista?.data_justa_causa || ''} onChange={(e) => set('dadosTrabalhista.data_justa_causa', e.target.value)} />
                              </Field>
                            </>
                          )}
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      <Field label="Número de Funcionários Envolvidos">
                        <input type="number" min="1" className={inputCls} value={form.dadosTrabalhista?.numero_funcionarios_envolvidos ?? ''} onChange={(e) => set('dadosTrabalhista.numero_funcionarios_envolvidos', e.target.value ? parseInt(e.target.value) : undefined)} />
                      </Field>
                      <Field label="Departamento Responsável">
                        <input className={inputCls} value={form.dadosTrabalhista?.departamento_responsavel || ''} onChange={(e) => set('dadosTrabalhista.departamento_responsavel', e.target.value)} placeholder="Ex: RH, Administrativo, Financeiro" />
                      </Field>
                    </>
                  )}
                </>
              )}

              {selectedArea === 'civil' && (
                <>
                  <h3 className={sectionTitle}>Dados Civil</h3>
                  <Field label="Polo no Processo" required error={errors['dadosCivil.polo_civil']}>
                    <select className={ic('dadosCivil.polo_civil')} value={form.dadosCivil?.polo_civil || ''} onChange={(e) => set('dadosCivil.polo_civil', e.target.value)}>
                      <option value="">Selecione</option>
                      <option value="autor">Autor</option>
                      <option value="réu">Réu</option>
                      <option value="terceiro">Terceiro Interveniente</option>
                    </select>
                  </Field>
                  <Field label="Subtipo da Ação" required error={errors['dadosCivil.subtipo']}>
                    <select className={ic('dadosCivil.subtipo')} value={form.dadosCivil?.subtipo || ''} onChange={(e) => set('dadosCivil.subtipo', e.target.value)}>
                      <option value="">Selecione</option>
                      {selectedType === 'pf' && <option value="familia">Família</option>}
                      <option value="contratos">Contratos</option>
                      <option value="imoveis">Imóveis</option>
                      <option value="consumidor">Consumidor</option>
                      {selectedType === 'pf' && <option value="sucessoes">Sucessões</option>}
                      <option value="outro">Outro</option>
                    </select>
                  </Field>
                  <Field label="Data do Fato Gerador" required error={errors['dadosCivil.data_fato_gerador']}>
                    <input type="date" className={ic('dadosCivil.data_fato_gerador')} value={form.dadosCivil?.data_fato_gerador || ''} onChange={(e) => set('dadosCivil.data_fato_gerador', e.target.value)} />
                  </Field>
                  <Field label="Valor da Causa (R$)">
                    <input type="number" min="0" className={inputCls} value={form.dadosCivil?.valor_causa ?? ''} onChange={(e) => set('dadosCivil.valor_causa', e.target.value ? parseFloat(e.target.value) : undefined)} placeholder="0.00" />
                  </Field>
                  <Field label="Fase Processual" required error={errors['dadosCivil.fase_processual']} colSpan={2}>
                    <select className={ic('dadosCivil.fase_processual')} value={form.dadosCivil?.fase_processual || ''} onChange={(e) => set('dadosCivil.fase_processual', e.target.value)}>
                      <option value="">Selecione</option>
                      <option value="conhecimento">Conhecimento</option>
                      <option value="execucao">Execução</option>
                      <option value="recurso">Recurso</option>
                    </select>
                  </Field>

                  {form.dadosCivil?.subtipo === 'familia' && (
                    <>
                      <Field label="Tipo de Ação Familiar" required error={errors['dadosCivil.tipo_familia']}>
                        <select className={ic('dadosCivil.tipo_familia')} value={form.dadosCivil?.tipo_familia || ''} onChange={(e) => set('dadosCivil.tipo_familia', e.target.value)}>
                          <option value="">Selecione</option>
                          <option value="divorcio">Divórcio</option>
                          <option value="guarda">Guarda</option>
                          <option value="alimentos">Alimentos</option>
                          <option value="inventario">Inventário</option>
                          <option value="outro">Outro</option>
                        </select>
                      </Field>
                      <Field label="Possui Filhos">
                        <label className="flex items-center gap-3 cursor-pointer mt-2">
                          <button
                            type="button"
                            role="switch"
                            aria-checked={form.dadosCivil?.tem_filhos || false}
                            onClick={() => set('dadosCivil.tem_filhos', !form.dadosCivil?.tem_filhos)}
                            className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors ${
                              form.dadosCivil?.tem_filhos ? 'bg-primary' : 'bg-secondary'
                            }`}
                          >
                            <span className={`inline-block h-4 w-4 rounded-full bg-card shadow transform transition-transform mt-0.5 ${form.dadosCivil?.tem_filhos ? 'translate-x-4 ml-0.5' : 'translate-x-0.5'}`} />
                          </button>
                        </label>
                      </Field>
                      {form.dadosCivil?.tem_filhos && (
                        <Field label="Número de Filhos" required error={errors['dadosCivil.numero_filhos']}>
                          <input type="number" min="1" className={ic('dadosCivil.numero_filhos')} value={form.dadosCivil?.numero_filhos ?? ''} onChange={(e) => set('dadosCivil.numero_filhos', e.target.value ? parseInt(e.target.value) : undefined)} />
                        </Field>
                      )}
                    </>
                  )}

                  {form.dadosCivil?.subtipo === 'contratos' && (
                    <>
                      <Field label="Tipo de Contrato" required error={errors['dadosCivil.tipo_contrato']}>
                        <select className={ic('dadosCivil.tipo_contrato')} value={form.dadosCivil?.tipo_contrato || ''} onChange={(e) => set('dadosCivil.tipo_contrato', e.target.value)}>
                          <option value="">Selecione</option>
                          <option value="compra_venda">Compra e Venda</option>
                          <option value="locacao">Locação</option>
                          <option value="prestacao_servicos">Prestação de Serviços</option>
                          <option value="emprestimo">Empréstimo</option>
                          <option value="outro">Outro</option>
                        </select>
                      </Field>
                      <Field label="Valor do Contrato (R$)" required error={errors['dadosCivil.valor_contrato']}>
                        <input type="number" min="0" className={ic('dadosCivil.valor_contrato')} value={form.dadosCivil?.valor_contrato ?? ''} onChange={(e) => set('dadosCivil.valor_contrato', e.target.value ? parseFloat(e.target.value) : undefined)} />
                      </Field>
                    </>
                  )}

                  {form.dadosCivil?.subtipo === 'imoveis' && (
                    <>
                      <Field label="Tipo de Imóvel" required error={errors['dadosCivil.tipo_imovel']}>
                        <select className={ic('dadosCivil.tipo_imovel')} value={form.dadosCivil?.tipo_imovel || ''} onChange={(e) => set('dadosCivil.tipo_imovel', e.target.value)}>
                          <option value="">Selecione</option>
                          <option value="residencial">Residencial</option>
                          <option value="comercial">Comercial</option>
                          <option value="industrial">Industrial</option>
                          <option value="terreno">Terreno</option>
                        </select>
                      </Field>
                      <Field label="Valor do Imóvel (R$)">
                        <input type="number" min="0" className={inputCls} value={form.dadosCivil?.valor_imovel ?? ''} onChange={(e) => set('dadosCivil.valor_imovel', e.target.value ? parseFloat(e.target.value) : undefined)} />
                      </Field>
                      <Field label="Endereço do Imóvel" required error={errors['dadosCivil.endereco_imovel']} colSpan={2}>
                        <input className={ic('dadosCivil.endereco_imovel')} value={form.dadosCivil?.endereco_imovel || ''} onChange={(e) => set('dadosCivil.endereco_imovel', e.target.value)} placeholder="Endereço completo" />
                      </Field>
                    </>
                  )}

                  {form.dadosCivil?.subtipo === 'consumidor' && (
                    <>
                      <Field label="Tipo de Demanda" required error={errors['dadosCivil.tipo_consumidor']}>
                        <select className={ic('dadosCivil.tipo_consumidor')} value={form.dadosCivil?.tipo_consumidor || ''} onChange={(e) => set('dadosCivil.tipo_consumidor', e.target.value)}>
                          <option value="">Selecione</option>
                          <option value="produto_defeituoso">Produto Defeituoso</option>
                          <option value="servico_inadequado">Serviço Inadequado</option>
                          <option value="cobranca_indevida">Cobrança Indevida</option>
                          <option value="outro">Outro</option>
                        </select>
                      </Field>
                      <Field label="Valor Reclamado (R$)" required error={errors['dadosCivil.valor_reclamado']}>
                        <input type="number" min="0" className={ic('dadosCivil.valor_reclamado')} value={form.dadosCivil?.valor_reclamado ?? ''} onChange={(e) => set('dadosCivil.valor_reclamado', e.target.value ? parseFloat(e.target.value) : undefined)} />
                      </Field>
                    </>
                  )}

                  {form.dadosCivil?.subtipo === 'sucessoes' && (
                    <>
                      <Field label="Tipo de Sucessão" required error={errors['dadosCivil.tipo_sucessao']}>
                        <select className={ic('dadosCivil.tipo_sucessao')} value={form.dadosCivil?.tipo_sucessao || ''} onChange={(e) => set('dadosCivil.tipo_sucessao', e.target.value)}>
                          <option value="">Selecione</option>
                          <option value="inventario">Inventário</option>
                          <option value="partilha">Partilha</option>
                          <option value="testamento">Testamento</option>
                          <option value="outro">Outro</option>
                        </select>
                      </Field>
                      <Field label="Valor do Monte-Mor (R$)" required error={errors['dadosCivil.valor_monte_mor']}>
                        <input type="number" min="0" className={ic('dadosCivil.valor_monte_mor')} value={form.dadosCivil?.valor_monte_mor ?? ''} onChange={(e) => set('dadosCivil.valor_monte_mor', e.target.value ? parseFloat(e.target.value) : undefined)} />
                      </Field>
                    </>
                  )}
                </>
              )}

              {selectedArea === 'previdenciario' && (
                <>
                  <h3 className={sectionTitle}>Dados Previdenciário</h3>
                  <Field label="Qualidade do Segurado" required error={errors['dadosPrevidenciario.polo_previdenciario']}>
                    <select className={ic('dadosPrevidenciario.polo_previdenciario')} value={form.dadosPrevidenciario?.polo_previdenciario || ''} onChange={(e) => set('dadosPrevidenciario.polo_previdenciario', e.target.value)}>
                      <option value="">Selecione</option>
                      <option value="segurado">Segurado</option>
                      <option value="dependente">Dependente</option>
                    </select>
                  </Field>
                  <Field label="Espécie do Benefício" required error={errors['dadosPrevidenciario.especie_beneficio']}>
                    <select className={ic('dadosPrevidenciario.especie_beneficio')} value={form.dadosPrevidenciario?.especie_beneficio || ''} onChange={(e) => set('dadosPrevidenciario.especie_beneficio', e.target.value)}>
                      <option value="">Selecione</option>
                      <option value="aposentadoria_idade">Aposentadoria por Idade</option>
                      <option value="aposentadoria_tempo">Aposentadoria por Tempo</option>
                      <option value="aposentadoria_invalidez">Aposentadoria por Invalidez</option>
                      <option value="auxilio_doenca">Auxílio-Doença</option>
                      <option value="auxilio_acidente">Auxílio-Acidente</option>
                      <option value="pensao_morte">Pensão por Morte</option>
                      <option value="bpc_loas">BPC/LOAS</option>
                      <option value="outro">Outro</option>
                    </select>
                  </Field>
                  <Field label="NIT / PIS / PASEP" required error={errors['dadosPrevidenciario.nit']}>
                    <input className={ic('dadosPrevidenciario.nit')} value={form.dadosPrevidenciario?.nit || ''} onChange={(e) => set('dadosPrevidenciario.nit', e.target.value)} placeholder="Ex: 12345678901" />
                  </Field>
                  <Field label="Data de Filiação" required error={errors['dadosPrevidenciario.data_filiacao']}>
                    <input type="date" className={ic('dadosPrevidenciario.data_filiacao')} value={form.dadosPrevidenciario?.data_filiacao || ''} onChange={(e) => set('dadosPrevidenciario.data_filiacao', e.target.value)} />
                  </Field>
                  <Field label="Fase Processual" required error={errors['dadosPrevidenciario.fase_processual']} colSpan={2}>
                    <select className={ic('dadosPrevidenciario.fase_processual')} value={form.dadosPrevidenciario?.fase_processual || ''} onChange={(e) => set('dadosPrevidenciario.fase_processual', e.target.value)}>
                      <option value="">Selecione</option>
                      <option value="administrativo">Administrativo (INSS)</option>
                      <option value="judicial">Judicial</option>
                      <option value="recurso">Recurso</option>
                    </select>
                  </Field>

                  {form.dadosPrevidenciario?.especie_beneficio === 'aposentadoria_idade' && (
                    <>
                      <Field label="Data de Nascimento" required error={errors['dadosPrevidenciario.data_nascimento']}>
                        <input type="date" className={ic('dadosPrevidenciario.data_nascimento')} value={form.dadosPrevidenciario?.data_nascimento || ''} onChange={(e) => set('dadosPrevidenciario.data_nascimento', e.target.value)} />
                      </Field>
                      <Field label="Tempo de Contribuição (meses)" required error={errors['dadosPrevidenciario.tempo_contribuicao_meses']}>
                        <input type="number" min="0" className={ic('dadosPrevidenciario.tempo_contribuicao_meses')} value={form.dadosPrevidenciario?.tempo_contribuicao_meses ?? ''} onChange={(e) => set('dadosPrevidenciario.tempo_contribuicao_meses', e.target.value ? parseInt(e.target.value) : undefined)} />
                      </Field>
                    </>
                  )}

                  {form.dadosPrevidenciario?.especie_beneficio === 'aposentadoria_tempo' && (
                    <>
                      <Field label="Tempo de Contribuição (meses)" required error={errors['dadosPrevidenciario.tempo_contribuicao_meses']}>
                        <input type="number" min="0" className={ic('dadosPrevidenciario.tempo_contribuicao_meses')} value={form.dadosPrevidenciario?.tempo_contribuicao_meses ?? ''} onChange={(e) => set('dadosPrevidenciario.tempo_contribuicao_meses', e.target.value ? parseInt(e.target.value) : undefined)} />
                      </Field>
                      <Field label="Data do Último Recolhimento" required error={errors['dadosPrevidenciario.data_ultimo_recolhimento']}>
                        <input type="date" className={ic('dadosPrevidenciario.data_ultimo_recolhimento')} value={form.dadosPrevidenciario?.data_ultimo_recolhimento || ''} onChange={(e) => set('dadosPrevidenciario.data_ultimo_recolhimento', e.target.value)} />
                      </Field>
                    </>
                  )}

                  {(form.dadosPrevidenciario?.especie_beneficio === 'aposentadoria_invalidez' || form.dadosPrevidenciario?.especie_beneficio === 'auxilio_doenca') && (
                    <>
                      {form.dadosPrevidenciario?.especie_beneficio === 'aposentadoria_invalidez' ? (
                        <Field label="Data da Incapacidade" required error={errors['dadosPrevidenciario.data_incapacidade']}>
                          <input type="date" className={ic('dadosPrevidenciario.data_incapacidade')} value={form.dadosPrevidenciario?.data_incapacidade || ''} onChange={(e) => set('dadosPrevidenciario.data_incapacidade', e.target.value)} />
                        </Field>
                      ) : (
                        <Field label="Data de Início do Afastamento" required error={errors['dadosPrevidenciario.data_inicio_afastamento']}>
                          <input type="date" className={ic('dadosPrevidenciario.data_inicio_afastamento')} value={form.dadosPrevidenciario?.data_inicio_afastamento || ''} onChange={(e) => set('dadosPrevidenciario.data_inicio_afastamento', e.target.value)} />
                        </Field>
                      )}
                      <Field label="Laudo Médico" required error={errors['dadosPrevidenciario.laudo_medico']}>
                        <input type="file" accept=".pdf,.jpg,.png" className={ic('dadosPrevidenciario.laudo_medico')} onChange={(e) => set('dadosPrevidenciario.laudo_medico', e.target.files?.[0]?.name || '')} />
                        <p className="text-[10px] text-muted-foreground mt-1">PDF, JPG, PNG (Máx 5MB)</p>
                      </Field>
                    </>
                  )}

                  {form.dadosPrevidenciario?.especie_beneficio === 'auxilio_acidente' && (
                    <Field label="Data do Acidente" required error={errors['dadosPrevidenciario.data_acidente']}>
                      <input type="date" className={ic('dadosPrevidenciario.data_acidente')} value={form.dadosPrevidenciario?.data_acidente || ''} onChange={(e) => set('dadosPrevidenciario.data_acidente', e.target.value)} />
                    </Field>
                  )}

                  {form.dadosPrevidenciario?.especie_beneficio === 'pensao_morte' && (
                    <>
                      <Field label="Data do Óbito" required error={errors['dadosPrevidenciario.data_obito']}>
                        <input type="date" className={ic('dadosPrevidenciario.data_obito')} value={form.dadosPrevidenciario?.data_obito || ''} onChange={(e) => set('dadosPrevidenciario.data_obito', e.target.value)} />
                      </Field>
                      <Field label="Grau de Parentesco" required error={errors['dadosPrevidenciario.grau_parentesco']}>
                        <select className={ic('dadosPrevidenciario.grau_parentesco')} value={form.dadosPrevidenciario?.grau_parentesco || ''} onChange={(e) => set('dadosPrevidenciario.grau_parentesco', e.target.value)}>
                          <option value="">Selecione</option>
                          <option value="conjuge">Cônjuge</option>
                          <option value="filho">Filho</option>
                          <option value="pai">Pai</option>
                          <option value="mae">Mãe</option>
                          <option value="irmaos">Irmãos</option>
                          <option value="outro">Outro</option>
                        </select>
                      </Field>
                    </>
                  )}

                  {form.dadosPrevidenciario?.especie_beneficio === 'bpc_loas' && (
                    <>
                      <Field label="Renda Familiar Mensal (R$)" required error={errors['dadosPrevidenciario.renda_familiar']}>
                        <input type="number" min="0" className={ic('dadosPrevidenciario.renda_familiar')} value={form.dadosPrevidenciario?.renda_familiar ?? ''} onChange={(e) => set('dadosPrevidenciario.renda_familiar', e.target.value ? parseFloat(e.target.value) : undefined)} />
                      </Field>
                      <Field label="Número de Dependentes" required error={errors['dadosPrevidenciario.numero_dependentes']}>
                        <input type="number" min="0" className={ic('dadosPrevidenciario.numero_dependentes')} value={form.dadosPrevidenciario?.numero_dependentes ?? ''} onChange={(e) => set('dadosPrevidenciario.numero_dependentes', e.target.value ? parseInt(e.target.value) : undefined)} />
                      </Field>
                      <Field label="Deficiência Comprovada" required error={errors['dadosPrevidenciario.deficiencia_comprovada']} colSpan={2}>
                        <label className="flex items-center gap-3 cursor-pointer mt-2">
                          <button
                            type="button"
                            role="switch"
                            aria-checked={form.dadosPrevidenciario?.deficiencia_comprovada || false}
                            onClick={() => set('dadosPrevidenciario.deficiencia_comprovada', !form.dadosPrevidenciario?.deficiencia_comprovada)}
                            className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors ${
                              form.dadosPrevidenciario?.deficiencia_comprovada ? 'bg-primary' : 'bg-secondary'
                            }`}
                          >
                            <span className={`inline-block h-4 w-4 rounded-full bg-card shadow transform transition-transform mt-0.5 ${form.dadosPrevidenciario?.deficiencia_comprovada ? 'translate-x-4 ml-0.5' : 'translate-x-0.5'}`} />
                          </button>
                        </label>
                      </Field>
                    </>
                  )}
                </>
              )}

              {selectedArea === 'tributario' && (
                <>
                  <h3 className={sectionTitle}>Dados Tributário</h3>
                  <Field label="Polo no Processo" required error={errors['dadosTributario.polo_tributario']}>
                    <select className={ic('dadosTributario.polo_tributario')} value={form.dadosTributario?.polo_tributario || ''} onChange={(e) => set('dadosTributario.polo_tributario', e.target.value)}>
                      <option value="">Selecione</option>
                      <option value="contribuinte">Contribuinte</option>
                      <option value="representante">Representante</option>
                      <option value="procurador">Procurador</option>
                    </select>
                  </Field>
                  <Field label="Tipo de Tributo" required error={errors['dadosTributario.tipo_tributo']}>
                    <select className={ic('dadosTributario.tipo_tributo')} value={form.dadosTributario?.tipo_tributo || ''} onChange={(e) => set('dadosTributario.tipo_tributo', e.target.value)}>
                      <option value="">Selecione</option>
                      <option value="irpf">IRPF</option>
                      <option value="irpj">IRPJ</option>
                      <option value="icms">ICMS</option>
                      <option value="ipi">IPI</option>
                      <option value="pis">PIS</option>
                      <option value="cofins">COFINS</option>
                      <option value="inss">INSS</option>
                      <option value="outro">Outro</option>
                    </select>
                  </Field>
                  <Field label="Fase Processual" required error={errors['dadosTributario.fase_processual']}>
                    <select className={ic('dadosTributario.fase_processual')} value={form.dadosTributario?.fase_processual || ''} onChange={(e) => set('dadosTributario.fase_processual', e.target.value)}>
                      <option value="">Selecione</option>
                      <option value="administrativo">Administrativo</option>
                      <option value="judicial">Judicial</option>
                      <option value="recurso">Recurso</option>
                    </select>
                  </Field>
                  <Field label="Órgão Fiscalizador" required error={errors['dadosTributario.orgao_fiscalizador']}>
                    <select className={ic('dadosTributario.orgao_fiscalizador')} value={form.dadosTributario?.orgao_fiscalizador || ''} onChange={(e) => set('dadosTributario.orgao_fiscalizador', e.target.value)}>
                      <option value="">Selecione</option>
                      <option value="receita_federal">Receita Federal</option>
                      <option value="sefaz">SEFAZ</option>
                      <option value="prefeitura">Prefeitura</option>
                      <option value="inss">INSS</option>
                      <option value="outro">Outro</option>
                    </select>
                  </Field>

                  {selectedType === 'pj' && (
                    <Field label="Regime Tributário" required error={errors['dadosTributario.regime_tributario']} colSpan={2}>
                      <select className={ic('dadosTributario.regime_tributario')} value={form.dadosTributario?.regime_tributario || ''} onChange={(e) => set('dadosTributario.regime_tributario', e.target.value)}>
                        <option value="">Selecione</option>
                        <option value="simples_nacional">Simples Nacional</option>
                        <option value="lucro_presumido">Lucro Presumido</option>
                        <option value="lucro_real">Lucro Real</option>
                        <option value="mei">MEI</option>
                      </select>
                    </Field>
                  )}

                  <Field label="Valor do Tributo (R$)">
                    <input type="number" min="0" className={inputCls} value={form.dadosTributario?.valor_tributo ?? ''} onChange={(e) => set('dadosTributario.valor_tributo', e.target.value ? parseFloat(e.target.value) : undefined)} placeholder="0.00" />
                  </Field>
                  <Field label="Número do Auto de Infração">
                    <input className={inputCls} value={form.dadosTributario?.numero_auto_infracao || ''} onChange={(e) => set('dadosTributario.numero_auto_infracao', e.target.value)} placeholder="Número do auto de infração" />
                  </Field>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border px-6 py-4 flex items-center justify-between bg-card shrink-0">
          <div>
            {step === 2 && (
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-1 text-sm text-secondary-foreground hover:text-foreground transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Voltar
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="text-sm text-secondary-foreground hover:text-foreground transition-colors">
              Cancelar
            </button>
            {step === 1 ? (
              <button
                onClick={handleNext}
                disabled={!selectedType || !selectedArea}
                className="flex items-center gap-1 bg-primary text-white text-sm font-medium rounded-md px-6 py-2 hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continuar
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSave}
                className="bg-primary text-white text-sm font-medium rounded-md px-6 py-2 hover:bg-primary/90 transition-colors"
              >
                Salvar Cliente
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
