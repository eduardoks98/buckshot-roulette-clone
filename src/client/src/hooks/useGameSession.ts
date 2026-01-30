// ==========================================
// USE GAME SESSION - Gerencia reconexão do jogo
// ==========================================
// NOTA: A funcionalidade de "session" foi removida pois era redundante.
// O servidor já sabe em qual sala o usuário está via getRoomByUserId().
// Agora usamos apenas checkActiveGame via socket.

import { useCallback } from 'react';

// Chave para dados de reconexão (sessionStorage para maior segurança)
const RECONNECT_KEY = 'bangshot_reconnect';

// Chaves legadas para limpeza durante migração
const LEGACY_SESSION_KEY = 'bangshotSession';
const LEGACY_RECONNECT_KEY = 'bangshotReconnect';
const LEGACY_SESSION_KEY_NEW = 'bangshot_session';

const RECONNECT_EXPIRY_MS = 5 * 60 * 1000; // 5 minutos

// Interface mantida para compatibilidade (deprecated)
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
  /** @deprecated Session não é mais usado - servidor gerencia via socket */
  saveSession: (session: Omit<GameSession, 'timestamp'>) => void;
  /** @deprecated Session não é mais usado - use checkActiveGame via socket */
  getSession: () => GameSession | null;
  /** @deprecated Session não é mais usado */
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
 * Hook para gerenciar reconexão do jogo
 *
 * NOTA: As funções de "session" estão deprecated e são noop.
 * O servidor usa getRoomByUserId() para saber se o usuário está em uma sala.
 * O cliente usa checkActiveGame via socket ao montar o componente.
 *
 * Apenas os dados de reconexão (reconnectToken) são mantidos para
 * permitir reconexão após F5/refresh durante o jogo.
 */
export function useGameSession(): UseGameSessionReturn {
  // ============================================
  // DEPRECATED: Funções de session são noop
  // O servidor é a fonte da verdade via getRoomByUserId()
  // ============================================

  const saveSession = useCallback((_session: Omit<GameSession, 'timestamp'>) => {
    // Noop - servidor gerencia via getRoomByUserId()
    // Apenas limpar chaves antigas se existirem
    localStorage.removeItem(LEGACY_SESSION_KEY);
    localStorage.removeItem(LEGACY_SESSION_KEY_NEW);
  }, []);

  const getSession = useCallback((): GameSession | null => {
    // Sempre retorna null - use checkActiveGame via socket
    // Limpar chaves antigas se existirem
    localStorage.removeItem(LEGACY_SESSION_KEY);
    localStorage.removeItem(LEGACY_SESSION_KEY_NEW);
    return null;
  }, []);

  const clearSession = useCallback(() => {
    // Limpar chaves antigas que possam existir
    localStorage.removeItem(LEGACY_SESSION_KEY);
    localStorage.removeItem(LEGACY_SESSION_KEY_NEW);
  }, []);

  // ============================================
  // RECONNECT: Funções ativas para reconexão
  // ============================================

  const saveReconnectData = useCallback((data: Omit<ReconnectData, 'timestamp'>) => {
    // Usar sessionStorage para segurança (expira ao fechar aba)
    sessionStorage.setItem(RECONNECT_KEY, JSON.stringify({
      ...data,
      timestamp: Date.now(),
    }));
    // Limpar localStorage antigo se existir
    localStorage.removeItem(RECONNECT_KEY);
    localStorage.removeItem(LEGACY_RECONNECT_KEY);
  }, []);

  const getReconnectData = useCallback((): ReconnectData | null => {
    // Tentar sessionStorage primeiro (novo)
    let saved = sessionStorage.getItem(RECONNECT_KEY);

    // Migração: se não encontrou em sessionStorage, tentar localStorage (antigo)
    if (!saved) {
      saved = localStorage.getItem(RECONNECT_KEY) || localStorage.getItem(LEGACY_RECONNECT_KEY);
      if (saved) {
        // Migrar para sessionStorage e limpar localStorage
        sessionStorage.setItem(RECONNECT_KEY, saved);
        localStorage.removeItem(RECONNECT_KEY);
        localStorage.removeItem(LEGACY_RECONNECT_KEY);
      }
    }

    if (!saved) return null;

    try {
      const data: ReconnectData = JSON.parse(saved);

      // Verificar expiração
      if (Date.now() - data.timestamp > RECONNECT_EXPIRY_MS) {
        sessionStorage.removeItem(RECONNECT_KEY);
        return null;
      }

      return data;
    } catch {
      sessionStorage.removeItem(RECONNECT_KEY);
      return null;
    }
  }, []);

  const clearReconnectData = useCallback(() => {
    sessionStorage.removeItem(RECONNECT_KEY);
    // Limpar chaves antigas também
    localStorage.removeItem(RECONNECT_KEY);
    localStorage.removeItem(LEGACY_RECONNECT_KEY);
  }, []);

  const clearAll = useCallback(() => {
    // Limpar todas as chaves (novas e antigas)
    sessionStorage.removeItem(RECONNECT_KEY);
    localStorage.removeItem(RECONNECT_KEY);
    localStorage.removeItem(LEGACY_SESSION_KEY);
    localStorage.removeItem(LEGACY_SESSION_KEY_NEW);
    localStorage.removeItem(LEGACY_RECONNECT_KEY);
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
