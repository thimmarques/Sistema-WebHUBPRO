import { useAuth } from './useAuth';

export function usePermissions() {
  const { currentUser } = useAuth();
  
  const currentScope = currentUser?.role === 'admin' 
    ? 'all' 
    : currentUser?.role === 'advogado' 
    ? 'own' 
    : 'none';

  const canCreate = currentUser?.role !== 'estagiario';
  const canDelete = currentUser?.role === 'admin';
  const canEditAll = currentUser?.role === 'admin';
  const canViewAll = currentUser?.role === 'admin';

  return {
    currentScope,
    canCreate,
    canDelete,
    canEditAll,
    canViewAll,
    role: currentUser?.role || 'none',
  };
}
