// ==========================================
// EXPRESS APP SETUP
// ==========================================

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import http from 'http';
import path from 'path';
import passport from './config/passport.config';
import { ENV } from './config/env.config';
import authRoutes from './routes/auth.routes';
import leaderboardRoutes from './routes/leaderboard.routes';

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

  // Auth routes
  app.use('/api/auth', authRoutes);

  // TODO: Adicionar rotas de usuário
  // app.use('/api/users', userRoutes);

  // Leaderboard routes
  app.use('/api/leaderboard', leaderboardRoutes);

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
