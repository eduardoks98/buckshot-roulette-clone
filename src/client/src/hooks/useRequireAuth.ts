// ==========================================
// USE REQUIRE AUTH - Redireciona se não autenticado
// ==========================================

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export interface UseRequireAuthOptions {
  /** Rota para redirecionar (default: '/') */
  redirectTo?: string;
}

/**
 * Hook para proteger páginas que requerem autenticação
 * Redireciona automaticamente para a rota especificada se não autenticado
 *
 * @example
 * function ProtectedPage() {
 *   useRequireAuth();
 *   // ... resto do componente
 * }
 */
export function useRequireAuth(options: UseRequireAuthOptions = {}) {
  const { redirectTo = '/' } = options;
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate(redirectTo);
    }
  }, [isLoading, isAuthenticated, navigate, redirectTo]);

  return { isAuthenticated, isLoading };
}

export default useRequireAuth;
