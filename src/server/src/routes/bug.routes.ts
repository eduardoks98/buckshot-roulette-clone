// ==========================================
// BUG REPORT ROUTES
// ==========================================
// Bug reports são enviados para o Games Admin
// Gerenciamento é feito pelo painel Games Admin
// ==========================================

import { Router } from 'express';
import {
  createBugReport,
  checkGamesAdminConfig,
} from '../controllers/bug.controller';

const router = Router();

// ==========================================
// PUBLIC ROUTES
// ==========================================

// POST /api/bugs - Create a new bug report (sends to Games Admin)
router.post('/', createBugReport);

// GET /api/bugs/config - Check if Games Admin is configured
router.get('/config', checkGamesAdminConfig);

export default router;
