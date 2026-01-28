// ==========================================
// USE ROOM ACTIONS - Hook para ações da sala de espera
// ==========================================

import { useCallback } from 'react';
import { useSocket } from '../../context/SocketContext';

export interface UseRoomActionsReturn {
  /** Iniciar o jogo (host only) */
  startGame: () => void;
  /** Sair da sala */
  leaveRoom: () => void;
  /** Adicionar bot (development only) */
  addBot: (difficulty?: 'easy' | 'medium' | 'hard') => void;
  /** Remover bot (development only) */
  removeBot: (botId: string) => void;
}

/**
 * Hook para emitir ações da sala de espera via Socket.IO
 * Centraliza todos os emits relacionados à WaitingRoom
 */
export function useRoomActions(): UseRoomActionsReturn {
  const { socket } = useSocket();

  const startGame = useCallback(() => {
    if (!socket) return;
    socket.emit('startGame');
  }, [socket]);

  const leaveRoom = useCallback(() => {
    if (!socket) return;
    socket.emit('leaveRoom');
  }, [socket]);

  const addBot = useCallback((difficulty: 'easy' | 'medium' | 'hard' = 'medium') => {
    if (!socket) return;
    socket.emit('addBot', { difficulty });
  }, [socket]);

  const removeBot = useCallback((botId: string) => {
    if (!socket) return;
    socket.emit('removeBot', { botId });
  }, [socket]);

  return {
    startGame,
    leaveRoom,
    addBot,
    removeBot,
  };
}

export default useRoomActions;
