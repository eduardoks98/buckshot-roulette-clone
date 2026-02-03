// ==========================================
// AUTH ROUTES
// ==========================================

import { Router } from 'express';
import {
  getMe,
  logout,
  validateToken,
} from '../controllers/auth.controller';

const router = Router();

// Session management
router.get('/me', getMe);
router.post('/logout', logout);
router.post('/validate', validateToken);

export default router;
