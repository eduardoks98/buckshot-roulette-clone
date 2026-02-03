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
  game_user_id?: string;
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
const REVERB_FORCE_TLS = import.meta.env.VITE_REVERB_FORCE_TLS === 'true';

// ==========================================
// DEBUG LOGGER
// ==========================================

const AUTH_LOG_KEY = 'bangshot_auth_log';

function authLog(message: string, data?: any): void {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${message}${data ? ' ' + JSON.stringify(data) : ''}`;

  // Console
  console.log(`[AuthDebug] ${message}`, data || '');

  // LocalStorage (keep last 50 entries)
  try {
    const logs = JSON.parse(localStorage.getItem(AUTH_LOG_KEY) || '[]');
    logs.push(logEntry);
    if (logs.length > 50) logs.shift();
    localStorage.setItem(AUTH_LOG_KEY, JSON.stringify(logs));
  } catch (e) { /* ignore */ }
}

// Expose function to read logs in console
(window as any).getAuthLogs = () => {
  const logs = JSON.parse(localStorage.getItem(AUTH_LOG_KEY) || '[]');
  console.log('=== AUTH LOGS ===');
  logs.forEach((log: string) => console.log(log));
  return logs;
};

(window as any).clearAuthLogs = () => {
  localStorage.removeItem(AUTH_LOG_KEY);
  console.log('Auth logs cleared');
};

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

  // Fetch full user data from local server (with retry for network errors)
  const fetchFullUserData = useCallback(async (authToken: string, retries = 3): Promise<User | null> => {
    authLog('fetchFullUserData START', { tokenLength: authToken.length, retries });

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        authLog(`fetchFullUserData attempt ${attempt}/${retries}`);
        const response = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${authToken}`,
          },
        });

        authLog(`fetchFullUserData response`, { status: response.status, ok: response.ok });

        if (response.ok) {
          const data = await response.json();
          authLog('fetchFullUserData SUCCESS', { email: data.user?.email });
          return data.user;
        }
        // Non-network error (401, 403, etc) - don't retry
        authLog('fetchFullUserData FAILED - server error', { status: response.status });
        return null;
      } catch (error) {
        authLog(`fetchFullUserData NETWORK ERROR attempt ${attempt}`, { error: String(error) });
        if (attempt < retries) {
          // Wait before retry (200ms, 400ms, 600ms)
          await new Promise(resolve => setTimeout(resolve, attempt * 200));
        }
      }
    }
    authLog('fetchFullUserData FAILED - all retries exhausted');
    return null;
  }, []);

  // Handle user login from token
  const handleUserLogin = useCallback(async (authToken: string) => {
    authLog('handleUserLogin START', { tokenLength: authToken.length });

    const jwtUser = decodeJWT(authToken);
    if (!jwtUser) {
      authLog('handleUserLogin FAILED - invalid JWT');
      setUser(null);
      setToken(null);
      localStorage.removeItem(TOKEN_KEY);
      return;
    }

    authLog('handleUserLogin JWT decoded', { sub: (jwtUser as any).sub, game: (jwtUser as any).game });

    // Store token temporarily while we validate
    localStorage.setItem(TOKEN_KEY, authToken);
    setToken(authToken);
    authLog('handleUserLogin token stored in localStorage');

    // Try to get full user data from local server
    const fullUser = await fetchFullUserData(authToken);

    if (fullUser) {
      authLog('handleUserLogin SUCCESS - user set', { email: fullUser.email });
      setUser(fullUser);
    } else {
      // Backend rejected the token - user is no longer logged in
      authLog('handleUserLogin FAILED - backend rejected, clearing state');
      localStorage.removeItem(TOKEN_KEY);
      deleteCookie(COOKIE_NAME);
      setUser(null);
      setToken(null);
      return;
    }
  }, [fetchFullUserData]);

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      authLog('=== initAuth START ===', {
        url: window.location.href,
        pathname: window.location.pathname,
        search: window.location.search
      });

      // Check for token in URL (after OAuth redirect)
      const urlParams = new URLSearchParams(window.location.search);
      const tokenFromUrl = urlParams.get('token');
      const errorFromUrl = urlParams.get('error');

      authLog('initAuth URL params', {
        hasToken: !!tokenFromUrl,
        tokenLength: tokenFromUrl?.length,
        error: errorFromUrl
      });

      if (tokenFromUrl) {
        authLog('initAuth - TOKEN FROM URL - processing');
        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname);
        authLog('initAuth - URL cleaned, calling handleUserLogin');
        await handleUserLogin(tokenFromUrl);

        // Broadcast to other tabs
        try {
          new BroadcastChannel(SYNC_CHANNEL).postMessage({ type: 'LOGIN' });
          authLog('initAuth - broadcast LOGIN sent');
        } catch (e) { /* BroadcastChannel not supported */ }

        authLog('initAuth - DONE (from URL token)');
        setIsLoading(false);
        return;
      }

      if (errorFromUrl) {
        authLog('initAuth - ERROR in URL', { error: errorFromUrl });
        setAuthError(errorFromUrl);
        window.history.replaceState({}, document.title, window.location.pathname);
      }

      // Check cookie
      const cookieToken = getCookie(COOKIE_NAME);
      authLog('initAuth - checking cookie', { hasCookie: !!cookieToken, expired: cookieToken ? isTokenExpired(cookieToken) : null });
      if (cookieToken && !isTokenExpired(cookieToken)) {
        authLog('initAuth - using cookie token');
        await handleUserLogin(cookieToken);
        setIsLoading(false);
        return;
      }

      // Check localStorage (fallback)
      const storedToken = localStorage.getItem(TOKEN_KEY);
      authLog('initAuth - checking localStorage', { hasStored: !!storedToken, expired: storedToken ? isTokenExpired(storedToken) : null });
      if (storedToken && !isTokenExpired(storedToken)) {
        authLog('initAuth - using localStorage token');
        await handleUserLogin(storedToken);
        setIsLoading(false);
        return;
      }

      // No valid token
      authLog('initAuth - NO VALID TOKEN FOUND');
      setIsLoading(false);
    };

    initAuth();
  }, [handleUserLogin]);

  // Tab sync via BroadcastChannel
  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return;

    const channel = new BroadcastChannel(SYNC_CHANNEL);

    channel.onmessage = (event) => {
      if (event.data.type === 'LOGOUT') {
        console.log('[BroadcastChannel] Logout event - clearing auth state');
        localStorage.removeItem(TOKEN_KEY);
        deleteCookie(COOKIE_NAME);
        window.location.reload();
      } else if (event.data.type === 'LOGIN') {
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
        forceTLS: REVERB_FORCE_TLS,
        disableStats: true,
        enabledTransports: REVERB_FORCE_TLS ? ['wss'] : ['ws'],
      });

      // Use game_user_id for the channel (MySys broadcasts to game_user_id, not local id)
      const channelId = user.game_user_id || user.id;
      channel = pusher.subscribe('auth.user.' + channelId);
      channel.bind('auth.sync', (data: { type: string }) => {
        console.log('[Reverb] Auth sync event:', data);
        if (data.type === 'LOGOUT') {
          // Clear auth state BEFORE reloading to prevent re-authentication
          console.log('[Reverb] Logout event - clearing auth state');
          localStorage.removeItem(TOKEN_KEY);
          deleteCookie(COOKIE_NAME);

          // Broadcast to other tabs
          try {
            new BroadcastChannel(SYNC_CHANNEL).postMessage({ type: 'LOGOUT' });
          } catch (e) { /* ignore */ }

          window.location.reload();
        } else if (data.type === 'LOGIN') {
          // Broadcast to other tabs and reload
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
