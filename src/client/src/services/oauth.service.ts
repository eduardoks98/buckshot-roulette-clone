// ==========================================
// OAUTH SERVICE - PKCE Implementation
// ==========================================

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
 * Encode state with verifier (base64url JSON)
 * State contém: { nonce: random, verifier: codeVerifier }
 */
function encodeState(verifier: string): string {
  const nonce = generateRandomString(16);
  const payload = JSON.stringify({ n: nonce, v: verifier });
  const base64 = btoa(payload);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Decode state to extract verifier
 */
function decodeState(state: string): { nonce: string; verifier: string } | null {
  try {
    // Restore base64 padding
    let base64 = state.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) base64 += '=';

    const payload = atob(base64);
    const data = JSON.parse(payload);
    return { nonce: data.n, verifier: data.v };
  } catch {
    return null;
  }
}

/**
 * Clear stored PKCE values (no-op now, kept for compatibility)
 */
export function clearPKCEValues(): void {
  // No-op - state is self-contained now
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
 */
export async function initiateOAuthLogin(): Promise<void> {
  const authorizeUrl = import.meta.env.VITE_OAUTH_AUTHORIZE_URL || 'https://mysys.shop/oauth/authorize';
  const clientId = import.meta.env.VITE_OAUTH_CLIENT_ID || 'BANGSHOT';
  const redirectUri = import.meta.env.VITE_OAUTH_REDIRECT_URI || `${window.location.origin}/auth/callback`;

  // Generate PKCE values
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);

  // Encode verifier in state (no sessionStorage needed!)
  const state = encodeState(codeVerifier);

  // Build and redirect to authorization URL
  const authUrl = buildAuthorizationUrl(authorizeUrl, clientId, redirectUri, codeChallenge, state);

  console.log('[OAuth] Redirecting to authorization URL');
  window.location.href = authUrl;
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(
  code: string,
  state: string
): Promise<{ success: boolean; token?: string; user?: unknown; error?: string }> {
  // Decode state to extract verifier
  const stateData = decodeState(state);
  if (!stateData) {
    console.error('[OAuth] Invalid state format');
    return { success: false, error: 'Invalid state parameter' };
  }

  const codeVerifier = stateData.verifier;
  if (!codeVerifier) {
    console.error('[OAuth] Code verifier not found in state');
    return { success: false, error: 'Code verifier not found' };
  }

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
