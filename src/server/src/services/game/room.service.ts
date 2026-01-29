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

export interface Room {
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
  initialShellCount: number;  // Total shells at start of current round (for cylinder display)
  revealedShell: 'live' | 'blank' | null;
  turnTimeout: NodeJS.Timeout | null;
  turnStartTime: number | null;
  firstToDie: number | null;
  // Grace period timer for empty waiting rooms (60s before deletion)
  emptyRoomTimeout: NodeJS.Timeout | null;
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
  odUserId: string | null; // ID do usuário autenticado (para validar múltiplas abas)
  abandoned: boolean; // true se jogador abandonou a partida permanentemente
  stats: PlayerStats;
}

// ==========================================
// ROOM SERVICE CLASS
// ==========================================

export class RoomService {
  private rooms: Map<string, Room> = new Map();
  // Rematch tracking: previousRoomCode -> newRoomCode
  private rematchRooms: Map<string, string> = new Map();

  // Callbacks para comunicação com handlers
  onGameCancelled?: (roomCode: string, playerIds: string[]) => void;
  onPlayerWonByDefault?: (roomCode: string, player: Player, room: Room) => void;
  onPlayerEliminated?: (roomCode: string, player: Player) => void;
  onRoomDeleted?: (roomCode: string) => void; // Called when room is deleted after grace period
  onPlayerLeft?: (roomCode: string, players: PlayerPublicState[]) => void; // Called when player leaves/timeout in WaitingRoom
  onHostChanged?: (roomCode: string, newHostName: string) => void; // Called when host changes
  onPlayerDisconnected?: (roomCode: string, playerId: string, playerName: string) => void; // Called when player temporarily disconnects
  onPlayerReconnected?: (roomCode: string, playerId: string, newSocketId: string, playerName: string) => void; // Called when player reconnects

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

