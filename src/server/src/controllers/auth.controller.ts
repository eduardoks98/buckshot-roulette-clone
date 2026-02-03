// ==========================================
// AUTH CONTROLLER
// ==========================================

import { Request, Response } from 'express';
import { authService } from '../services/auth.service';

// ==========================================
// SESSION
// ==========================================

export const getMe = async (req: Request, res: Response) => {
  console.log('[Auth] getMe - Request received');
  try {
    const authHeader = req.headers.authorization;
    console.log('[Auth] getMe - Auth header present:', !!authHeader);

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('[Auth] getMe - No valid auth header, returning 401');
      return res.status(401).json({ error: 'Token nao fornecido' });
    }

    const token = authHeader.split(' ')[1];
    console.log('[Auth] getMe - Token length:', token.length);

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
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(200).json({ message: 'Logout realizado' });
    }

    const token = authHeader.split(' ')[1];
    const user = await authService.validateToken(token);

    if (user) {
      // Invalidate all sessions for this user
      await authService.invalidateAllSessions(user.id);
    }

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
