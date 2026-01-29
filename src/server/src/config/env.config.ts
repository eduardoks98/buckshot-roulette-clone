// ==========================================
// ENVIRONMENT CONFIGURATION
// ==========================================

import dotenv from 'dotenv';
import path from 'path';

// Carregar variáveis de ambiente
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const ENV = {
  // Server
  PORT: parseInt(process.env.PORT || '3000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  IS_PRODUCTION: process.env.NODE_ENV === 'production',

  // Database
  DATABASE_URL: process.env.DATABASE_URL || '',

  // Session
  SESSION_SECRET: process.env.SESSION_SECRET || 'buckshot-roulette-secret-key',

  // Google OAuth (legacy - now handled by Games Admin)
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || '',
  GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback',

  // JWT (local tokens)
  JWT_SECRET: process.env.JWT_SECRET || 'jwt-secret-key',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',

  // Client URL
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',

  // Games Admin (Centralized OAuth)
  GAMES_ADMIN_API_URL: process.env.GAMES_ADMIN_API_URL || 'https://admin.mysys.shop',
  GAMES_ADMIN_JWT_SECRET: process.env.GAMES_ADMIN_JWT_SECRET || '',
  GAME_CODE: process.env.GAME_CODE || 'BANGSHOT',
} as const;

// Alias para compatibilidade
export const env = ENV;

// Validar variáveis obrigatórias em produção
export function validateEnv(): void {
  if (ENV.IS_PRODUCTION) {
    const required = [
      'DATABASE_URL',
      'SESSION_SECRET',
      'JWT_SECRET',
    ];

    const missing = required.filter(key => !process.env[key]);

    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
  }
}
