// ==========================================
// SOCKET EVENT TYPES
// ==========================================

import { PlayerPublicState } from './player.types';
import { Item, ItemId, ItemUseResult } from './item.types';
import { ShellInfo, ShellType, TurnDirection } from './game.types';
import { PlayerXpResult, AchievementUnlocked, MatchBadgeAwarded } from './achievement.types';

// ==========================================
// CLIENT -> SERVER EVENTS
// ==========================================

export interface ClientToServerEvents {
  // Room events
  createRoom: (data: CreateRoomPayload) => void;
  joinRoom: (data: JoinRoomPayload) => void;
  leaveRoom: () => void;
  listRooms: () => void;
  startGame: () => void;

  // Game events
  shoot: (data: ShootPayload) => void;
  useItem: (data: UseItemPayload) => void;
  getPlayerItems: (data: GetPlayerItemsPayload) => void;

  // Reconnection
  reconnectToGame: (data: ReconnectPayload) => void;

  // Online count
  requestOnlineCount: () => void;
}

export interface CreateRoomPayload {
  playerName: string;
  password?: string;
}

export interface JoinRoomPayload {
  code: string;
  playerName: string;
  password?: string;
}

export interface ShootPayload {
  targetId: string;
}

export interface UseItemPayload {
  itemId: ItemId;
  targetId?: string;
  itemIndex?: number;
}

export interface GetPlayerItemsPayload {
  targetId: string;
}

export interface ReconnectPayload {
  roomCode: string;
  playerName: string;
  reconnectToken: string;
}

// ==========================================
// SERVER -> CLIENT EVENTS
// ==========================================

export interface ServerToClientEvents {
  // Room events
  roomCreated: (data: RoomCreatedPayload) => void;
  roomJoined: (data: RoomJoinedPayload) => void;
  roomList: (data: RoomInfo[]) => void;
  roomListUpdated: () => void;
  roomDeleted: (data: { code: string }) => void;
  roomUpdated: (data: { code: string }) => void;
  playerJoined: (data: PlayerJoinedPayload) => void;
  playerLeft: (data: PlayerLeftPayload) => void;
  hostChanged: (data: HostChangedPayload) => void;
  joinError: (message: string) => void;
  startError: (message: string) => void;
  leftRoom: () => void;
  alreadyInGame: (data: AlreadyInGamePayload) => void;

  // Game events
  roundStarted: (data: RoundStartedPayload) => void;
  shotFired: (data: ShotFiredPayload) => void;
  itemUsed: (data: ItemUsedPayload) => void;
  turnChanged: (data: TurnChangedPayload) => void;
  turnTimerStarted: (data: TurnTimerStartedPayload) => void;
  turnTimedOut: (data: TurnTimedOutPayload) => void;
  playerSkipped: (data: PlayerSkippedPayload) => void;
  gameOver: (data: GameOverPayload) => void;
  actionError: (message: string) => void;
  playerItems: (data: PlayerItemsPayload) => void;
  shellsReloaded: (data: ShellsReloadedPayload) => void;
  roundEnded: (data: RoundEndedPayload) => void;
  shellEjected: (data: ShellEjectedPayload) => void;

  // Reconnection events
  playerDisconnected: (data: PlayerDisconnectedPayload) => void;
  playerReconnected: (data: PlayerReconnectedPayload) => void;
  playerEliminated: (data: PlayerEliminatedPayload) => void;
  reconnected: (data: ReconnectedPayload) => void;
  reconnectError: (data: ReconnectErrorPayload) => void;
  reconnectCredentials: (data: ReconnectCredentialsPayload) => void;

  // Achievement events
  achievementsUnlocked: (data: AchievementUnlocked[]) => void;

  // Online count
  onlineCount: (data: { total: number; inQueue: number }) => void;
}

// ==========================================
// PAYLOAD TYPES
// ==========================================

export interface RoomInfo {
  code: string;
  hostName: string;
  playerCount: number;
  maxPlayers: number;
  hasPassword: boolean;
}

export interface RoomCreatedPayload {
  code: string;
  players: PlayerPublicState[];
  isHost: boolean;
  hasPassword: boolean;
}

