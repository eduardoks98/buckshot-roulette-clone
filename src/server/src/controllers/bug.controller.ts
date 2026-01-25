// ==========================================
// BUG REPORT CONTROLLER
// ==========================================

import { Request, Response } from 'express';
import { bugService } from '../services/bug.service';
import { authService } from '../services/auth.service';
import { githubService } from '../services/github.service';
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

    // Transformar resposta para formato esperado pelo frontend
    res.json({
      data: result.reports,
      total: result.pagination.total,
      page: result.pagination.page,
      pages: result.pagination.totalPages,
    });
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
    const { status, priority, adminNotes, assignedToId, assignedToName } = req.body;

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
      admin_notes: adminNotes,
      resolved_by: resolvedBy,
      assigned_to_id: assignedToId,
      assigned_to_name: assignedToName,
    });

    res.json(report);
  } catch (error) {
    console.error('[BugController] Erro ao atualizar report:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
};

// ==========================================
// CREATE GITHUB ISSUE (admin only)
// ==========================================

export const createGitHubIssue = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if GitHub is configured
    if (!githubService.isConfigured()) {
      return res.status(400).json({
        error: 'Integracao GitHub nao configurada. Configure GITHUB_TOKEN, GITHUB_OWNER e GITHUB_REPO.'
      });
    }

    // Get bug report
    const report = await bugService.getReportById(id);
    if (!report) {
      return res.status(404).json({ error: 'Report nao encontrado' });
    }

    // Check if issue already exists
    if (report.git_issue_number) {
      return res.status(400).json({
        error: 'Issue ja existe para este report',
        issueUrl: report.git_issue_url,
        issueNumber: report.git_issue_number,
      });
    }

    // Create GitHub issue
    const issue = await githubService.createIssue({
      title: report.title,
      description: report.description,
      category: report.category,
      priority: report.priority,
      reportId: report.id,
      reporterName: report.user?.display_name,
      gameRoomCode: report.game_room_code,
    });

    if (!issue) {
      return res.status(500).json({ error: 'Falha ao criar issue no GitHub' });
    }

    // Update bug report with GitHub info
    const updatedReport = await bugService.updateReport(id, {
      git_issue_url: issue.html_url,
      git_issue_number: issue.number,
      git_issue_state: issue.state,
    });

    res.json({
      success: true,
      issue: {
        number: issue.number,
        url: issue.html_url,
        state: issue.state,
      },
      report: updatedReport,
    });
  } catch (error) {
    console.error('[BugController] Erro ao criar issue GitHub:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
};

// ==========================================
// CHECK GITHUB CONFIG (admin only)
// ==========================================

export const checkGitHubConfig = async (_req: Request, res: Response) => {
  try {
    res.json({
      configured: githubService.isConfigured(),
    });
  } catch (error) {
    console.error('[BugController] Erro ao verificar config GitHub:', error);
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
