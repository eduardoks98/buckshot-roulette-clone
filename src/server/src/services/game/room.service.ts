// ==========================================
// ROOM SERVICE
// ==========================================

import {
  PlayerPublicState,
  RoomInfo,
  ReconnectedPayload,
  Item,
} from '../../../../shared/types';
import { GAME_RULES } from '../../../../shared/constants';

// ==========================================
// TYPES
// ==========================================

interface Room {
  code: string;
  host: string;
  hostName: string;
  password: string | null;
  players: Player[];
  started: boolean;
  currentRound: number;
  turnDirection: 1 | -1;
  currentPlayerIndex: number;
  shells: ('live' | 'blank')[];
  currentShellIndex: number;
  revealedShell: 'live' | 'blank' | null;
  turnTimeout: NodeJS.Timeout | null;
  turnStartTime: number | null;
  firstToDie: number | null;
}

interface PlayerStats {
  damageDealt: number;
  damageTaken: number;
  selfDamage: number;
  shotsFired: number;
  itemsUsed: number;
  kills: number;
  deaths: number;

  // Extended tracking for achievements/badges
  sawedShots: number;
  liveHits: number;
  expiredMedicineSurvived: number;
  adrenalineUses: number;
  handcuffUses: number;
  infoItemUses: number;
  itemsUsedBitmask: number;         // Bitmask of unique items used (10 items = 10 bits)
  firstBloodInGame: boolean;        // Was this player the first killer in the game?
  turnsAt1Hp: number;               // Consecutive turns at 1 HP (current streak)
  maxConsecutiveTurnsAt1Hp: number; // Best streak of consecutive turns at 1 HP
  killsPerRound: number[];          // Kills per round [round1, round2, round3]
  roundsSurvivedAsLast: number;     // Rounds where player was last alive
  wonRoundWithZeroShots: boolean;   // Won a round without firing
  wonRoundWithZeroItems: boolean;   // Won a round without using items
  finalHp: number;                  // HP at end of game
  uniqueItemsUsedInGame: number;    // Count of distinct item types used in game
  adrenalineUsesInGame: number;     // Adrenaline uses this game (for badge)
  expiredMedicineSurvivedInGame: number; // Expired medicine survived this game
  liveHitsInGame: number;           // Live shell hits this game
  allShotsLiveInGame: boolean;      // Whether all shots fired were live hits
  lostEarlyRounds: boolean;         // Lost rounds before winning the game
  shotsInCurrentRound: number;      // Shots fired in current round (resets per round)
  itemsInCurrentRound: number;      // Items used in current round (resets per round)
  killsInCurrentRound: number;      // Kills in current round (resets per round)
}

export interface Player {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  items: Item[];
  handcuffed: boolean;
  handcuffImmune: boolean;
  sawedOff: boolean;
  alive: boolean;
  hadZeroItems: boolean;
  roundWins: number;
  disconnected: boolean;
  disconnectTime: number | null;
  reconnectToken: string | null;
  originalSocketId: string | null;
  stats: PlayerStats;
}

// ==========================================
// ROOM SERVICE CLASS
// ==========================================

export class RoomService {
  private rooms: Map<string, Room> = new Map();

  // Callbacks para comunicação com handlers
  onGameCancelled?: (roomCode: string) => void;
  onPlayerWonByDefault?: (roomCode: string, player: Player) => void;
  onPlayerEliminated?: (roomCode: string, player: Player) => void;
  onRoomDeleted?: (roomCode: string) => void;

  // ==========================================
  // HELPERS
  // ==========================================

  private generateRoomCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  private generateReconnectToken(): string {
    return Math.random().toString(36).substring(2, 15) +
           Math.random().toString(36).substring(2, 15);
  }

  private createPlayer(socketId: string, name: string): Player {
    return {
      id: socketId,
      name,
      hp: 0,
      maxHp: 0,
      items: [],
      handcuffed: false,
      handcuffImmune: false,
      sawedOff: false,
      alive: true,
      hadZeroItems: false,
      roundWins: 0,
      disconnected: false,
      disconnectTime: null,
      reconnectToken: null,
      originalSocketId: null,
      stats: {
        damageDealt: 0,
        damageTaken: 0,
        selfDamage: 0,
        shotsFired: 0,
        itemsUsed: 0,
        kills: 0,
        deaths: 0,
        // Extended tracking
        sawedShots: 0,
        liveHits: 0,
        expiredMedicineSurvived: 0,
        adrenalineUses: 0,
        handcuffUses: 0,
        infoItemUses: 0,
        itemsUsedBitmask: 0,
        firstBloodInGame: false,
        turnsAt1Hp: 0,
        maxConsecutiveTurnsAt1Hp: 0,
        killsPerRound: [],
        roundsSurvivedAsLast: 0,
        wonRoundWithZeroShots: false,
        wonRoundWithZeroItems: false,
        finalHp: 0,
        uniqueItemsUsedInGame: 0,
        adrenalineUsesInGame: 0,
        expiredMedicineSurvivedInGame: 0,
        liveHitsInGame: 0,
        allShotsLiveInGame: true,
        lostEarlyRounds: false,
        shotsInCurrentRound: 0,
        itemsInCurrentRound: 0,
        killsInCurrentRound: 0,
      },
    };
  }

