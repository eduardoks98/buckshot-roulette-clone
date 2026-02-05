import { getConfig, getGameApiUrl, debugLog, handleError } from './config';
import type {
  OAuthProvider,
  ProviderInfo,
  GameUser,
  TokenValidationResult,
} from './types';

/**
 * Get available OAuth providers for the current game
 */
export async function getAvailableProviders(): Promise<ProviderInfo[]> {
  try {
    const response = await fetch(`${getGameApiUrl()}/auth/providers`, {
      credentials: 'include',
    });

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
      `${getGameApiUrl()}/auth/${provider}/redirect?redirect_url=${redirectUrl}`,
      { credentials: 'include' }
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
 * With httpOnly cookies, the token is handled server-side
 * This function now just cleans up the URL and checks for errors
 */
export function handleCallback(): boolean {
  const urlParams = new URLSearchParams(window.location.search);
  const error = urlParams.get('error');

  if (error) {
    handleError(new Error(`OAuth error: ${error}`));
    return false;
  }

  // Clean up URL (remove any query params)
  const url = new URL(window.location.href);
  if (url.search) {
    window.history.replaceState({}, document.title, url.pathname);
  }

  debugLog('OAuth callback processed');
  return true;
}

/**
 * Validate current session with the server
 */
export async function validateSession(): Promise<TokenValidationResult> {
  try {
    const response = await fetch(`${getGameApiUrl()}/auth/validate`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    debugLog('Session validation result:', data);

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
    const response = await fetch(`${getGameApiUrl()}/auth/me`, {
      credentials: 'include',
    });

    if (!response.ok) {
      if (response.status === 401) {
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
    await fetch(`${getGameApiUrl()}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });
  } catch (error) {
    debugLog('Logout request failed (non-critical):', error);
  } finally {
    notifyAuthStateChange(null);
  }
}

/**
 * Check if user is logged in by calling the server
 */
export async function isLoggedIn(): Promise<boolean> {
  const user = await getCurrentUser();
  return user !== null;
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

// Legacy exports for backwards compatibility (deprecated)
/** @deprecated Use credentials: 'include' instead */
export function getToken(): string | null {
  console.warn('getToken() is deprecated. Auth is now handled via httpOnly cookies.');
  return null;
}

/** @deprecated Token is now handled via httpOnly cookies */
export function setToken(_token: string): void {
  console.warn('setToken() is deprecated. Auth is now handled via httpOnly cookies.');
}

/** @deprecated Token is now handled via httpOnly cookies */
export function removeToken(): void {
  console.warn('removeToken() is deprecated. Auth is now handled via httpOnly cookies.');
}

/** @deprecated Use validateSession() instead */
export async function validateToken(_token?: string): Promise<TokenValidationResult> {
  console.warn('validateToken() is deprecated. Use validateSession() instead.');
  return validateSession();
}
