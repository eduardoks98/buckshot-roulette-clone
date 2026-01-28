// ==========================================
// USE LOBBY ACTIONS - Hook para ações do lobby
// ==========================================

import { useCallback } from 'react';
import { useSocket } from '../../context/SocketContext';

export interface UseLobbyActionsReturn {
  /** Listar salas disponíveis */
  listRooms: () => void;
  /** Criar nova sala */
  createRoom: (playerName: string, password?: string) => void;
  /** Entrar em uma sala */
  joinRoom: (code: string, playerName: string, password?: string) => void;
  /** Sair da sala atual */
  leaveRoom: () => void;
  /** Verificar se está em jogo ativo */
  checkActiveGame: () => void;
  /** Reconectar a jogo ativo */
  rejoinGame: (roomCode: string) => void;
  /** Abandonar jogo ativo */
  abandonGame: (roomCode: string) => void;
}

/**
 * Hook para emitir ações do lobby via Socket.IO
 * Centraliza todos os emits relacionados à navegação de salas
 */
export function useLobbyActions(): UseLobbyActionsReturn {
  const { socket } = useSocket();

  const listRooms = useCallback(() => {
    if (!socket) return;
    socket.emit('listRooms');
  }, [socket]);

  const createRoom = useCallback((playerName: string, password?: string) => {
    if (!socket) return;
    socket.emit('createRoom', {
      playerName,
      password,
    });
  }, [socket]);

  const joinRoom = useCallback((code: string, playerName: string, password?: string) => {
    if (!socket) return;
    socket.emit('joinRoom', {
      code,
      playerName,
      password,
    });
  }, [socket]);

  const leaveRoom = useCallback(() => {
    if (!socket) return;
    socket.emit('leaveRoom');
  }, [socket]);

  const checkActiveGame = useCallback(() => {
    if (!socket) return;
    socket.emit('checkActiveGame');
  }, [socket]);

  const rejoinGame = useCallback((roomCode: string) => {
    if (!socket) return;
    socket.emit('rejoinGame', { roomCode });
  }, [socket]);

  const abandonGame = useCallback((roomCode: string) => {
    if (!socket) return;
    socket.emit('abandonGame', { roomCode });
  }, [socket]);

  return {
    listRooms,
    createRoom,
    joinRoom,
    leaveRoom,
    checkActiveGame,
    rejoinGame,
    abandonGame,
  };
}

export default useLobbyActions;
