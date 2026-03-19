import React from 'react';
import { BadgeVariant } from '@/types';

const variantStyles: Record<BadgeVariant, string> = {
  // Practice areas
  trabalhista: 'bg-badge-trabalhista text-badge-trabalhista-foreground',
  civil: 'bg-badge-civil text-badge-civil-foreground',
  criminal: 'bg-badge-criminal text-badge-criminal-foreground',
  previdenciario: 'bg-badge-previdenciario text-badge-previdenciario-foreground',
  tributario: 'bg-badge-tributario text-badge-tributario-foreground',
  // Statuses
  ativo: 'bg-badge-ativo text-badge-ativo-foreground',
  audiencia: 'bg-badge-audiencia text-badge-audiencia-foreground',
  pendente: 'bg-badge-pendente text-badge-pendente-foreground',
  encerrado: 'bg-badge-encerrado text-badge-encerrado-foreground',
  recurso: 'bg-badge-recurso text-badge-recurso-foreground',
  // Roles
  admin: 'bg-primary/20 text-primary',
  advogado: 'bg-emerald-100 text-emerald-800',
  assistente: 'bg-amber-100 text-amber-800',
  estagiario: 'bg-muted/80 text-foreground/80',
  // Special
  vip: 'bg-amber-100 text-amber-800',
};

const variantLabels: Partial<Record<BadgeVariant, string>> = {
  trabalhista: 'Trabalhista',
  civil: 'Civil',
  criminal: 'Criminal',
  previdenciario: 'Previdenciário',
  tributario: 'Tributário',
  ativo: 'Ativo',
  audiencia: 'Audiência',
  pendente: 'Pendente',
  encerrado: 'Encerrado',
  recurso: 'Recurso',
  admin: 'Admin',
  advogado: 'Advogado',
  assistente: 'Assistente',
  estagiario: 'Estagiário',
  vip: 'VIP',
};

interface StatusBadgeProps {
  variant: BadgeVariant;
  label?: string;
}

export default function StatusBadge({ variant, label }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variantStyles[variant]}`}
    >
      {label || variantLabels[variant] || variant}
    </span>
  );
}
