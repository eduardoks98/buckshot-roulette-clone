// ==========================================
// USE GAME EVENTS - Hook para eventos do jogo
// ==========================================

import { useEffect, useRef } from 'react';
import { useSocket } from '../../context/SocketContext';
import {
  RoundStartedPayload,
  ShotFiredPayload,
  ItemUsedPayload,
  GameOverPayload,
  AchievementUnlocked,
} from '../../../../shared/types';

// Payload types for game events
export interface TurnChangedPayload {
  currentPlayer: string;
  players?: import('../../../../shared/types').PlayerPublicState[];
  turnElapsed?: number;
  turnStartTime?: number;
}

export interface ShellsReloadedPayload {
  shells: {
    total: number;
    live: number;
    blank: number;
  };
  itemsDistributed: {
    playerId: string;
    items: { id: string; emoji: string; name: string }[];
  }[];
}

export interface PlayerEliminatedPayload {
  playerId: string;
  playerName: string;
  reason: string;
}

export interface RoundEndedPayload {
  winnerId: string;
  roundWins: { playerId: string; wins: number }[];
}

export interface ShellEjectedPayload {
  ejectedShell: 'live' | 'blank';
  playerId: string;
}

export interface PlayerDisconnectedPayload {
  playerId: string;
  playerName: string;
  gracePeriod: number;
}

export interface PlayerReconnectedPayload {
  playerName: string;
}

export interface PlayerItemsPayload {
  targetId: string;
  targetName: string;
  items: { id: string; emoji: string; name: string }[];
}

export interface ReconnectCredentialsPayload {
  roomCode: string;
  playerName: string;
  reconnectToken: string;
}

export interface ReconnectedPayload {
  roomCode: string;
  players: import('../../../../shared/types').PlayerPublicState[];
  currentPlayer: string;
  round: number;
  shells: {
    total: number;
    live: number;
    blank: number;
  };
  yourItems?: { id: string; emoji: string; name: string }[];
}

// Handler interface - all handlers are optional
export interface GameEventHandlers {
  onRoundStarted?: (data: RoundStartedPayload) => void;
  onTurnChanged?: (data: TurnChangedPayload) => void;
  onShotFired?: (data: ShotFiredPayload) => void;
  onItemUsed?: (data: ItemUsedPayload) => void;
  onShellEjected?: (data: ShellEjectedPayload) => void;
  onShellsReloaded?: (data: ShellsReloadedPayload) => void;
  onPlayerEliminated?: (data: PlayerEliminatedPayload) => void;
  onRoundEnded?: (data: RoundEndedPayload) => void;
  onGameOver?: (data: GameOverPayload) => void;
  onPlayerDisconnected?: (data: PlayerDisconnectedPayload) => void;
  onPlayerReconnected?: (data: PlayerReconnectedPayload) => void;
  onPlayerItems?: (data: PlayerItemsPayload) => void;
  onActionError?: (error: string) => void;
  onReconnected?: (data: ReconnectedPayload) => void;
  onReconnectError?: (data: { message: string }) => void;
  onReconnectCredentials?: (data: ReconnectCredentialsPayload) => void;
  onAchievementsUnlocked?: (achievements: AchievementUnlocked[]) => void;
}

/**
 * Hook para gerenciar eventos de jogo via Socket.IO
 * Centraliza todos os listeners de eventos relacionados ao gameplay
 */
