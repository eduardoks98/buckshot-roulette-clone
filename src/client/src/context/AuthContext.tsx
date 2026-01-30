import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

// ==========================================
// TYPES
// ==========================================

export type OAuthProvider = 'google' | 'facebook' | 'discord';

interface GameUser {
  id: string;
  sub?: string;
  email: string;
  username: string;
  display_name: string;
  nickname?: string;
  avatar_url: string | null;
  elo_rating: number;
  rank: string;
  is_admin: boolean;
}

interface User extends GameUser {
  games_played: number;
  games_won: number;
  rounds_played: number;
  rounds_won: number;
  total_kills: number;
  total_deaths: number;
  total_xp: number;
  active_title_id: string | null;
  tier: string;
  division: number | null;
  lp: number;
  providers?: OAuthProvider[];
}

export interface AvailableProvider {
  id: OAuthProvider;
  name: string;
  icon: string;
}

// ==========================================
// CONSTANTS
// ==========================================

const TOKEN_KEY = 'bangshot_auth_token';
const COOKIE_NAME = 'mysys_token';
const AUTH_URL = import.meta.env.VITE_AUTH_URL || 'https://mysys.shop';
const GAME_CODE = import.meta.env.VITE_GAME_CODE || 'BANGSHOT';
const SYNC_CHANNEL = 'mysys_auth_sync';

// Reverb WebSocket config
const REVERB_KEY = import.meta.env.VITE_REVERB_APP_KEY || '';
const REVERB_HOST = import.meta.env.VITE_REVERB_HOST || 'admin.mysys.shop';
const REVERB_PORT = import.meta.env.VITE_REVERB_PORT || '8080';

// ==========================================
// HELPERS
// ==========================================

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? match[2] : null;
}

