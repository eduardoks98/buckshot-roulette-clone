// ==========================================
// BUG REPORT CONTROLLER
// ==========================================
// Apenas envia bug reports para o Games Admin
// Gerenciamento de reports é feito pelo Games Admin
// ==========================================

import { Request, Response } from 'express';
import { bugService } from '../services/bug.service';
import { authService } from '../services/auth.service';
import { BugCategory, BugPriority } from '@prisma/client';

// ==========================================
// CREATE BUG REPORT (anyone can report)
// ==========================================

export const createBugReport = async (req: Request, res: Response) => {
  try {
    const { title, description, category, priority, gameRoomCode, gameRound, gameState, screenshot } = req.body;

    // Validate required fields
    if (!title || !description || !category) {
      return res.status(400).json({ error: 'Titulo, descricao e categoria sao obrigatorios' });
    }

    // Validate category
    if (!Object.values(BugCategory).includes(category)) {
      return res.status(400).json({ error: 'Categoria invalida' });
    }

    // Get user ID if authenticated
    let userId: string | undefined;
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const user = await authService.validateToken(token);
      userId = user?.id;
    }

    // Send to Games Admin API
    const report = await bugService.createReport({
      user_id: userId,
      title,
      description,
      category,
      priority: priority || BugPriority.MEDIUM,
      game_room_code: gameRoomCode,
      game_round: gameRound,
      game_state: gameState ? JSON.stringify(gameState) : undefined,
      screenshot,
    });

    res.status(201).json(report);
  } catch (error) {
    console.error('[BugController] Erro ao criar report:', error);

    // Return specific error message if available
    if (error instanceof Error) {
      return res.status(500).json({ error: error.message });
    }

    res.status(500).json({ error: 'Erro ao enviar bug report' });
  }
};

// ==========================================
// CHECK GAMES ADMIN CONFIG
// ==========================================

export const checkGamesAdminConfig = async (_req: Request, res: Response) => {
  try {
    res.json({
      configured: bugService.isConfigured(),
    });
  } catch (error) {
    console.error('[BugController] Erro ao verificar config:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
};