export function useGameEvents(handlers: GameEventHandlers) {
  const { socket } = useSocket();

  // Use ref to avoid re-subscribing on every handler change
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    if (!socket) return;

    // Round events
    const handleRoundStarted = (data: RoundStartedPayload) => {
      handlersRef.current.onRoundStarted?.(data);
    };

    const handleTurnChanged = (data: TurnChangedPayload) => {
      handlersRef.current.onTurnChanged?.(data);
    };

    const handleShotFired = (data: ShotFiredPayload) => {
      handlersRef.current.onShotFired?.(data);
    };

    const handleItemUsed = (data: ItemUsedPayload) => {
      handlersRef.current.onItemUsed?.(data);
    };

    const handleShellEjected = (data: ShellEjectedPayload) => {
      handlersRef.current.onShellEjected?.(data);
    };

    const handleShellsReloaded = (data: ShellsReloadedPayload) => {
      handlersRef.current.onShellsReloaded?.(data);
    };

    const handlePlayerEliminated = (data: PlayerEliminatedPayload) => {
      handlersRef.current.onPlayerEliminated?.(data);
    };

    const handleRoundEnded = (data: RoundEndedPayload) => {
      handlersRef.current.onRoundEnded?.(data);
    };

    const handleGameOver = (data: GameOverPayload) => {
      handlersRef.current.onGameOver?.(data);
    };

    // Connection events
    const handlePlayerDisconnected = (data: PlayerDisconnectedPayload) => {
      handlersRef.current.onPlayerDisconnected?.(data);
    };

    const handlePlayerReconnected = (data: PlayerReconnectedPayload) => {
      handlersRef.current.onPlayerReconnected?.(data);
    };

    // Adrenaline item
    const handlePlayerItems = (data: PlayerItemsPayload) => {
      handlersRef.current.onPlayerItems?.(data);
    };

    // Errors
    const handleActionError = (error: string) => {
      handlersRef.current.onActionError?.(error);
    };

    // Reconnection
    const handleReconnected = (data: ReconnectedPayload) => {
      handlersRef.current.onReconnected?.(data);
    };

    const handleReconnectError = (data: { message: string }) => {
      handlersRef.current.onReconnectError?.(data);
    };

    const handleReconnectCredentials = (data: ReconnectCredentialsPayload) => {
      handlersRef.current.onReconnectCredentials?.(data);
    };

    // Achievements
    const handleAchievementsUnlocked = (achievements: AchievementUnlocked[]) => {
      handlersRef.current.onAchievementsUnlocked?.(achievements);
    };

    // Subscribe to all events
    socket.on('roundStarted', handleRoundStarted);
    socket.on('turnChanged', handleTurnChanged);
    socket.on('shotFired', handleShotFired);
    socket.on('itemUsed', handleItemUsed);
    socket.on('shellEjected', handleShellEjected);
    socket.on('shellsReloaded', handleShellsReloaded);
    socket.on('playerEliminated', handlePlayerEliminated);
    socket.on('roundEnded', handleRoundEnded);
    socket.on('gameOver', handleGameOver);
    socket.on('playerDisconnected', handlePlayerDisconnected);
    socket.on('playerReconnected', handlePlayerReconnected);
    socket.on('playerItems', handlePlayerItems);
    socket.on('actionError', handleActionError);
    socket.on('reconnected', handleReconnected);
    socket.on('reconnectError', handleReconnectError);
    socket.on('reconnectCredentials', handleReconnectCredentials);
    socket.on('achievementsUnlocked', handleAchievementsUnlocked);

    // Cleanup
    return () => {
      socket.off('roundStarted', handleRoundStarted);
      socket.off('turnChanged', handleTurnChanged);
      socket.off('shotFired', handleShotFired);
      socket.off('itemUsed', handleItemUsed);
      socket.off('shellEjected', handleShellEjected);
      socket.off('shellsReloaded', handleShellsReloaded);
      socket.off('playerEliminated', handlePlayerEliminated);
      socket.off('roundEnded', handleRoundEnded);
      socket.off('gameOver', handleGameOver);
      socket.off('playerDisconnected', handlePlayerDisconnected);
      socket.off('playerReconnected', handlePlayerReconnected);
      socket.off('playerItems', handlePlayerItems);
      socket.off('actionError', handleActionError);
      socket.off('reconnected', handleReconnected);
      socket.off('reconnectError', handleReconnectError);
      socket.off('reconnectCredentials', handleReconnectCredentials);
      socket.off('achievementsUnlocked', handleAchievementsUnlocked);
    };
  }, [socket]);
}

export default useGameEvents;
