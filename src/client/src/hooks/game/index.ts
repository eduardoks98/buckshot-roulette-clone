// ==========================================
// GAME HOOKS - Exports
// ==========================================

export { useGameEvents } from './useGameEvents';
export type {
  GameEventHandlers,
  TurnChangedPayload,
  ShellsReloadedPayload,
  PlayerEliminatedPayload,
  RoundEndedPayload,
  ShellEjectedPayload,
  PlayerDisconnectedPayload,
  PlayerReconnectedPayload,
  PlayerItemsPayload,
  ReconnectCredentialsPayload,
  ReconnectedPayload,
} from './useGameEvents';

export { useGameActions } from './useGameActions';
export type { UseGameActionsOptions, UseGameActionsReturn } from './useGameActions';
