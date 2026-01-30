// ==========================================
// HOOKS - Central exports
// ==========================================

// Existing hooks
export { useOnlineCount } from "./useOnlineCount";

// Game hooks
export {
  useGameEvents,
  useGameActions,
} from './game';
export type {
  GameEventHandlers,
  TurnChangedPayload,
  ShellsReloadedPayload,
  PlayerEliminatedPayload,
  RoundEndedPayload,
  ShellEjectedPayload,
  PlayerDisconnectedPayload as GamePlayerDisconnectedPayload,
  PlayerReconnectedPayload as GamePlayerReconnectedPayload,
  PlayerItemsPayload,
  ReconnectCredentialsPayload,
  ReconnectedPayload,
  UseGameActionsOptions,
  UseGameActionsReturn,
} from './game';

// Multiplayer hooks
export {
  useLobbyEvents,
  useLobbyActions,
  useRoomEvents,
  useRoomActions,
} from './multiplayer';
export type {
  RoomInfo,
  RoomCreatedPayload,
  RoomJoinedPayload,
  AlreadyInGamePayload,
  ReconnectedToRoomPayload,
  LobbyEventHandlers,
  UseLobbyActionsReturn,
  PlayerJoinedPayload,
  PlayerLeftPayload,
  PlayerDisconnectedPayload as RoomPlayerDisconnectedPayload,
  PlayerReconnectedPayload as RoomPlayerReconnectedPayload,
  HostChangedPayload,
  BotErrorPayload,
  RoomEventHandlers,
  UseRoomActionsReturn,
} from './multiplayer';

// Utility hooks
export { useRequireAuth } from './useRequireAuth';
export type { UseRequireAuthOptions } from './useRequireAuth';

export { useAutoConnect } from './useAutoConnect';

export { useAutoCloseMessage } from './useAutoCloseMessage';
export type { UseAutoCloseMessageOptions, UseAutoCloseMessageReturn } from './useAutoCloseMessage';

export { useGameSession } from './useGameSession';
export type { GameSession, ReconnectData, UseGameSessionReturn } from './useGameSession';

export { useSingleTab } from './useSingleTab';
