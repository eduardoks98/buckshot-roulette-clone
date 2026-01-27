// ==========================================
// BUG REPORT SERVICE
// ==========================================
// Envia bug reports para o Games Admin centralizado
// ==========================================

import { BugCategory, BugPriority, DEFAULT_PRIORITY } from '../../../shared/types/bug.types';

// ==========================================
// CONFIG
// ==========================================

const GAMES_ADMIN_URL = process.env.GAMES_ADMIN_URL || 'http://localhost:8000';
const GAMES_ADMIN_API_KEY = process.env.GAMES_ADMIN_API_KEY || '';
const GAMES_ADMIN_GAME_CODE = process.env.GAMES_ADMIN_GAME_CODE || 'BANGSHOT';

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
  game_state?: string;
  screenshot?: string;
}

interface GamesAdminResponse {
  success: boolean;
  message: string;
  id: string;
}

// ==========================================
// SERVICE CLASS
// ==========================================

class BugService {
  private apiUrl: string;
  private apiKey: string;
  private gameCode: string;

  constructor() {
    this.apiUrl = GAMES_ADMIN_URL;
    this.apiKey = GAMES_ADMIN_API_KEY;
    this.gameCode = GAMES_ADMIN_GAME_CODE;
  }

  // Check if Games Admin is configured
  isConfigured(): boolean {
    return !!this.apiKey && !!this.apiUrl && !!this.gameCode;
  }

  // Create a new bug report - sends to Games Admin API
  async createReport(params: CreateBugReportParams): Promise<GamesAdminResponse> {
    if (!this.isConfigured()) {
      console.error('[BugReport] Games Admin nao configurado. Defina GAMES_ADMIN_URL, GAMES_ADMIN_API_KEY e GAMES_ADMIN_GAME_CODE.');
      throw new Error('Games Admin nao configurado');
    }

    try {
      const url = `${this.apiUrl}/api/games/${this.gameCode}/bug-reports`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey,
        },
        body: JSON.stringify({
          title: params.title,
          description: params.description,
          category: params.category,
          priority: params.priority || DEFAULT_PRIORITY,
          user_id: params.user_id || null,
          game_room_code: params.game_room_code || null,
          game_round: params.game_round || null,
          game_state: params.game_state || null,
          screenshot: params.screenshot || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json() as { error?: string };
        console.error('[BugReport] Erro da API Games Admin:', errorData);
        throw new Error(errorData.error || 'Erro ao enviar bug report');
      }

      const result = await response.json() as GamesAdminResponse;
      console.log(`[BugReport] Report enviado para Games Admin: ${result.id} - ${params.title}`);

      return result;
    } catch (error) {
      console.error('[BugReport] Erro ao enviar report para Games Admin:', error);
      throw error;
    }
  }
}

export const bugService = new BugService();
