import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// ==========================================
// TYPES
// ==========================================

interface User {
  id: string;
  email: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  games_played: number;
  games_won: number;
  rounds_played: number;
  rounds_won: number;
  total_kills: number;
  total_deaths: number;
  elo_rating: number;
  rank: string;
  total_xp: number;
  is_admin: boolean;
  active_title_id: string | null;
  // New ranking system
  tier: string;
  division: number | null;
  lp: number;
}

const TOKEN_KEY = 'bangshot_auth_token';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  authError: string | null;
  login: () => void;
  logout: () => void;
  clearAuthError: () => void;
}

// ==========================================
// CONTEXT
// ==========================================

const AuthContext = createContext<AuthContextType | null>(null);

// ==========================================
// PROVIDER
// ==========================================

interface AuthProviderProps {
  children: ReactNode;
}

function getAuthErrorMessage(errorCode: string): string {
  const messages: Record<string, string> = {
    auth_failed: 'Falha na autenticacao com Google. Tente novamente.',
    no_user: 'Nao foi possivel obter dados do usuario.',
    session_failed: 'Erro ao criar sessao. Tente novamente.',
  };
  return messages[errorCode] || 'Erro de autenticacao. Tente novamente.';
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Verificar autenticação ao carregar
  useEffect(() => {
    // Check for token in URL (after Google OAuth callback)
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get('token');
    const errorFromUrl = urlParams.get('error');

    if (tokenFromUrl) {
      localStorage.setItem(TOKEN_KEY, tokenFromUrl);
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    if (errorFromUrl) {
      setAuthError(getAuthErrorMessage(errorFromUrl));
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    checkAuth();
  }, []);

  const getToken = (): string | null => {
    return localStorage.getItem(TOKEN_KEY);
  };

  const checkAuth = async () => {
    const token = getToken();
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        // Token invalid, remove it
        localStorage.removeItem(TOKEN_KEY);
      }
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = () => {
    // Redirecionar para Google OAuth
    window.location.href = '/api/auth/google';
  };

  const logout = async () => {
    const token = getToken();
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    } finally {
      localStorage.removeItem(TOKEN_KEY);
      setUser(null);
    }
  };

  const clearAuthError = () => setAuthError(null);

  const value: AuthContextType = {
    user,
    token: getToken(),
    isAuthenticated: !!user,
    isAdmin: user?.is_admin ?? false,
    isLoading,
    authError,
    login,
    logout,
    clearAuthError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ==========================================
// HOOK
// ==========================================

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
}
