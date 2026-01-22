// ==========================================
// GAME TYPES
// ==========================================

export type ShellType = 'live' | 'blank';

export type GameStatus = 'WAITING' | 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED';

export type TurnDirection = 1 | -1; // 1 = horário, -1 = anti-horário

export interface ShellInfo {
  total: number;
  live: number;
  blank: number;
}

export interface RoundConfig {
  roundNumber: number;
  maxHp: number;
  shells: ShellType[];
  shellInfo: ShellInfo;
}

export interface GameState {
  roomCode: string;
  status: GameStatus;
  currentRound: number;
  maxRounds: number;
  turnDirection: TurnDirection;
  currentPlayerIndex: number;
  shells: ShellType[];
  currentShellIndex: number;
  revealedShell: ShellType | null;
  sawActive: boolean;
}

export interface RoundResult {
  roundNumber: number;
  winnerId: string | null;
  winnerName: string | null;
  reason: string;
}

export interface GameResult {
  winnerId: string | null;
  winnerName: string | null;
  reason: string;
  totalRounds: number;
  roundResults: RoundResult[];
}
