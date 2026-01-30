// ==========================================
// OAUTH SERVICE - PKCE Implementation
// ==========================================

const STORAGE_KEY_VERIFIER = 'oauth_code_verifier';
const STORAGE_KEY_STATE = 'oauth_state';

/**
 * Generate a cryptographically random string
 */
function generateRandomString(length: number): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate a code verifier for PKCE (64 random bytes = 128 hex chars)
 */
export function generateCodeVerifier(): string {
  return generateRandomString(64);
}

/**
 * Generate a state parameter for CSRF protection (32 random bytes)
 */
export function generateState(): string {
  return generateRandomString(32);
}

/**
 * Generate code challenge from verifier using SHA-256
 * Returns base64url encoded hash
 */
export async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hash = await crypto.subtle.digest('SHA-256', data);

  // Convert to base64url
  const base64 = btoa(String.fromCharCode(...new Uint8Array(hash)));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Store PKCE values in sessionStorage
 */
export function storePKCEValues(codeVerifier: string, state: string): void {
  sessionStorage.setItem(STORAGE_KEY_VERIFIER, codeVerifier);
  sessionStorage.setItem(STORAGE_KEY_STATE, state);
}

/**
 * Get stored code verifier
 */
export function getStoredCodeVerifier(): string | null {
  return sessionStorage.getItem(STORAGE_KEY_VERIFIER);
}

/**
 * Get stored state
 */
export function getStoredState(): string | null {
  return sessionStorage.getItem(STORAGE_KEY_STATE);
}

/**
 * Clear stored PKCE values
 */
export function clearPKCEValues(): void {
  sessionStorage.removeItem(STORAGE_KEY_VERIFIER);
  sessionStorage.removeItem(STORAGE_KEY_STATE);
}

/**
 * Build OAuth authorization URL
 */
export function buildAuthorizationUrl(
  authorizeUrl: string,
  clientId: string,
  redirectUri: string,
  codeChallenge: string,
  state: string
): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    state: state,
  });

  return `${authorizeUrl}?${params.toString()}`;
}

/**
 * Initiate OAuth login flow
 * Redirects to centralized login page at mysys.shop/login
 */
export async function initiateOAuthLogin(): Promise<void> {
  const portalUrl = import.meta.env.VITE_PORTAL_URL || 'https://mysys.shop';
  const returnUrl = encodeURIComponent(window.location.origin + '/lobby');

  // Redirect to centralized login page with return URL
  const loginUrl = `${portalUrl}/login?return_url=${returnUrl}&source=BANGSHOT`;

  console.log('[OAuth] Redirecting to centralized login page');
  window.location.href = loginUrl;
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(
  code: string,
  state: string
): Promise<{ success: boolean; token?: string; user?: unknown; error?: string }> {
  // Verify state
  const storedState = getStoredState();
  if (!storedState || storedState !== state) {
    console.error('[OAuth] State mismatch - possible CSRF attack');
    clearPKCEValues();
    return { success: false, error: 'Invalid state parameter' };
  }

  // Get code verifier
  const codeVerifier = getStoredCodeVerifier();
  if (!codeVerifier) {
    console.error('[OAuth] Code verifier not found');
    return { success: false, error: 'Code verifier not found' };
  }

  // Clear stored values
  clearPKCEValues();

  const redirectUri = import.meta.env.VITE_OAUTH_REDIRECT_URI || `${window.location.origin}/auth/callback`;

  try {
    // Call our backend to exchange the code
    const response = await fetch('/api/oauth/callback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code,
        code_verifier: codeVerifier,
        redirect_uri: redirectUri,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      console.error('[OAuth] Token exchange failed:', data);
      return {
        success: false,
        error: data.error_description || data.error || 'Authentication failed',
      };
    }

    return {
      success: true,
      token: data.token,
      user: data.user,
    };
  } catch (error) {
    console.error('[OAuth] Error exchanging code:', error);
    return { success: false, error: 'Network error during authentication' };
  }
}
