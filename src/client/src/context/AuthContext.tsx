import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

// ==========================================
// TYPES
// ==========================================

export type OAuthProvider = 'google' | 'facebook' | 'discord';

interface User {
  id: string;
  game_user_id?: string;
  email: string;
  username: string;
  display_name: string;
  nickname?: string;
  avatar_url: string | null;
  elo_rating: number;
  rank: string;
  is_admin: boolean;
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

const AUTH_URL = import.meta.env.VITE_AUTH_URL || 'https://mysys.shop';
const GAME_CODE = import.meta.env.VITE_GAME_CODE || 'BANGSHOT';
const SYNC_CHANNEL = 'mysys_auth_sync';

// Reverb WebSocket config
const REVERB_KEY = import.meta.env.VITE_REVERB_APP_KEY || '';
const REVERB_HOST = import.meta.env.VITE_REVERB_HOST || 'admin.mysys.shop';
const REVERB_PORT = import.meta.env.VITE_REVERB_PORT || '8080';
const REVERB_FORCE_TLS = import.meta.env.VITE_REVERB_FORCE_TLS === 'true';

// ==========================================
// CONTEXT TYPES
// ==========================================

interface AuthContextType {
  user: User | null;
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
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [availableProviders] = useState<AvailableProvider[]>([
    { id: 'google', name: 'Google', icon: 'google' },
    { id: 'discord', name: 'Discord', icon: 'discord' },
    { id: 'facebook', name: 'Facebook', icon: 'facebook' },
  ]);

  // Fetch user data from backend (cookie is sent automatically)
  const fetchUser = useCallback(async (): Promise<User | null> => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include', // Sends httpOnly cookie automatically
      });

      if (response.ok) {
        const data = await response.json();
        return data.user;
      }
      return null;
    } catch (error) {
      console.error('[Auth] Error fetching user:', error);
      return null;
    }
  }, []);

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      // Check for error in URL (OAuth failure)
      const urlParams = new URLSearchParams(window.location.search);
      const errorFromUrl = urlParams.get('error');

      if (errorFromUrl) {
        setAuthError(errorFromUrl);
        window.history.replaceState({}, document.title, window.location.pathname);
      }

      // Fetch user from backend - cookie is sent automatically
      const userData = await fetchUser();
      setUser(userData);
      setIsLoading(false);
    };

    initAuth();
  }, [fetchUser]);

  // Tab sync via BroadcastChannel
  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return;

    const channel = new BroadcastChannel(SYNC_CHANNEL);

    channel.onmessage = (event) => {
      if (event.data.type === 'LOGOUT') {
        console.log('[BroadcastChannel] Logout event - reloading');
        window.location.reload();
      } else if (event.data.type === 'LOGIN') {
        // Reload to get updated auth state
        if (!user) {
          console.log('[BroadcastChannel] Login event - reloading');
          window.location.reload();
        }
      }
    };

    return () => channel.close();
  }, [user]);

  // Reverb WebSocket sync for cross-domain logout
  useEffect(() => {
    if (!user?.id || !REVERB_KEY) return;

    const Pusher = (window as any).Pusher;
    if (!Pusher) {
      console.warn('[Reverb] Pusher not loaded from CDN');
      return;
    }

    let pusher: any = null;
    let channel: any = null;

    try {
      pusher = new Pusher(REVERB_KEY, {
        cluster: 'mt1',
        wsHost: REVERB_HOST,
        wsPort: parseInt(REVERB_PORT),
        wssPort: parseInt(REVERB_PORT),
        forceTLS: REVERB_FORCE_TLS,
        disableStats: true,
        enabledTransports: REVERB_FORCE_TLS ? ['wss'] : ['ws'],
      });

      const channelId = user.game_user_id || user.id;
      channel = pusher.subscribe('auth.user.' + channelId);
      channel.bind('auth.sync', (data: { type: string }) => {
        console.log('[Reverb] Auth sync event:', data);
        if (data.type === 'LOGOUT') {
          try {
            new BroadcastChannel(SYNC_CHANNEL).postMessage({ type: 'LOGOUT' });
          } catch (e) { /* ignore */ }
          window.location.reload();
        } else if (data.type === 'LOGIN') {
          try {
            new BroadcastChannel(SYNC_CHANNEL).postMessage({ type: 'LOGIN' });
          } catch (e) { /* ignore */ }
          window.location.reload();
        }
      });

      console.log('[Reverb] Connected to channel: auth.user.' + channelId);
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
  }, [user?.id, user?.game_user_id]);

  // Redirect to MySys login page
  const login = useCallback(() => {
    const callbackUrl = `${window.location.origin}/lobby`;
    const returnUrl = encodeURIComponent(callbackUrl);
    window.location.href = `${AUTH_URL}/login?source=${GAME_CODE}&return_url=${returnUrl}`;
  }, []);

  // Logout
  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include', // Send cookie
      });
    } catch (error) {
      console.error('[Auth] Logout error:', error);
    }

    setUser(null);

    // Broadcast to other tabs
    try {
      new BroadcastChannel(SYNC_CHANNEL).postMessage({ type: 'LOGOUT' });
    } catch (e) { /* BroadcastChannel not supported */ }
  }, []);

  const clearAuthError = useCallback(() => setAuthError(null), []);

  const value: AuthContextType = {
    user,
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