function deleteCookie(name: string): void {
  // Try with domain
  const hostname = window.location.hostname;
  const parts = hostname.split('.');
  const baseDomain = parts.length > 2 ? '.' + parts.slice(-2).join('.') : hostname;

  document.cookie = `${name}=; domain=${baseDomain}; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

function decodeJWT(token: string): GameUser | null {
  try {
    const payload = token.split('.')[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

function isTokenExpired(token: string): boolean {
  const payload = decodeJWT(token);
  if (!payload || !(payload as any).exp) return true;
  return (payload as any).exp * 1000 < Date.now();
}

// ==========================================
// CONTEXT TYPES
// ==========================================

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

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [availableProviders] = useState<AvailableProvider[]>([
    { id: 'google', name: 'Google', icon: 'google' },
    { id: 'discord', name: 'Discord', icon: 'discord' },
    { id: 'facebook', name: 'Facebook', icon: 'facebook' },
  ]);

  // Fetch full user data from local server
  const fetchFullUserData = useCallback(async (authToken: string): Promise<User | null> => {
    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        return data.user;
      }
    } catch (error) {
      console.error('[Auth] Error fetching full user data:', error);
    }
    return null;
  }, []);

  // Handle user login from token
  const handleUserLogin = useCallback(async (authToken: string) => {
    const jwtUser = decodeJWT(authToken);
    if (!jwtUser) {
      setUser(null);
      setToken(null);
      localStorage.removeItem(TOKEN_KEY);
      return;
    }

    // Store token
    localStorage.setItem(TOKEN_KEY, authToken);
    setToken(authToken);

    // Try to get full user data from local server
    const fullUser = await fetchFullUserData(authToken);

    if (fullUser) {
      setUser(fullUser);
    } else {
      // Use JWT data as fallback with defaults
      const userId = jwtUser.sub || jwtUser.id;
      setUser({
        ...jwtUser,
        id: userId,
        games_played: 0,
        games_won: 0,
        rounds_played: 0,
        rounds_won: 0,
        total_kills: 0,
        total_deaths: 0,
        total_xp: 0,
        active_title_id: null,
        tier: 'BRONZE',
        division: 4,
        lp: 0,
      });
    }
  }, [fetchFullUserData]);

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      // Check for token in URL (after OAuth redirect)
      const urlParams = new URLSearchParams(window.location.search);
      const tokenFromUrl = urlParams.get('token');
      const errorFromUrl = urlParams.get('error');

      if (tokenFromUrl) {
        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname);
        await handleUserLogin(tokenFromUrl);

        // Broadcast to other tabs
        try {
          new BroadcastChannel(SYNC_CHANNEL).postMessage({ type: 'LOGIN' });
        } catch (e) { /* BroadcastChannel not supported */ }

        setIsLoading(false);
        return;
      }

      if (errorFromUrl) {
        setAuthError(errorFromUrl);
        window.history.replaceState({}, document.title, window.location.pathname);
      }

      // Check cookie
      const cookieToken = getCookie(COOKIE_NAME);
      if (cookieToken && !isTokenExpired(cookieToken)) {
        await handleUserLogin(cookieToken);
        setIsLoading(false);
        return;
      }

      // Check localStorage (fallback)
      const storedToken = localStorage.getItem(TOKEN_KEY);
      if (storedToken && !isTokenExpired(storedToken)) {
        await handleUserLogin(storedToken);
        setIsLoading(false);
        return;
      }

      // No valid token
      setIsLoading(false);
    };

    initAuth();
  }, [handleUserLogin]);

  // Tab sync via BroadcastChannel
  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return;

    const channel = new BroadcastChannel(SYNC_CHANNEL);

    channel.onmessage = (event) => {
      if (event.data.type === 'LOGIN' || event.data.type === 'LOGOUT') {
        window.location.reload();
      }
    };

    return () => channel.close();
  }, []);

  // Reverb WebSocket sync
  useEffect(() => {
    if (!user?.id || !REVERB_KEY) return;

    // Pusher loaded from CDN in index.html
    const Pusher = (window as any).Pusher;
    if (!Pusher) {
      console.warn('[Reverb] Pusher not loaded from CDN');
      return;
    }

    let pusher: any = null;
    let channel: any = null;

    try {
      pusher = new Pusher(REVERB_KEY, {
        cluster: 'mt1', // Required by Pusher.js, ignored by Reverb
        wsHost: REVERB_HOST,
        wsPort: parseInt(REVERB_PORT),
        wssPort: parseInt(REVERB_PORT),
        forceTLS: true,
        disableStats: true,
        enabledTransports: ['ws', 'wss'],
      });

      channel = pusher.subscribe('auth.user.' + user.id);
      channel.bind('auth.sync', (data: { type: string }) => {
        console.log('[Reverb] Auth sync event:', data);
        if (data.type === 'LOGIN' || data.type === 'LOGOUT') {
          // Broadcast to other tabs
          try {
            new BroadcastChannel(SYNC_CHANNEL).postMessage({ type: data.type });
          } catch (e) { /* ignore */ }
          window.location.reload();
        }
      });

      console.log('[Reverb] Connected to channel: auth.user.' + user.id);
    } catch (error) {
      console.error('[Reverb] Connection error:', error);
    }

    return () => {
      if (channel) {
        try { channel.unbind_all(); } catch (e) { /* ignore */ }
      }
      if (pusher) {
        try { pusher.disconnect(); } catch (e) { /* ignore */ }
      }
    };
  }, [user?.id]);

  // Redirect to MySys login page
  const login = useCallback(() => {
    const returnUrl = encodeURIComponent(window.location.href);
    window.location.href = `${AUTH_URL}/login?source=${GAME_CODE}&return_url=${returnUrl}`;
  }, []);

  // Logout
  const logout = useCallback(async () => {
    const currentToken = token || localStorage.getItem(TOKEN_KEY);

    // Logout from local server
    if (currentToken) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${currentToken}` },
        });
      } catch (error) {
        console.error('[Auth] Local logout error:', error);
      }
    }

    // Clear state
    localStorage.removeItem(TOKEN_KEY);
    deleteCookie(COOKIE_NAME);
    setUser(null);
    setToken(null);

    // Broadcast to other tabs
    try {
      new BroadcastChannel(SYNC_CHANNEL).postMessage({ type: 'LOGOUT' });
    } catch (e) { /* BroadcastChannel not supported */ }
  }, [token]);

  const clearAuthError = useCallback(() => setAuthError(null), []);

  const value: AuthContextType = {
    user,
    token,
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