  private toPublicPlayer(player: Player): PlayerPublicState {
    return {
      id: player.id,
      name: player.name,
      hp: player.hp,
      maxHp: player.maxHp,
      items: player.items,
      alive: player.alive,
      handcuffed: player.handcuffed,
      handcuffImmune: player.handcuffImmune,
      sawedOff: player.sawedOff,
      disconnected: player.disconnected,
      roundWins: player.roundWins,
    };
  }

  private findRoomByPlayer(playerId: string): { code: string; room: Room } | null {
    for (const [code, room] of this.rooms) {
      if (room.players.find(p => p.id === playerId)) {
        return { code, room };
      }
    }
    return null;
  }

  // ==========================================
  // PUBLIC METHODS
  // ==========================================

  createRoom(
    hostSocketId: string,
    hostName: string,
    password?: string
  ): { room: Room; players: PlayerPublicState[] } {
    let code = this.generateRoomCode();
    while (this.rooms.has(code)) {
      code = this.generateRoomCode();
    }

    const room: Room = {
      code,
      host: hostSocketId,
      hostName,
      password: password || null,
      players: [this.createPlayer(hostSocketId, hostName)],
      started: false,
      currentRound: 1,
      turnDirection: 1,
      currentPlayerIndex: 0,
      shells: [],
      currentShellIndex: 0,
      revealedShell: null,
      turnTimeout: null,
      turnStartTime: null,
      firstToDie: null,
    };

    this.rooms.set(code, room);

    return {
      room,
      players: room.players.map(p => this.toPublicPlayer(p)),
    };
  }

  joinRoom(
    code: string,
    socketId: string,
    playerName: string,
    password?: string
  ): { room: Room; players: PlayerPublicState[] } | { error: string } {
    const room = this.rooms.get(code);

    if (!room) return { error: 'Sala não encontrada' };
    if (room.started) return { error: 'Jogo já iniciado' };
    if (room.players.length >= GAME_RULES.MAX_PLAYERS) {
      return { error: `Sala cheia (máx. ${GAME_RULES.MAX_PLAYERS} jogadores)` };
    }
    if (room.players.find(p => p.id === socketId)) {
      return { error: 'Já está na sala' };
    }
    if (room.password && room.password !== password) {
      return { error: 'Senha incorreta' };
    }

    room.players.push(this.createPlayer(socketId, playerName));

    return {
      room,
      players: room.players.map(p => this.toPublicPlayer(p)),
    };
  }

  leaveRoom(socketId: string): {
    code: string;
    room: Room;
    players: PlayerPublicState[];
    deleted: boolean;
  } | null {
    const found = this.findRoomByPlayer(socketId);
    if (!found) return null;

    const { code, room } = found;
    const playerIndex = room.players.findIndex(p => p.id === socketId);

    if (playerIndex === -1) return null;

    room.players.splice(playerIndex, 1);

    // Transferir host se necessário
    if (room.host === socketId) {
      if (room.players.length > 0) {
        room.host = room.players[0].id;
      } else {
        this.rooms.delete(code);
        return { code, room, players: [], deleted: true };
      }
    }

    return {
      code,
      room,
      players: room.players.map(p => this.toPublicPlayer(p)),
      deleted: false,
    };
  }

  listAvailableRooms(): RoomInfo[] {
    const availableRooms: RoomInfo[] = [];

    for (const [code, room] of this.rooms) {
      if (!room.started) {
        availableRooms.push({
          code,
          hostName: room.hostName,
          playerCount: room.players.length,
          maxPlayers: GAME_RULES.MAX_PLAYERS,
          hasPassword: !!room.password,
        });
      }
    }

    return availableRooms;
  }

  startGame(hostSocketId: string): { room: Room } | { error: string } {
    const found = this.findRoomByPlayer(hostSocketId);
    if (!found) return { error: 'Sala não encontrada' };

    const { room } = found;

    if (room.host !== hostSocketId) {
      return { error: 'Apenas o host pode iniciar o jogo' };
    }

    if (room.players.length < GAME_RULES.MIN_PLAYERS) {
      return { error: `Mínimo de ${GAME_RULES.MIN_PLAYERS} jogadores` };
    }

    room.started = true;
    room.currentRound = 1;
    room.turnDirection = 1;
    // Escolher jogador inicial aleatório (não sempre o host)
    room.currentPlayerIndex = Math.floor(Math.random() * room.players.length);

    // Gerar tokens de reconexão para todos os jogadores
    room.players.forEach(player => {
      player.reconnectToken = this.generateReconnectToken();
      player.originalSocketId = player.id;
    });

    return { room };
  }