  private createPlayer(socketId: string, name: string, odUserId?: string): Player {
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
      odUserId: odUserId || null,
      abandoned: false,
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

  // Busca sala onde um usuário autenticado (por odUserId) está jogando
  private findRoomByUserId(userId: string): { code: string; room: Room; player: Player } | null {
    for (const [code, room] of this.rooms) {
      const player = room.players.find(p => p.odUserId === userId);
      if (player) {
        return { code, room, player };
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
    password?: string,
    odUserId?: string
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
      players: [this.createPlayer(hostSocketId, hostName, odUserId)],
      started: false,
      currentRound: 1,
      turnDirection: 1,
      currentPlayerIndex: 0,
      shells: [],
      currentShellIndex: 0,
      initialShellCount: 0,
      revealedShell: null,
      turnTimeout: null,
      turnStartTime: null,
      firstToDie: null,
      emptyRoomTimeout: null,
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
    password?: string,
    odUserId?: string
  ): { room: Room; players: PlayerPublicState[]; isReconnect?: boolean } | { error: string } {
    const room = this.rooms.get(code);

    if (!room) return { error: 'Sala não encontrada' };
    if (room.started) return { error: 'Jogo já iniciado' };

    // Verificar se é reconexão (jogador desconectado voltando)
    const disconnectedPlayer = room.players.find(
      p => p.disconnected && p.name === playerName
    );

    if (disconnectedPlayer) {
      // Reconexão - restaurar jogador
      const oldSocketId = disconnectedPlayer.id;
      disconnectedPlayer.id = socketId;
      disconnectedPlayer.disconnected = false;
      disconnectedPlayer.disconnectTime = null;
      // Manter originalSocketId para o timeout check poder ignorar

      // Se era o host, atualizar room.host para o novo socket.id
      if (room.host === oldSocketId) {
        room.host = socketId;
        console.log(`[Room] Host ${playerName} reconectou - atualizando room.host para ${socketId}`);
      }

      console.log(`[Room] ${playerName} reconectou à sala ${code}`);

      // Emitir evento de reconexão
      this.onPlayerReconnected?.(code, oldSocketId, socketId, playerName);

      return {
        room,
        players: room.players.map(p => this.toPublicPlayer(p)),
        isReconnect: true,
      };
    }

    // Verificar se sala está cheia (contando apenas jogadores NÃO-desconectados como ocupando vagas)
    const activePlayersCount = room.players.filter(p => !p.disconnected).length;
    if (activePlayersCount >= GAME_RULES.MAX_PLAYERS) {
      return { error: `Sala cheia (máx. ${GAME_RULES.MAX_PLAYERS} jogadores)` };
    }

    if (room.players.find(p => p.id === socketId)) {
      return { error: 'Já está na sala' };
    }
    if (room.password && room.password !== password) {
      return { error: 'Senha incorreta' };
    }

    // Cancelar grace period se existir (alguém entrou na sala vazia)
    if (room.emptyRoomTimeout) {
      console.log(`[Room] Jogador entrou na sala ${code} - cancelando grace period`);
      clearTimeout(room.emptyRoomTimeout);
      room.emptyRoomTimeout = null;
    }

    room.players.push(this.createPlayer(socketId, playerName, odUserId));

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
    gracePeriodStarted: boolean;
    playerName?: string;
    gameInProgress?: boolean;
    winner?: Player;
  } | null {
    const found = this.findRoomByPlayer(socketId);
    if (!found) return null;

    const { code, room } = found;
    const player = room.players.find(p => p.id === socketId);

    if (!player) return null;

    const playerName = player.name;

    // Se jogo está em andamento, tratar como desistência
    if (room.started) {
      console.log(`[Room] ${playerName} desistiu da partida em ${code}`);

      // Marcar jogador como morto (desistiu)
      player.alive = false;
      player.disconnected = false;

      // Verificar se TODOS jogadores estão mortos
      const alivePlayers = room.players.filter(p => p.alive);

      if (alivePlayers.length === 0) {
        // Todos desistiram - cancelar jogo
        console.log(`[Room] Todos jogadores abandonaram - cancelando jogo ${code}`);
        this.onGameCancelled?.(code, room.players.map(p => p.id));
        this.rooms.delete(code);
        return { code, room, players: [], deleted: true, gracePeriodStarted: false, playerName, gameInProgress: true };
      }

      if (alivePlayers.length === 1) {
        // Sobrou 1 jogador - ele vence!
        const winner = alivePlayers[0];
        console.log(`[Room] ${winner.name} venceu por WO (${playerName} desistiu) na sala ${code}`);
        this.onPlayerWonByDefault?.(code, winner, room);
        this.rooms.delete(code);
        return { code, room, players: room.players.map(p => this.toPublicPlayer(p)), deleted: true, gracePeriodStarted: false, playerName, gameInProgress: true, winner };
      }

      // Ainda tem mais de 1 jogador vivo - continuar jogo
      // Emitir evento de eliminação para o jogador que desistiu
      this.onPlayerEliminated?.(code, player);

      return {
        code,
        room,
        players: room.players.map(p => this.toPublicPlayer(p)),
        deleted: false,
        gracePeriodStarted: false,
        playerName,
        gameInProgress: true,
      };
    }

    // Jogo não começou (WaitingRoom) - remover jogador normalmente
    const playerIndex = room.players.findIndex(p => p.id === socketId);
    room.players.splice(playerIndex, 1);

    // Se não há mais jogadores
    if (room.players.length === 0) {
      // Waiting room vazia - deletar em 5s (evita DDoS de criação de salas)
      console.log(`[Room] Sala ${code} está vazia - deletando em 5s`);
      room.emptyRoomTimeout = setTimeout(() => {
        // Verificar se a sala ainda existe e está vazia
        const currentRoom = this.rooms.get(code);
        if (currentRoom && currentRoom.players.length === 0) {
          console.log(`[Room] Deletando sala vazia ${code}`);
          this.rooms.delete(code);
          this.onRoomDeleted?.(code);
        }
      }, 5000); // 5 segundos - evita spam de salas

      return { code, room, players: [], deleted: false, gracePeriodStarted: true, playerName };
    }

    // Transferir host se necessário
    if (room.host === socketId) {
      room.host = room.players[0].id;
      room.hostName = room.players[0].name;
    }

    return {
      code,
      room,
      players: room.players.map(p => this.toPublicPlayer(p)),
      deleted: false,
      gracePeriodStarted: false,
      playerName,
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
    playerDisconnected?: boolean; // true se desconexão temporária (grace period)
  } | null {
    const found = this.findRoomByPlayer(socketId);
    console.log(`[RoomService] handleDisconnect - socketId: ${socketId}, found:`, found ? { code: found.code, started: found.room.started, playersCount: found.room.players.length } : null);
    if (!found) return null;

    const { code, room } = found;
    const player = room.players.find(p => p.id === socketId);
    console.log(`[RoomService] handleDisconnect - player:`, player ? { name: player.name, id: player.id } : null);
    console.log(`[RoomService] handleDisconnect - all players:`, room.players.map(p => ({ id: p.id, name: p.name })));
    if (!player) return null;

    const playerName = player.name;
    let newHost: string | undefined;

    console.log(`[RoomService] handleDisconnect - room.started: ${room.started}`);

    // Se jogo não começou (WaitingRoom), usar grace period de 10s
    if (!room.started) {
      // Marcar jogador como desconectado (vaga reservada por 10s)
      player.disconnected = true;
      player.disconnectTime = Date.now();
      player.originalSocketId = socketId;

      console.log(`[Room] ${playerName} desconectou da WaitingRoom - vaga reservada por 10s`);

      // Emitir evento de desconexão temporária
      this.onPlayerDisconnected?.(code, socketId, playerName);

      // Grace period de 10s para reconexão na WaitingRoom
      const WAITING_ROOM_GRACE_MS = 10000;
      setTimeout(() => {
        this.checkWaitingRoomReconnect(code, socketId);
      }, WAITING_ROOM_GRACE_MS);

      return {
        code,
        room,
        players: room.players.map(p => this.toPublicPlayer(p)),
        deleted: false,
        gameInProgress: false,
        playerName,
        playerDisconnected: true, // Indica desconexão temporária (não remoção)
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
      this.onGameCancelled?.(roomCode, room.players.map(p => p.id));
      this.rooms.delete(roomCode);
      return;
    }

    // Verificar se sobrou apenas 1 jogador vivo e conectado
    const alivePlayers = room.players.filter(p => p.alive && !p.disconnected);
    if (alivePlayers.length === 1) {
      // Único jogador restante vence
      console.log(`[Room] ${alivePlayers[0].name} venceu por WO na sala ${roomCode}`);
      this.onPlayerWonByDefault?.(roomCode, alivePlayers[0], room);
      this.rooms.delete(roomCode);
      return;
    }

    // Emitir evento de eliminação
    this.onPlayerEliminated?.(roomCode, player);
  }

  // Check if player reconnected to WaitingRoom within grace period
  private checkWaitingRoomReconnect(roomCode: string, originalSocketId: string): void {
    const room = this.rooms.get(roomCode);
    if (!room) return;

    // Encontrar jogador pelo originalSocketId
    const player = room.players.find(p => p.originalSocketId === originalSocketId);
    if (!player || !player.disconnected) {
      // Jogador já reconectou ou foi removido
      console.log(`[Room] Grace period expirou mas jogador já reconectou ou foi removido`);
      return;
    }

    // Não reconectou em 10s - remover da sala
    console.log(`[Room] ${player.name} não reconectou em 10s - removendo da sala ${roomCode}`);

    // Guardar info antes de remover
    const wasHost = room.host === originalSocketId;

    // Remover jogador da lista
    room.players = room.players.filter(p => p.originalSocketId !== originalSocketId);

    // Se era host e ainda tem jogadores, passar para o próximo
    if (wasHost && room.players.length > 0) {
      room.host = room.players[0].id;
      room.hostName = room.players[0].name;
      console.log(`[Room] Novo host: ${room.players[0].name}`);
      this.onHostChanged?.(roomCode, room.players[0].name);
    }

    // Se sala ficou vazia, deletar em 5s (evita DDoS)
    if (room.players.length === 0) {
      console.log(`[Room] Sala ${roomCode} está vazia - deletando em 5s`);
      room.emptyRoomTimeout = setTimeout(() => {
        if (this.rooms.has(roomCode)) {
          console.log(`[Room] Deletando sala vazia ${roomCode}`);
          this.rooms.delete(roomCode);
          this.onRoomDeleted?.(roomCode);
        }
      }, 5000); // 5 segundos
    } else {
      // Notificar que jogador saiu definitivamente
      this.onPlayerLeft?.(roomCode, room.players.map(p => this.toPublicPlayer(p)));
    }
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
        // CRÍTICO: Enviar tempo decorrido do turno para sincronizar timer
        turnElapsed: room.turnStartTime ? Date.now() - room.turnStartTime : 0,
      },
    };
  }

  // ==========================================
  // REJOIN BY USER ID (Backend-first approach)
  // ==========================================
  rejoinByUserId(
    roomCode: string,
    newSocketId: string,
    odUserId: string
  ): { gameState?: ReconnectedPayload; gameStarted: boolean; playerName: string } | { error: string } {
    const room = this.rooms.get(roomCode);
    if (!room) return { error: 'Sala não encontrada' };

    // Encontrar jogador pelo odUserId
    const player = room.players.find(p => p.odUserId === odUserId);
    if (!player) return { error: 'Você não está nesta sala' };

    // Atualizar socket ID
    const oldSocketId = player.id;
    player.id = newSocketId;
    player.disconnected = false;
    player.disconnectTime = null;
    // Gerar novo token para possível reconexão futura
    player.reconnectToken = this.generateReconnectToken();

    // Atualizar host se necessário
    if (room.host === oldSocketId) {
      room.host = newSocketId;
      console.log(`[Room] Host ${player.name} reconectou - atualizando room.host para ${newSocketId}`);
    }

    if (room.started) {
      // Jogo em andamento - retornar estado completo
      const shellsRemaining = room.shells.length - room.currentShellIndex;

      return {
        gameStarted: true,
        playerName: player.name,
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
          // CRÍTICO: Enviar tempo decorrido do turno para sincronizar timer
          turnElapsed: room.turnStartTime ? Date.now() - room.turnStartTime : 0,
        },
      };
    } else {
      // WaitingRoom - sem gameState
      return {
        gameStarted: false,
        playerName: player.name,
      };
    }
  }

  // ==========================================
  // REMOVE PLAYER BY USER ID (Abandon game)
  // ==========================================
  removePlayerByUserId(
    roomCode: string,
    odUserId: string
  ): { deleted: boolean; players: PlayerPublicState[] } | null {
    const room = this.rooms.get(roomCode);
    if (!room) return null;

    // Encontrar jogador pelo odUserId
    const playerIndex = room.players.findIndex(p => p.odUserId === odUserId);
    if (playerIndex === -1) return null;

    const player = room.players[playerIndex];
    const playerName = player.name;

    // Se jogo em andamento, marcar como morto ao invés de remover
    if (room.started) {
      player.alive = false;
      player.disconnected = true;
      player.abandoned = true; // Abandonou permanentemente - não ressuscitar em novos rounds

      // Verificar se sobrou apenas 1 jogador vivo
      const alivePlayers = room.players.filter(p => p.alive);
      if (alivePlayers.length === 1) {
        // Vitória por WO
        const winner = alivePlayers[0];
        this.onPlayerWonByDefault?.(roomCode, winner, room);
        this.rooms.delete(roomCode);
        return { deleted: true, players: [] };
      }

      // Se era a vez do jogador que abandonou, passar para o próximo
      if (room.currentPlayerIndex === playerIndex) {
        this.advanceToNextPlayer(room);
      }

      console.log(`[Room] ${playerName} abandonou partida em andamento`);
      return { deleted: false, players: room.players.map(p => this.toPublicPlayer(p)) };
    } else {
      // WaitingRoom - remover jogador
      room.players.splice(playerIndex, 1);

      // Se não sobrou ninguém, deletar sala
      if (room.players.length === 0) {
        this.rooms.delete(roomCode);
        console.log(`[Room] Sala ${roomCode} deletada - último jogador abandonou`);
        return { deleted: true, players: [] };
      }

      // Atualizar host se necessário
      if (room.host === player.id) {
        room.host = room.players[0].id;
        this.onHostChanged?.(roomCode, room.players[0].name);
      }

      console.log(`[Room] ${playerName} abandonou WaitingRoom ${roomCode}`);
      return { deleted: false, players: room.players.map(p => this.toPublicPlayer(p)) };
    }
  }

  // Helper para avançar para próximo jogador
  private advanceToNextPlayer(room: Room): void {
    const alivePlayers = room.players.filter(p => p.alive && !p.disconnected && !p.abandoned);
    if (alivePlayers.length === 0) return;

    // Encontrar próximo jogador vivo
    let nextIndex = room.currentPlayerIndex;
    do {
      nextIndex = (nextIndex + room.turnDirection + room.players.length) % room.players.length;
    } while (!room.players[nextIndex].alive || room.players[nextIndex].disconnected);

    room.currentPlayerIndex = nextIndex;
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

  getRoomByUserId(userId: string): { code: string; room: Room; player: Player } | null {
    return this.findRoomByUserId(userId);
  }

  // ==========================================
  // REMATCH METHODS
  // ==========================================

  /**
   * Check if a rematch room already exists for a previous game
   */
  getRematchRoom(previousRoomCode: string): string | null {
    const newCode = this.rematchRooms.get(previousRoomCode);
    if (newCode && this.rooms.has(newCode)) {
      const room = this.rooms.get(newCode);
      // Only return if room exists and game hasn't started yet
      if (room && !room.started) {
        return newCode;
      }
    }
    // Clean up stale entry
    this.rematchRooms.delete(previousRoomCode);
    return null;
  }

  /**
   * Register a new rematch room for a previous game
   */
  setRematchRoom(previousRoomCode: string, newRoomCode: string): void {
    // Clear any old mapping
    this.rematchRooms.delete(previousRoomCode);
    this.rematchRooms.set(previousRoomCode, newRoomCode);

    // Auto-cleanup after 5 minutes
    setTimeout(() => {
      if (this.rematchRooms.get(previousRoomCode) === newRoomCode) {
        this.rematchRooms.delete(previousRoomCode);
      }
    }, 5 * 60 * 1000);
  }

  /**
   * Clear rematch mapping when done
   */
  clearRematchRoom(previousRoomCode: string): void {
    this.rematchRooms.delete(previousRoomCode);
  }

  /**
   * Delete a room (used after game over)
   */
  deleteRoom(code: string): boolean {
    const room = this.rooms.get(code);
    if (!room) {
      return false;
    }

    // Clear any pending timeouts
    if (room.turnTimeout) {
      clearTimeout(room.turnTimeout);
      room.turnTimeout = null;
    }
    if (room.emptyRoomTimeout) {
      clearTimeout(room.emptyRoomTimeout);
      room.emptyRoomTimeout = null;
    }

    // Delete the room
    this.rooms.delete(code);
    console.log(`[Room] Sala ${code} deletada após game over`);

    return true;
  }
}
