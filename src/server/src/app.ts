// ==========================================
// EXPRESS APP SETUP
// ==========================================

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import http from 'http';
import path from 'path';
import passport from './config/passport.config';
import { ENV } from './config/env.config';
import { getOnlineCount } from './socket';
import authRoutes from './routes/auth.routes';
import leaderboardRoutes from './routes/leaderboard.routes';
import historyRoutes from './routes/history.routes';
import bugRoutes from './routes/bug.routes';
import achievementRoutes from './routes/achievement.routes';

export function createServer(): { app: Express; httpServer: http.Server } {
  const app = express();

  // ==========================================
  // MIDDLEWARE
  // ==========================================

  // CORS
  app.use(cors({
    origin: ENV.IS_PRODUCTION ? ENV.CLIENT_URL : '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  }));

  // JSON parser
  app.use(express.json());

  // URL encoded parser
  app.use(express.urlencoded({ extended: true }));

  // Passport
  app.use(passport.initialize());

  // ==========================================
  // STATIC FILES (em produção)
  // ==========================================

  if (ENV.IS_PRODUCTION) {
    // Servir arquivos estáticos do client build
    app.use(express.static(path.join(__dirname, '../../client/dist')));
  }

  // ==========================================
  // API ROUTES
  // ==========================================

  // Health check
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: ENV.NODE_ENV,
    });
  });

  // ads.txt para Google AdSense
  app.get('/ads.txt', (_req: Request, res: Response) => {
    res.type('text/plain').send('google.com, pub-5292148168457268, DIRECT, f08c47fec0942fa0');
  });

  // Online count
  app.get('/api/online', (_req: Request, res: Response) => {
    res.json(getOnlineCount());
  });

  // Auth routes
  app.use('/api/auth', authRoutes);

  // TODO: Adicionar rotas de usuário
  // app.use('/api/users', userRoutes);

  // Leaderboard routes
  app.use('/api/leaderboard', leaderboardRoutes);

  // History routes
  app.use('/api/history', historyRoutes);

  // Bug report routes
  app.use('/api/bugs', bugRoutes);

  // Achievement routes
  app.use('/api/achievements', achievementRoutes);

  // ==========================================
  // ERROR HANDLING
  // ==========================================

  // 404 handler para rotas não encontradas
  app.use((req: Request, res: Response) => {
    // Em produção, retorna o index.html para SPA routing
    if (ENV.IS_PRODUCTION && !req.path.startsWith('/api')) {
      res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
    } else {
      res.status(404).json({
        error: 'Not Found',
        message: `Rota ${req.method} ${req.path} não encontrada`,
      });
    }
  });

  // Error handler global
  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error('Erro:', err);

    res.status(500).json({
      error: 'Internal Server Error',
      message: ENV.IS_PRODUCTION ? 'Erro interno do servidor' : err.message,
    });
  });

  // ==========================================
  // HTTP SERVER
  // ==========================================

  const httpServer = http.createServer(app);

  return { app, httpServer };
}
