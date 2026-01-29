import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { initiateOAuthLogin } from '../services/oauth.service';

// ==========================================
// TYPES
// ==========================================

export type OAuthProvider = 'google' | 'facebook' | 'discord';

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
  // OAuth providers
  providers?: OAuthProvider[];
}

export interface AvailableProvider {
  id: OAuthProvider;
  name: string;
  icon: string;
}

const TOKEN_KEY = 'bangshot_auth_token';
const ADMIN_API_URL = import.meta.env.VITE_ADMIN_API_URL || 'https://admin.mysys.shop';
const GAME_CODE = import.meta.env.VITE_GAME_CODE || 'BANGSHOT';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  authError: string | null;
  availableProviders: AvailableProvider[];
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
    auth_failed: 'Falha na autenticacao. Tente novamente.',
    no_user: 'Nao foi possivel obter dados do usuario.',
    session_failed: 'Erro ao criar sessao. Tente novamente.',
    invalid_state: 'Estado invalido. Tente novamente.',
    game_not_found: 'Jogo nao encontrado.',
    no_authorization_code: 'Codigo de autorizacao nao recebido.',
  };
  return messages[errorCode] || errorCode || 'Erro de autenticacao. Tente novamente.';
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [availableProviders, setAvailableProviders] = useState<AvailableProvider[]>([]);

  // Fetch available providers on mount
  useEffect(() => {
    fetchAvailableProviders();
  }, []);

  // Check authentication on load
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get('token');
    const errorFromUrl = urlParams.get('error');
    const ssoHint = urlParams.get('sso');

    // Handle legacy token in URL (for backwards compatibility)
    if (tokenFromUrl) {
      localStorage.setItem(TOKEN_KEY, tokenFromUrl);
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    if (errorFromUrl) {
      setAuthError(getAuthErrorMessage(errorFromUrl));
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    // Check if we have a local token
    const existingToken = localStorage.getItem(TOKEN_KEY);

    // SSO hint from Portal - user is logged in there, auto-initiate OAuth
    if (ssoHint === '1' && !existingToken) {
      console.log('[Auth] SSO hint detected, initiating OAuth flow');
      // Clean URL first
      window.history.replaceState({}, document.title, window.location.pathname);
      // Initiate OAuth login
      initiateOAuthLogin();
      return;
    }

    checkAuth();
  }, []);

  const fetchAvailableProviders = async () => {
    try {
      const response = await fetch(`${ADMIN_API_URL}/api/games/${GAME_CODE}/auth/providers`);
      if (response.ok) {
        const data = await response.json();
        setAvailableProviders(data.providers || []);
      }
    } catch (error) {
      console.error('Erro ao buscar providers:', error);
      // Default to Google if fetch fails
      setAvailableProviders([{ id: 'google', name: 'Google', icon: 'google' }]);
    }
  };

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
      // Try local server first for more complete user data
      const localResponse = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (localResponse.ok) {
        const data = await localResponse.json();
        setUser(data.user);
      } else {
        // Fallback to Games Admin validation
        const adminResponse = await fetch(`${ADMIN_API_URL}/api/games/${GAME_CODE}/auth/validate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });

        if (adminResponse.ok) {
          const data = await adminResponse.json();
          if (data.valid && data.user) {
            setUser(data.user);
          } else {
            localStorage.removeItem(TOKEN_KEY);
          }
        } else {
          localStorage.removeItem(TOKEN_KEY);
        }
      }
    } catch (error) {
      console.error('Erro ao verificar autenticacao:', error);
      localStorage.removeItem(TOKEN_KEY);
    } finally {
      setIsLoading(false);
    }
  };

  const login = () => {
    // Use OAuth 2.0 + PKCE flow for secure authentication
    initiateOAuthLogin();
  };

  const logout = async () => {
    const token = getToken();
    try {
      // Logout from local server
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });

      // Also logout from Games Admin
      if (token) {
        await fetch(`${ADMIN_API_URL}/api/games/${GAME_CODE}/auth/logout`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
        }).catch(() => {});
      }
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
    availableProviders,
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