  handleDisconnect(socketId: string): {
    code: string;
    room: Room;
    players: PlayerPublicState[];
    deleted: boolean;
    gameInProgress: boolean;
    playerName: string;
    newHost?: string;
  } | null {
    const found = this.findRoomByPlayer(socketId);
    if (!found) return null;

    const { code, room } = found;
    const player = room.players.find(p => p.id === socketId);
    if (!player) return null;

    const playerName = player.name;
    let newHost: string | undefined;

    // Se jogo não começou, remover jogador normalmente
    if (!room.started) {
      const result = this.leaveRoom(socketId);
      if (!result) return null;

      if (room.host !== socketId && room.players.length > 0) {
        // Host não mudou
      } else if (room.players.length > 0) {
        newHost = room.players[0].name;
      }

      return {
        code,
        room,
        players: result.players,
        deleted: result.deleted,
        gameInProgress: false,
        playerName,
        newHost,
      };
    }

    // Jogo em andamento - marcar como desconectado
    player.disconnected = true;
    player.disconnectTime = Date.now();
    // Token já foi gerado em startGame() - NÃO regenerar para manter consistência com cliente
    player.originalSocketId = socketId;

    // Agendar eliminação após grace period
    setTimeout(() => {
      this.checkReconnectTimeout(code, player.originalSocketId!);
    }, GAME_RULES.TIMERS.RECONNECT_GRACE_MS);

    return {
      code,
      room,
      players: room.players.map(p => this.toPublicPlayer(p)),
      deleted: false,
      gameInProgress: true,
      playerName,
    };
  }

  private checkReconnectTimeout(roomCode: string, originalSocketId: string): void {
    const room = this.rooms.get(roomCode);
    if (!room) return;

    const player = room.players.find(p => p.originalSocketId === originalSocketId);
    if (!player || !player.disconnected) return;

    // Jogador não reconectou - eliminar
    player.alive = false;
    player.disconnected = false;

    console.log(`[Room] Jogador ${player.name} eliminado por timeout de reconexão`);

    // Verificar se TODOS jogadores estão mortos ou desconectados
    const allDeadOrDisconnected = room.players.every(p => !p.alive || p.disconnected);
    if (allDeadOrDisconnected) {
      // CANCELAR jogo - ninguém ganhou
      console.log(`[Room] Todos jogadores abandonaram - cancelando jogo ${roomCode}`);
      this.onGameCancelled?.(roomCode);
      this.rooms.delete(roomCode);
      return;
    }

    // Verificar se sobrou apenas 1 jogador vivo e conectado
    const alivePlayers = room.players.filter(p => p.alive && !p.disconnected);
    if (alivePlayers.length === 1) {
      // Único jogador restante vence
      console.log(`[Room] ${alivePlayers[0].name} venceu por WO na sala ${roomCode}`);
      this.onPlayerWonByDefault?.(roomCode, alivePlayers[0]);
      this.rooms.delete(roomCode);
      return;
    }

    // Emitir evento de eliminação
    this.onPlayerEliminated?.(roomCode, player);
  }

  reconnectPlayer(
    roomCode: string,
    newSocketId: string,
    playerName: string,
    reconnectToken: string
  ): { gameState: ReconnectedPayload } | { error: string } {
    const room = this.rooms.get(roomCode);
    if (!room) return { error: 'Sala não encontrada' };

    const player = room.players.find(
      p => p.disconnected && p.name === playerName && p.reconnectToken === reconnectToken
    );

    if (!player) return { error: 'Sessão expirada ou inválida' };

    // Restaurar jogador
    player.id = newSocketId;
    player.disconnected = false;
    player.disconnectTime = null;
    // Gerar novo token para possível reconexão futura
    player.reconnectToken = this.generateReconnectToken();

    const shellsRemaining = room.shells.length - room.currentShellIndex;

    return {
      gameState: {
        roomCode: room.code,
        players: room.players.map(p => this.toPublicPlayer(p)),
        currentPlayer: room.players[room.currentPlayerIndex]?.id || '',
        round: room.currentRound,
        shells: {
          total: shellsRemaining,
          live: room.shells.slice(room.currentShellIndex).filter(s => s === 'live').length,
          blank: room.shells.slice(room.currentShellIndex).filter(s => s === 'blank').length,
        },
        yourItems: player.items,
        yourHp: player.hp,
      },
    };
  }

  // ==========================================
  // GETTERS
  // ==========================================

  getRoom(code: string): Room | undefined {
    return this.rooms.get(code);
  }

  getRoomByPlayer(playerId: string): { code: string; room: Room } | null {
    return this.findRoomByPlayer(playerId);
  }
}
