// ==========================================
// ACHIEVEMENT ROUTES
// ==========================================

import { Router } from 'express';
import {
  getUserAchievements,
  getActiveTitle,
  setActiveTitle,
  getUserTitles,
  getGameBadges,
} from '../controllers/achievement.controller';

const router = Router();

// Conquistas do usuario
router.get('/', getUserAchievements);

// Titulo ativo
router.get('/title', getActiveTitle);
router.put('/title', setActiveTitle);

// Todos os titulos do usuario
router.get('/titles', getUserTitles);

// Badges de um jogo especifico
router.get('/game/:gameId/badges', getGameBadges);

export default router;