export interface RoomJoinedPayload {
  code: string;
  players: PlayerPublicState[];
  isHost: boolean;
}

export interface PlayerJoinedPayload {
  players: PlayerPublicState[];
  newPlayer: string;
}

export interface PlayerLeftPayload {
  players: PlayerPublicState[];
}

export interface HostChangedPayload {
  newHost: string;
}

export interface AlreadyInGamePayload {
  roomCode: string;
  gameStarted: boolean;
}

export interface RoundStartedPayload {
  round: number;
  maxHp: number;
  players: PlayerPublicState[];
  shells: ShellInfo;
  currentPlayer: string;
  turnDirection: TurnDirection;
  itemsReceived?: Item[];
}

export interface ShotFiredPayload {
  shell: ShellType;
  shooter: string;
  shooterName: string;
  target: string;
  targetName: string;
  damage: number;
  sawedOff: boolean;
  targetSelf: boolean;
  players: PlayerPublicState[];
  shellsRemaining: ShellInfo;
  nextPlayer?: string;
  roundOver: boolean;
  winner?: PlayerPublicState;
  reloaded?: boolean;
  newShells?: ShellInfo;
  skippedPlayer?: string;
  skippedPlayerName?: string;
}

export interface ItemUsedPayload extends ItemUseResult {
  players: PlayerPublicState[];
  shellsRemaining: ShellInfo;
}

export interface TurnChangedPayload {
  currentPlayer: string;
  reason: 'shot' | 'timeout' | 'playerDisconnected' | 'handcuffs' | 'reconnected' | 'elimination';
  players: PlayerPublicState[];
  turnStartTime: number; // Timestamp when turn started (for sync)
}

export interface TurnTimerStartedPayload {
  currentPlayer: string;
  duration: number;
}

export interface TurnTimedOutPayload {
  playerId: string;
  playerName: string;
}

export interface PlayerSkippedPayload {
  playerId: string;
  playerName: string;
  reason: 'handcuffs' | 'disconnected';
}

export interface PlayerGameStats {
  odId: string;
  odUserId?: string;
  guestName?: string;
  roundsWon: number;
  position: number;
  damageDealt: number;
  damageTaken: number;
  selfDamage: number;
  shotsFired: number;
  itemsUsed: number;
  kills: number;
  deaths: number;
}

export type AwardType =
  | 'most_damage'
  | 'most_damage_taken'
  | 'most_passive'
  | 'most_self_damage'
  | 'most_items_used'
  | 'most_kills';

export interface GameAward {
  type: AwardType;
  playerId: string;
  playerName: string;
  value: number;
}

export interface GameOverPayload {
  winner: PlayerPublicState | null;
  reason: string;
  stats?: PlayerGameStats[];
  awards?: GameAward[];
  xpResults?: PlayerXpResult[];
  badges?: MatchBadgeAwarded[];
}

export interface PlayerItemsPayload {
  targetId: string;
  targetName: string;
  items: Item[];
}

export interface PlayerDisconnectedPayload {
  playerId: string;
  playerName: string;
  gracePeriod: number;
  canReconnect: boolean;
}

export interface PlayerReconnectedPayload {
  playerId: string;
  playerName: string;
  newSocketId?: string; // Novo socket ID após reconexão (usado na WaitingRoom)
}

export interface PlayerEliminatedPayload {
  playerId: string;
  playerName: string;
  reason: string;
}

export interface ReconnectedPayload {
  roomCode: string;
  players: PlayerPublicState[];
  currentPlayer: string;
  round: number;
  shells: ShellInfo;
  yourItems: Item[];
  yourHp: number;
}

export interface ReconnectErrorPayload {
  message: string;
}

export interface ReconnectCredentialsPayload {
  roomCode: string;
  playerName: string;
  reconnectToken: string;
}

export interface ShellsReloadedPayload {
  shells: ShellInfo;
  itemsDistributed: { playerId: string; items: Item[] }[];
}

export interface RoundEndedPayload {
  winnerId: string;
  winnerName: string;
  roundNumber: number;
  roundWins: { playerId: string; wins: number }[];
}

export interface ShellEjectedPayload {
  ejectedShell: ShellType;
  playerId: string;
  playerName: string;
}
