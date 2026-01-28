// ==========================================
// USE GAME SESSION - Gerencia sessão do jogo
// ==========================================

import { useCallback } from 'react';

const SESSION_KEY = 'bangshotSession';
const RECONNECT_KEY = 'bangshotReconnect';
const SESSION_EXPIRY_MS = 30 * 60 * 1000; // 30 minutos
const RECONNECT_EXPIRY_MS = 5 * 60 * 1000; // 5 minutos

export interface GameSession {
  roomCode: string;
  playerName: string;
  isHost: boolean;
  timestamp: number;
}

export interface ReconnectData {
  roomCode: string;
  playerName: string;
  reconnectToken: string;
  timestamp: number;
}

export interface UseGameSessionReturn {
  /** Salvar sessão do jogo */
  saveSession: (session: Omit<GameSession, 'timestamp'>) => void;
  /** Obter sessão salva (null se expirada ou inexistente) */
  getSession: () => GameSession | null;
  /** Limpar sessão */
  clearSession: () => void;
  /** Salvar dados de reconexão */
  saveReconnectData: (data: Omit<ReconnectData, 'timestamp'>) => void;
  /** Obter dados de reconexão (null se expirados ou inexistentes) */
  getReconnectData: () => ReconnectData | null;
  /** Limpar dados de reconexão */
  clearReconnectData: () => void;
  /** Limpar todos os dados da sessão */
  clearAll: () => void;
}

/**
 * Hook para gerenciar sessão do jogo no localStorage
 * Centraliza lógica de persistência e expiração
 *
 * @example
 * function WaitingRoom() {
 *   const { saveSession, getSession, clearSession } = useGameSession();
 *
 *   // Salvar ao entrar na sala
 *   saveSession({ roomCode: 'ABC123', playerName: 'Player1', isHost: true });
 *
 *   // Verificar sessão anterior
 *   const session = getSession();
 *   if (session) {
 *     // Reconectar...
 *   }
 * }
 */
export function useGameSession(): UseGameSessionReturn {
  const saveSession = useCallback((session: Omit<GameSession, 'timestamp'>) => {
    localStorage.setItem(SESSION_KEY, JSON.stringify({
      ...session,
      timestamp: Date.now(),
    }));
  }, []);

  const getSession = useCallback((): GameSession | null => {
    const saved = localStorage.getItem(SESSION_KEY);
    if (!saved) return null;

    try {
      const session: GameSession = JSON.parse(saved);

      // Verificar expiração
      if (Date.now() - session.timestamp > SESSION_EXPIRY_MS) {
        localStorage.removeItem(SESSION_KEY);
        return null;
      }

      return session;
    } catch {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
  }, []);

  const clearSession = useCallback(() => {
    localStorage.removeItem(SESSION_KEY);
  }, []);

  const saveReconnectData = useCallback((data: Omit<ReconnectData, 'timestamp'>) => {
    localStorage.setItem(RECONNECT_KEY, JSON.stringify({
      ...data,
      timestamp: Date.now(),
    }));
  }, []);

  const getReconnectData = useCallback((): ReconnectData | null => {
    const saved = localStorage.getItem(RECONNECT_KEY);
    if (!saved) return null;

    try {
      const data: ReconnectData = JSON.parse(saved);

      // Verificar expiração
      if (Date.now() - data.timestamp > RECONNECT_EXPIRY_MS) {
        localStorage.removeItem(RECONNECT_KEY);
        return null;
      }

      return data;
    } catch {
      localStorage.removeItem(RECONNECT_KEY);
      return null;
    }
  }, []);

  const clearReconnectData = useCallback(() => {
    localStorage.removeItem(RECONNECT_KEY);
  }, []);

  const clearAll = useCallback(() => {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(RECONNECT_KEY);
  }, []);

  return {
    saveSession,
    getSession,
    clearSession,
    saveReconnectData,
    getReconnectData,
    clearReconnectData,
    clearAll,
  };
}

export default useGameSession;
