// ==========================================
// BUG REPORT SERVICE
// ==========================================

import { BugCategory, BugPriority, BugStatus } from '@prisma/client';
import prisma from '../lib/prisma';

// ==========================================
// TYPES
// ==========================================

interface CreateBugReportParams {
  user_id?: string;
  title: string;
  description: string;
  category: BugCategory;
  priority?: BugPriority;
  game_room_code?: string;
  game_round?: number;
  game_state?: string; // JSON stringified
  screenshot?: string; // base64
}

interface UpdateBugReportParams {
  status?: BugStatus;
  priority?: BugPriority;
  admin_notes?: string;
  resolved_by?: string;
  assigned_to_id?: string;
  assigned_to_name?: string;
  git_issue_url?: string;
  git_issue_number?: number;
  git_issue_state?: string;
}

interface BugReportFilters {
  status?: BugStatus;
  category?: BugCategory;
  priority?: BugPriority;
  userId?: string;
}

// ==========================================
// SERVICE CLASS
// ==========================================

class BugService {
  // Create a new bug report
  async createReport(params: CreateBugReportParams) {
    try {
      const report = await prisma.bugReport.create({
        data: {
          user_id: params.user_id || null,
          title: params.title,
          description: params.description,
          category: params.category,
          priority: params.priority || BugPriority.MEDIUM,
          game_room_code: params.game_room_code || null,
          game_round: params.game_round || null,
          game_state: params.game_state || null,
          screenshot: params.screenshot || null,
        },
        include: {
          user: {
            select: {
              id: true,
              display_name: true,
              email: true,
            },
          },
        },
      });

      console.log(`[BugReport] Novo report criado: ${report.id} - ${params.title}`);
      return report;
    } catch (error) {
      console.error('[BugReport] Erro ao criar report:', error);
      throw error;
    }
  }

  // Get all bug reports with filters
  async getReports(filters: BugReportFilters = {}, page = 1, limit = 20) {
    try {
      const where: Record<string, unknown> = {};

      if (filters.status) where.status = filters.status;
      if (filters.category) where.category = filters.category;
      if (filters.priority) where.priority = filters.priority;
      if (filters.userId) where.user_id = filters.userId;

      const [reports, total] = await Promise.all([
        prisma.bugReport.findMany({
          where,
          include: {
            user: {
              select: {
                id: true,
                display_name: true,
                email: true,
              },
            },
          },
          orderBy: { created_at: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.bugReport.count({ where }),
      ]);

      return {
        reports,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error('[BugReport] Erro ao buscar reports:', error);
      throw error;
    }
  }

  // Get a single bug report by ID
  async getReportById(id: string) {
    try {
      const report = await prisma.bugReport.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              display_name: true,
              email: true,
            },
          },
        },
      });

      return report;
    } catch (error) {
      console.error('[BugReport] Erro ao buscar report:', error);
      throw error;
    }
  }

  // Update a bug report (admin only)
  async updateReport(id: string, params: UpdateBugReportParams) {
    try {
      const data: Record<string, unknown> = {};

      if (params.status) {
        data.status = params.status;
        if (params.status === BugStatus.RESOLVED) {
          data.resolved_at = new Date();
          data.resolved_by = params.resolved_by;
        }
      }
      if (params.priority) data.priority = params.priority;
      if (params.admin_notes !== undefined) data.admin_notes = params.admin_notes;

      // Assignee fields
      if (params.assigned_to_id !== undefined) {
        data.assigned_to_id = params.assigned_to_id;
        data.assigned_to_name = params.assigned_to_name;
        data.assigned_at = params.assigned_to_id ? new Date() : null;
      }

      // GitHub integration fields
      if (params.git_issue_url !== undefined) data.git_issue_url = params.git_issue_url;
      if (params.git_issue_number !== undefined) data.git_issue_number = params.git_issue_number;
      if (params.git_issue_state !== undefined) data.git_issue_state = params.git_issue_state;

      const report = await prisma.bugReport.update({
        where: { id },
        data,
        include: {
          user: {
            select: {
              id: true,
              display_name: true,
              email: true,
            },
          },
        },
      });

      console.log(`[BugReport] Report atualizado: ${id} - status: ${params.status}`);
      return report;
    } catch (error) {
      console.error('[BugReport] Erro ao atualizar report:', error);
      throw error;
    }
  }

  // Delete a bug report
  async deleteReport(id: string) {
    try {
      await prisma.bugReport.delete({
        where: { id },
      });

      console.log(`[BugReport] Report deletado: ${id}`);
      return { success: true };
    } catch (error) {
      console.error('[BugReport] Erro ao deletar report:', error);
      throw error;
    }
  }

  // Get stats for dashboard
  async getStats() {
    try {
      const [total, open, inProgress, resolved, byCategory, byPriority] = await Promise.all([
        prisma.bugReport.count(),
        prisma.bugReport.count({ where: { status: BugStatus.OPEN } }),
        prisma.bugReport.count({ where: { status: BugStatus.IN_PROGRESS } }),
        prisma.bugReport.count({ where: { status: BugStatus.RESOLVED } }),
        prisma.bugReport.groupBy({
          by: ['category'],
          _count: { category: true },
        }),
        prisma.bugReport.groupBy({
          by: ['priority'],
          where: { status: { in: [BugStatus.OPEN, BugStatus.IN_PROGRESS] } },
          _count: { priority: true },
        }),
      ]);

      return {
        total,
        open,
        inProgress,
        resolved,
        byCategory: byCategory.reduce((acc, item) => {
          acc[item.category] = item._count.category;
          return acc;
        }, {} as Record<string, number>),
        byPriority: byPriority.reduce((acc, item) => {
          acc[item.priority] = item._count.priority;
          return acc;
        }, {} as Record<string, number>),
      };
    } catch (error) {
      console.error('[BugReport] Erro ao buscar stats:', error);
      throw error;
    }
  }
}

export const bugService = new BugService();
