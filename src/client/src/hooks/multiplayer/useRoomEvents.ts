// ==========================================
// USE ROOM EVENTS - Hook para eventos da sala de espera
// ==========================================

import { useEffect, useRef } from 'react';
import { useSocket } from '../../context/SocketContext';
import { PlayerPublicState, RoundStartedPayload } from '../../../../shared/types';

// Player joined payload
export interface PlayerJoinedPayload {
  players: PlayerPublicState[];
}

// Player left payload
export interface PlayerLeftPayload {
  players: PlayerPublicState[];
}

// Player disconnected payload (temporary)
export interface PlayerDisconnectedPayload {
  playerId: string;
  playerName: string;
}

// Player reconnected payload
export interface PlayerReconnectedPayload {
  playerId: string;
  newSocketId?: string;
  playerName: string;
}

// Host changed payload
export interface HostChangedPayload {
  newHost: string;
}

// Bot events
export interface BotErrorPayload {
  message: string;
}

// Handler interface - all handlers are optional
export interface RoomEventHandlers {
  onPlayerJoined?: (data: PlayerJoinedPayload) => void;
  onPlayerLeft?: (data: PlayerLeftPayload) => void;
  onPlayerDisconnected?: (data: PlayerDisconnectedPayload) => void;
  onPlayerReconnected?: (data: PlayerReconnectedPayload) => void;
  onHostChanged?: (data: HostChangedPayload) => void;
  onRoundStarted?: (data: RoundStartedPayload) => void;
  onStartError?: (message: string) => void;
  onLeftRoom?: () => void;
  onRoomJoined?: (data: { code: string; isHost: boolean; players: PlayerPublicState[] }) => void;
  onJoinError?: (message: string) => void;
  // Bot events (development only)
  onBotAdded?: () => void;
  onBotRemoved?: () => void;
  onBotError?: (data: BotErrorPayload) => void;
}

/**
 * Hook para gerenciar eventos da sala de espera via Socket.IO
 * Usado na WaitingRoom para sincronizar estado dos jogadores
 */
export function useRoomEvents(handlers: RoomEventHandlers) {
  const { socket } = useSocket();

  // Use ref to avoid re-subscribing on every handler change
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    if (!socket) return;

    // Player management
    const handlePlayerJoined = (data: PlayerJoinedPayload) => {
      handlersRef.current.onPlayerJoined?.(data);
    };

    const handlePlayerLeft = (data: PlayerLeftPayload) => {
      handlersRef.current.onPlayerLeft?.(data);
    };

    const handlePlayerDisconnected = (data: PlayerDisconnectedPayload) => {
      handlersRef.current.onPlayerDisconnected?.(data);
    };

    const handlePlayerReconnected = (data: PlayerReconnectedPayload) => {
      handlersRef.current.onPlayerReconnected?.(data);
    };

    // Host management
    const handleHostChanged = (data: HostChangedPayload) => {
      handlersRef.current.onHostChanged?.(data);
    };

    // Game start
    const handleRoundStarted = (data: RoundStartedPayload) => {
      handlersRef.current.onRoundStarted?.(data);
    };

    const handleStartError = (message: string) => {
      handlersRef.current.onStartError?.(message);
    };

    // Room navigation
    const handleLeftRoom = () => {
      handlersRef.current.onLeftRoom?.();
    };

    const handleRoomJoined = (data: { code: string; isHost: boolean; players: PlayerPublicState[] }) => {
      handlersRef.current.onRoomJoined?.(data);
    };

    const handleJoinError = (message: string) => {
      handlersRef.current.onJoinError?.(message);
    };

    // Bot events
    const handleBotAdded = () => {
      handlersRef.current.onBotAdded?.();
    };

    const handleBotRemoved = () => {
      handlersRef.current.onBotRemoved?.();
    };

    const handleBotError = (data: BotErrorPayload) => {
      handlersRef.current.onBotError?.(data);
    };

    // Subscribe
    socket.on('playerJoined', handlePlayerJoined);
    socket.on('playerLeft', handlePlayerLeft);
    socket.on('playerDisconnected', handlePlayerDisconnected);
    socket.on('playerReconnected', handlePlayerReconnected);
    socket.on('hostChanged', handleHostChanged);
    socket.on('roundStarted', handleRoundStarted);
    socket.on('startError', handleStartError);
    socket.on('leftRoom', handleLeftRoom);
    socket.on('roomJoined', handleRoomJoined);
    socket.on('joinError', handleJoinError);
    socket.on('botAdded', handleBotAdded);
    socket.on('botRemoved', handleBotRemoved);
    socket.on('botError', handleBotError);

    // Cleanup
    return () => {
      socket.off('playerJoined', handlePlayerJoined);
      socket.off('playerLeft', handlePlayerLeft);
      socket.off('playerDisconnected', handlePlayerDisconnected);
      socket.off('playerReconnected', handlePlayerReconnected);
      socket.off('hostChanged', handleHostChanged);
      socket.off('roundStarted', handleRoundStarted);
      socket.off('startError', handleStartError);
      socket.off('leftRoom', handleLeftRoom);
      socket.off('roomJoined', handleRoomJoined);
      socket.off('joinError', handleJoinError);
      socket.off('botAdded', handleBotAdded);
      socket.off('botRemoved', handleBotRemoved);
      socket.off('botError', handleBotError);
    };
  }, [socket]);
}

export default useRoomEvents;
