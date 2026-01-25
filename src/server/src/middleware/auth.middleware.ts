// ==========================================
// AUTH MIDDLEWARE
// ==========================================

import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { User as PrismaUser } from '@prisma/client';

// Extend Express.User (from passport types) with Prisma User fields
declare global {
  namespace Express {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface User extends PrismaUser {}
  }
}

// ==========================================
// AUTH MIDDLEWARE
// ==========================================

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({ error: 'Token não fornecido' });
      return;
    }

    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : authHeader;

    const user = await authService.validateToken(token);

    if (!user) {
      res.status(401).json({ error: 'Token inválido ou expirado' });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('[Auth] Erro no middleware:', error);
    res.status(500).json({ error: 'Erro interno de autenticação' });
  }
}

// ==========================================
// ADMIN MIDDLEWARE
// ==========================================

export async function adminMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Usuário não autenticado' });
      return;
    }

    if (!req.user.is_admin) {
      res.status(403).json({ error: 'Acesso negado. Permissão de administrador necessária.' });
      return;
    }

    next();
  } catch (error) {
    console.error('[Admin] Erro no middleware:', error);
    res.status(500).json({ error: 'Erro interno de autorização' });
  }
}

// ==========================================
// OPTIONAL AUTH MIDDLEWARE
// ==========================================

export async function optionalAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader) {
      const token = authHeader.startsWith('Bearer ')
        ? authHeader.slice(7)
        : authHeader;

      const user = await authService.validateToken(token);
      if (user) {
        req.user = user;
      }
    }

    next();
  } catch (error) {
    // Em caso de erro, continua sem usuário
    next();
  }
}
