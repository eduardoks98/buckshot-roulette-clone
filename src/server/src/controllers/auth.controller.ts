// ==========================================
// AUTH CONTROLLER
// ==========================================

import { Request, Response } from 'express';
import { authService } from '../services/auth.service';

// ==========================================
// HELPERS
// ==========================================

/**
 * Extract token from request (Bearer header or httpOnly cookie)
 */
function extractToken(req: Request): string | null {
  // Try Bearer token first (for API clients)
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.split(' ')[1];
  }

  // Fallback: httpOnly cookie (for browser with credentials: 'include')
  const cookieToken = req.cookies?.mysys_token;
  if (cookieToken) {
    return cookieToken;
  }

  return null;
}

// ==========================================
// SESSION
// ==========================================

export const getMe = async (req: Request, res: Response) => {
  console.log('[Auth] getMe - Request received');
  try {
    const token = extractToken(req);
    console.log('[Auth] getMe - Token present:', !!token, token ? `(length: ${token.length})` : '');

    if (!token) {
      console.log('[Auth] getMe - No token found, returning 401');
      return res.status(401).json({ error: 'Token nao fornecido' });
    }

    const user = await authService.validateToken(token);
    console.log('[Auth] getMe - User from validateToken:', user ? user.email : 'null');

    if (!user) {
      console.log('[Auth] getMe - User is null, returning 401');
      return res.status(401).json({ error: 'Token invalido ou expirado' });
    }

    const profile = await authService.getUserProfile(user.id);
    console.log('[Auth] getMe - Profile fetched:', profile ? profile.email : 'null');
    console.log('[Auth] getMe - Returning success with user');
    res.json({ user: profile });
  } catch (error) {
    console.error('[Auth] getMe - Error:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    const token = extractToken(req);
    if (!token) {
      return res.status(200).json({ message: 'Logout realizado' });
    }

    // CRITICAL: Call MySys API to trigger AuthSyncEvent broadcast
    // This notifies all other games (Champion Forge, Portal, etc.) that user logged out
    const apiUrl = process.env.GAMES_ADMIN_API_URL || 'http://localhost:8000';
    const gameCode = process.env.GAME_CODE || 'BANGSHOT';

    try {
      const response = await fetch(
        `${apiUrl}/api/games/${gameCode}/auth/logout`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
        }
      );
      console.log('[Auth] MySys logout API called:', response.status);
    } catch (error) {
      console.error('[Auth] Failed to call MySys logout API:', error);
    }

    // Also invalidate local sessions
    const user = await authService.validateToken(token);
    if (user) {
      await authService.invalidateAllSessions(user.id);
    }

    // Clear SSO cookie from browser
    res.clearCookie('mysys_token', {
      domain: '.mysys.shop',
      path: '/',
      secure: true,
      httpOnly: true,
      sameSite: 'lax',
    });

    res.json({ message: 'Logout realizado' });
  } catch (error) {
    console.error('[Auth] Erro no logout:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
};

// ==========================================
// VALIDATE TOKEN
// ==========================================

export const validateToken = async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ valid: false, error: 'Token nao fornecido' });
    }

    const user = await authService.validateToken(token);

    if (!user) {
      return res.json({ valid: false });
    }

    const profile = await authService.getUserProfile(user.id);
    res.json({ valid: true, user: profile });
  } catch (error) {
    console.error('[Auth] Erro ao validar token:', error);
    res.status(500).json({ valid: false, error: 'Erro interno' });
  }
};
