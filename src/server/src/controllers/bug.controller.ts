// ==========================================
// BUG REPORT CONTROLLER
// ==========================================

import { Request, Response } from 'express';
import { bugService } from '../services/bug.service';
import { authService } from '../services/auth.service';
import { BugCategory, BugPriority, BugStatus } from '@prisma/client';

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

    const report = await bugService.createReport({
      userId,
      title,
      description,
      category,
      priority: priority || BugPriority.MEDIUM,
      gameRoomCode,
      gameRound,
      gameState: gameState ? JSON.stringify(gameState) : undefined,
      screenshot,
    });

    res.status(201).json(report);
  } catch (error) {
    console.error('[BugController] Erro ao criar report:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
};

// ==========================================
// GET BUG REPORTS (admin only)
// ==========================================

export const getBugReports = async (req: Request, res: Response) => {
  try {
    const { status, category, priority, page = '1', limit = '20' } = req.query;

    const result = await bugService.getReports(
      {
        status: status as BugStatus | undefined,
        category: category as BugCategory | undefined,
        priority: priority as BugPriority | undefined,
      },
      parseInt(page as string),
      parseInt(limit as string)
    );

    res.json(result);
  } catch (error) {
    console.error('[BugController] Erro ao buscar reports:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
};

// ==========================================
// GET SINGLE BUG REPORT (admin only)
// ==========================================

export const getBugReportById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const report = await bugService.getReportById(id);

    if (!report) {
      return res.status(404).json({ error: 'Report nao encontrado' });
    }

    res.json(report);
  } catch (error) {
    console.error('[BugController] Erro ao buscar report:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
};

// ==========================================
// UPDATE BUG REPORT (admin only)
// ==========================================

export const updateBugReport = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, priority, adminNotes } = req.body;

    // Get admin user ID
    let resolvedBy: string | undefined;
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const user = await authService.validateToken(token);
      resolvedBy = user?.id;
    }

    const report = await bugService.updateReport(id, {
      status,
      priority,
      adminNotes,
      resolvedBy,
    });

    res.json(report);
  } catch (error) {
    console.error('[BugController] Erro ao atualizar report:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
};

// ==========================================
// DELETE BUG REPORT (admin only)
// ==========================================

export const deleteBugReport = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await bugService.deleteReport(id);

    res.json({ success: true });
  } catch (error) {
    console.error('[BugController] Erro ao deletar report:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
};

// ==========================================
// GET BUG STATS (admin only)
// ==========================================

export const getBugStats = async (_req: Request, res: Response) => {
  try {
    const stats = await bugService.getStats();
    res.json(stats);
  } catch (error) {
    console.error('[BugController] Erro ao buscar stats:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
};
