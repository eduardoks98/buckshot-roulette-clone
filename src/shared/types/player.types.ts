// ==========================================
// PLAYER TYPES
// ==========================================

import { Item } from './item.types';

export interface PlayerBase {
  id: string;
  name: string;
}

export interface PlayerState extends PlayerBase {
  hp: number;
  maxHp: number;
  items: Item[];
  alive: boolean;
  handcuffed: boolean;
  handcuffImmune: boolean;
  sawedOff: boolean;
  hadZeroItems: boolean;
  roundWins: number;
  // Reconexão
  disconnected: boolean;
  disconnectTime: number | null;
  reconnectToken: string | null;
  originalSocketId: string | null;
}

export interface PlayerPublicState {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  items: Item[];
  alive: boolean;
  handcuffed: boolean;
  handcuffImmune: boolean;
  sawedOff: boolean;
  disconnected: boolean;
  roundWins: number;
}

export interface PlayerStats {
  gamesPlayed: number;
  gamesWon: number;
  roundsPlayed: number;
  roundsWon: number;
  totalKills: number;
  totalDeaths: number;
  eloRating: number;
  rank: string;
}

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  stats: PlayerStats;
  createdAt: Date;
}
