// ==========================================
// AUTH ROUTES
// ==========================================

import { Router } from 'express';
import {
  googleAuth,
  googleCallback,
  getMe,
  logout,
  validateToken,
} from '../controllers/auth.controller';

const router = Router();

// Google OAuth
router.get('/google', googleAuth);
router.get('/google/callback', googleCallback);

// Session management
router.get('/me', getMe);
router.post('/logout', logout);
router.post('/validate', validateToken);

export default router;
