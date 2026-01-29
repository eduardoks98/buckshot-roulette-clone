// ==========================================
// AUTH CONTROLLER
// ==========================================

import { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { User } from '@prisma/client';
import { authService } from '../services/auth.service';
import { env } from '../config/env.config';

// ==========================================
// GOOGLE AUTH (Legacy - kept for backwards compatibility)
// Now authentication is primarily handled by Games Admin
// ==========================================

export const googleAuth = passport.authenticate('google', {
  scope: ['profile', 'email'],
});

export const googleCallback = (req: Request, res: Response, next: NextFunction) => {
  console.log('[Auth] CLIENT_URL configurado:', env.CLIENT_URL);

  passport.authenticate('google', { session: false }, async (err: Error, user: User) => {
    if (err) {
      console.error('[Auth] Erro no callback Google:', err);
      return res.redirect(`${env.CLIENT_URL}/?error=auth_failed`);
    }

    if (!user) {
      return res.redirect(`${env.CLIENT_URL}/?error=no_user`);
    }

    try {
      // Create session and token
      const { token } = await authService.createSession(user.id);

      // Redirect to home with token (menu principal)
      res.redirect(`${env.CLIENT_URL}/?token=${token}`);
    } catch (error) {
      console.error('[Auth] Erro ao criar sessao:', error);
      res.redirect(`${env.CLIENT_URL}/?error=session_failed`);
    }
  })(req, res, next);
};

// ==========================================
// SESSION
// ==========================================

export const getMe = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token nao fornecido' });
    }

    const token = authHeader.split(' ')[1];
    const user = await authService.validateToken(token);

    if (!user) {
      return res.status(401).json({ error: 'Token invalido ou expirado' });
    }

    const profile = await authService.getUserProfile(user.id);
    res.json({ user: profile });
  } catch (error) {
    console.error('[Auth] Erro ao obter usuario:', error);
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
