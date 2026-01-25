// ==========================================
// BUG REPORT ROUTES
// ==========================================

import { Router } from 'express';
import {
  createBugReport,
  getBugReports,
  getBugReportById,
  updateBugReport,
  deleteBugReport,
  getBugStats,
} from '../controllers/bug.controller';
import { authMiddleware, adminMiddleware } from '../middleware/auth.middleware';

const router = Router();

// ==========================================
// PUBLIC ROUTES (any user can report)
// ==========================================

// POST /api/bugs - Create a new bug report
router.post('/', createBugReport);

// ==========================================
// ADMIN ROUTES (requires authentication + admin role)
// ==========================================

// GET /api/bugs - List all bug reports
router.get('/', authMiddleware, adminMiddleware, getBugReports);

// GET /api/bugs/stats - Get bug stats
router.get('/stats', authMiddleware, adminMiddleware, getBugStats);

// GET /api/bugs/:id - Get a specific bug report
router.get('/:id', authMiddleware, adminMiddleware, getBugReportById);

// PATCH /api/bugs/:id - Update a bug report
router.patch('/:id', authMiddleware, adminMiddleware, updateBugReport);

// DELETE /api/bugs/:id - Delete a bug report
router.delete('/:id', authMiddleware, adminMiddleware, deleteBugReport);

export default router;
