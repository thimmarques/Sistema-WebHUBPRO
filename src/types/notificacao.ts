// ✅ NOVO: Tipo para preferências de notificações
export interface NotificacaoPreferencias {
  userId: string;
  emailEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;
  emailFrequencia: 'imediato' | 'diario' | 'semanal' | 'nunca';
  smsFrequencia: 'imediato' | 'diario' | 'semanal' | 'nunca';
  pushFrequencia: 'imediato' | 'diario' | 'semanal' | 'nunca';
  notificarPrazos: boolean;
  notificarAudiencias: boolean;
  notificarLancamentos: boolean;
  notificarMensagens: boolean;
  createdAt: string;
  updatedAt: string;
}

// ✅ NOVO: Tipo para atualização de preferências
export interface NotificacaoPreferenciasUpdate {
  emailEnabled?: boolean;
  smsEnabled?: boolean;
  pushEnabled?: boolean;
  emailFrequencia?: 'imediato' | 'diario' | 'semanal' | 'nunca';
  smsFrequencia?: 'imediato' | 'diario' | 'semanal' | 'nunca';
  pushFrequencia?: 'imediato' | 'diario' | 'semanal' | 'nunca';
  notificarPrazos?: boolean;
  notificarAudiencias?: boolean;
  notificarLancamentos?: boolean;
  notificarMensagens?: boolean;
}
