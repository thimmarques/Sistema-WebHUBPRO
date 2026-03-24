// ✅ NOVO: Tipo para validação de força de senha
export interface PasswordStrength {
  score: number; // 0-4
  feedback: string[];
  isStrong: boolean;
}

// ✅ NOVO: Tipo para mudança de senha
export interface PasswordChange {
  userId: string;
  changedAt: string;
  ipAddress?: string;
  userAgent?: string;
}

// ✅ NOVO: Validação de requisitos de senha
export const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
};
