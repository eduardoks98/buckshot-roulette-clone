// ==========================================
// USE LOBBY EVENTS - Hook para eventos do lobby
// ==========================================

import { useEffect, useRef } from 'react';
import { useSocket } from '../../context/SocketContext';
import { PlayerPublicState } from '../../../../shared/types';

// Room info from server
export interface RoomInfo {
  code: string;
  hostName: string;
  playerCount: number;
  maxPlayers: number;
  hasPassword: boolean;
}

// Room created/joined payload
export interface RoomCreatedPayload {
  code: string;
  isHost: boolean;
  players: PlayerPublicState[];
}

export interface RoomJoinedPayload {
  code: string;
  isHost: boolean;
  players: PlayerPublicState[];
}

// Already in game payload
export interface AlreadyInGamePayload {
  roomCode: string;
  gameStarted: boolean;
}

// Reconnected to room payload
export interface ReconnectedToRoomPayload {
  roomCode: string;
}

// Handler interface - all handlers are optional
export interface LobbyEventHandlers {
  onRoomList?: (rooms: RoomInfo[]) => void;
  onRoomListUpdated?: () => void;
  onRoomCreated?: (data: RoomCreatedPayload) => void;
  onRoomJoined?: (data: RoomJoinedPayload) => void;
  onJoinError?: (message: string) => void;
  onRoomDeleted?: (data: { code: string }) => void;
  onLeftRoom?: () => void;
  onAlreadyInGame?: (data: AlreadyInGamePayload) => void;
  onReconnected?: (data: ReconnectedToRoomPayload) => void;
  onGameAbandoned?: () => void;
}

/**
 * Hook para gerenciar eventos do lobby via Socket.IO
 * Usado em ActiveRooms e telas de criação/entrada em salas
 */
export function useLobbyEvents(handlers: LobbyEventHandlers) {
  const { socket } = useSocket();

  // Use ref to avoid re-subscribing on every handler change
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    if (!socket) return;

    // Room list
    const handleRoomList = (rooms: RoomInfo[]) => {
      handlersRef.current.onRoomList?.(rooms);
    };

    const handleRoomListUpdated = () => {
      handlersRef.current.onRoomListUpdated?.();
    };

    // Room created
    const handleRoomCreated = (data: RoomCreatedPayload) => {
      handlersRef.current.onRoomCreated?.(data);
    };

    // Room joined
    const handleRoomJoined = (data: RoomJoinedPayload) => {
      handlersRef.current.onRoomJoined?.(data);
    };

    // Join error
    const handleJoinError = (message: string) => {
      handlersRef.current.onJoinError?.(message);
    };

    // Room deleted
    const handleRoomDeleted = (data: { code: string }) => {
      handlersRef.current.onRoomDeleted?.(data);
    };

    // Left room
    const handleLeftRoom = () => {
      handlersRef.current.onLeftRoom?.();
    };

    // Already in game
    const handleAlreadyInGame = (data: AlreadyInGamePayload) => {
      handlersRef.current.onAlreadyInGame?.(data);
    };

    // Reconnected
    const handleReconnected = (data: ReconnectedToRoomPayload) => {
      handlersRef.current.onReconnected?.(data);
    };

    // Game abandoned
    const handleGameAbandoned = () => {
      handlersRef.current.onGameAbandoned?.();
    };

    // Subscribe
    socket.on('roomList', handleRoomList);
    socket.on('roomListUpdated', handleRoomListUpdated);
    socket.on('roomUpdated', handleRoomListUpdated); // Also triggers refresh
    socket.on('roomCreated', handleRoomCreated);
    socket.on('roomJoined', handleRoomJoined);
    socket.on('joinError', handleJoinError);
    socket.on('roomDeleted', handleRoomDeleted);
    socket.on('leftRoom', handleLeftRoom);
    socket.on('alreadyInGame', handleAlreadyInGame);
    socket.on('reconnected', handleReconnected);
    socket.on('gameAbandoned', handleGameAbandoned);

    // Cleanup
    return () => {
      socket.off('roomList', handleRoomList);
      socket.off('roomListUpdated', handleRoomListUpdated);
      socket.off('roomUpdated', handleRoomListUpdated);
      socket.off('roomCreated', handleRoomCreated);
      socket.off('roomJoined', handleRoomJoined);
      socket.off('joinError', handleJoinError);
      socket.off('roomDeleted', handleRoomDeleted);
      socket.off('leftRoom', handleLeftRoom);
      socket.off('alreadyInGame', handleAlreadyInGame);
      socket.off('reconnected', handleReconnected);
      socket.off('gameAbandoned', handleGameAbandoned);
    };
  }, [socket]);
}

export default useLobbyEvents;
