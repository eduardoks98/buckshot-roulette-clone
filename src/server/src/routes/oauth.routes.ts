// ==========================================
// OAUTH ROUTES
// ==========================================

import { Router } from 'express';
import { exchangeCode } from '../controllers/oauth.controller';

const router = Router();

// Exchange authorization code for user data (called by frontend)
router.post('/callback', exchangeCode);

export default router;
