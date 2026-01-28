// ==========================================
// USE GAME ACTIONS - Hook para ações do jogo
// ==========================================

import { useCallback } from 'react';
import { useSocket } from '../../context/SocketContext';
import { ItemId } from '../../../../shared/types';

export interface UseGameActionsOptions {
  /** Se é a vez do jogador */
  isMyTurn: boolean;
  /** Se há overlay ativo bloqueando ações */
  hasActiveOverlay?: boolean;
  /** Se há item roubado pendente de uso */
  hasPendingStolenItem?: boolean;
}

export interface UseGameActionsReturn {
  /** Atirar em um alvo */
  shoot: (targetId: string) => void;
  /** Usar um item */
  useItem: (itemId: ItemId, itemIndex: number, targetId?: string) => void;
  /** Obter itens de um jogador (para Adrenaline) */
  getPlayerItems: (targetId: string) => void;
  /** Tentar reconectar ao jogo */
  reconnectToGame: (roomCode: string, playerName: string, reconnectToken: string) => void;
  /** Pedir revanche */
  requestRematch: (previousRoomCode: string, playerName: string) => void;
}

/**
 * Hook para emitir ações de jogo via Socket.IO
 * Centraliza todos os emits relacionados ao gameplay
 */
export function useGameActions(options: UseGameActionsOptions): UseGameActionsReturn {
  const { socket } = useSocket();
  const { isMyTurn, hasActiveOverlay = false, hasPendingStolenItem = false } = options;

  const shoot = useCallback((targetId: string) => {
    if (!socket || !isMyTurn || hasActiveOverlay || hasPendingStolenItem) return;
    socket.emit('shoot', { targetId });
  }, [socket, isMyTurn, hasActiveOverlay, hasPendingStolenItem]);

  const useItem = useCallback((itemId: ItemId, itemIndex: number, targetId?: string) => {
    if (!socket || !isMyTurn || hasActiveOverlay) return;
    socket.emit('useItem', {
      itemId,
      targetId,
      itemIndex,
    });
  }, [socket, isMyTurn, hasActiveOverlay]);

  const getPlayerItems = useCallback((targetId: string) => {
    if (!socket) return;
    socket.emit('getPlayerItems', { targetId });
  }, [socket]);

  const reconnectToGame = useCallback((roomCode: string, playerName: string, reconnectToken: string) => {
    if (!socket) return;
    socket.emit('reconnectToGame', {
      roomCode,
      playerName,
      reconnectToken,
    });
  }, [socket]);

  const requestRematch = useCallback((previousRoomCode: string, playerName: string) => {
    if (!socket) return;
    socket.emit('requestRematch', {
      previousRoomCode,
      playerName,
    });
  }, [socket]);

  return {
    shoot,
    useItem,
    getPlayerItems,
    reconnectToGame,
    requestRematch,
  };
}

export default useGameActions;
