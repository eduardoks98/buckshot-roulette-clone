import { getConfig, getGameApiUrl, debugLog, handleError } from './config';
import type {
  OAuthProvider,
  ProviderInfo,
  GameUser,
  TokenValidationResult,
} from './types';

const TOKEN_KEY = 'games_admin_token';

/**
 * Get available OAuth providers for the current game
 */
export async function getAvailableProviders(): Promise<ProviderInfo[]> {
  try {
    const response = await fetch(`${getGameApiUrl()}/auth/providers`);

    if (!response.ok) {
      throw new Error(`Failed to fetch providers: ${response.status}`);
    }

    const data = await response.json();
    debugLog('Available providers:', data.providers);
    return data.providers;
  } catch (error) {
    handleError(error as Error);
    return [];
  }
}

/**
 * Initiate OAuth login flow
 * Redirects the user to the OAuth provider
 */
export async function login(provider: OAuthProvider): Promise<void> {
  try {
    const currentUrl = window.location.href;
    const redirectUrl = encodeURIComponent(currentUrl);

    const response = await fetch(
      `${getGameApiUrl()}/auth/${provider}/redirect?redirect_url=${redirectUrl}`
    );

    if (!response.ok) {
      throw new Error(`Failed to initiate login: ${response.status}`);
    }

    const data = await response.json();
    debugLog('Redirecting to OAuth provider:', data.redirect_url);

    // Redirect to OAuth provider
    window.location.href = data.redirect_url;
  } catch (error) {
    handleError(error as Error);
    throw error;
  }
}

/**
 * Handle OAuth callback
 * Call this on your callback page to process the token
 */
export function handleCallback(): string | null {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  const error = urlParams.get('error');

  if (error) {
    handleError(new Error(`OAuth error: ${error}`));
    return null;
  }

  if (token) {
    setToken(token);
    debugLog('Token received and stored');

    // Clean up URL
    const url = new URL(window.location.href);
    url.searchParams.delete('token');
    window.history.replaceState({}, document.title, url.pathname + url.search);

    return token;
  }

  return null;
}

/**
 * Validate a JWT token with the Games Admin server
 */
export async function validateToken(token?: string): Promise<TokenValidationResult> {
  try {
    const tokenToValidate = token || getToken();

    if (!tokenToValidate) {
      return { valid: false, error: 'No token provided' };
    }

    const response = await fetch(`${getGameApiUrl()}/auth/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token: tokenToValidate }),
    });

    const data = await response.json();
    debugLog('Token validation result:', data);

    return data;
  } catch (error) {
    handleError(error as Error);
    return { valid: false, error: (error as Error).message };
  }
}

/**
 * Get current user profile
 */
export async function getCurrentUser(): Promise<GameUser | null> {
  try {
    const token = getToken();

    if (!token) {
      return null;
    }

    const response = await fetch(`${getGameApiUrl()}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        removeToken();
        notifyAuthStateChange(null);
        return null;
      }
      throw new Error(`Failed to fetch user: ${response.status}`);
    }

    const data = await response.json();
    debugLog('Current user:', data.user);

    notifyAuthStateChange(data.user);
    return data.user;
  } catch (error) {
    handleError(error as Error);
    return null;
  }
}

/**
 * Logout the current user
 */
export async function logout(): Promise<void> {
  try {
    const token = getToken();

    if (token) {
      await fetch(`${getGameApiUrl()}/auth/logout`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    }
  } catch (error) {
    debugLog('Logout request failed (non-critical):', error);
  } finally {
    removeToken();
    notifyAuthStateChange(null);
  }
}

/**
 * Check if user is logged in
 */
export function isLoggedIn(): boolean {
  return getToken() !== null;
}

/**
 * Get stored token
 */
export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * Store token
 */
export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

/**
 * Remove stored token
 */
export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

/**
 * Notify auth state change listener
 */
function notifyAuthStateChange(user: GameUser | null): void {
  const config = getConfig();
  if (config.onAuthStateChange) {
    config.onAuthStateChange(user);
  }
}
