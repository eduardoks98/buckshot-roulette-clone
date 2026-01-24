// ==========================================
// ROOM SOCKET HANDLERS
// ==========================================

import { TypedIOServer, TypedSocket, socketUserMap } from '../socket';
import { RoomService, Player } from '../services/game/room.service';
import { GameService } from '../services/game/game.service';
import { gamePersistenceService } from '../services/game/game.persistence.service';
import { startTurnTimer, RoomWithTimer, calculateAwards } from './game.handler';
import { Item, PlayerPublicState } from '../../../shared/types';

const gameService = new GameService();

// Helper to convert Player to PlayerPublicState
function toPublicPlayer(player: Player): PlayerPublicState {
  return {
    id: player.id,
    name: player.name,
    hp: player.hp,
    maxHp: player.maxHp,
    items: player.items as Item[],
    alive: player.alive,
    handcuffed: player.handcuffed,
    handcuffImmune: player.handcuffImmune,
    sawedOff: player.sawedOff,
    disconnected: player.disconnected,
    roundWins: player.roundWins,
  };
}

// Setup callbacks for room service (called once)
export function setupRoomCallbacks(
  io: TypedIOServer,
  roomService: RoomService
): void {
  // Callback quando jogo é cancelado (todos desconectaram)
  roomService.onGameCancelled = (roomCode: string) => {
    io.to(roomCode).emit('gameOver', {
      winner: null,
      reason: 'Todos os jogadores abandonaram a partida',
    });
    gamePersistenceService.abandonGame(roomCode)
      .catch(err => console.error('[DB] Erro ao abandonar jogo:', err));
    console.log(`[Room] Jogo ${roomCode} cancelado - todos desconectaram`);
  };

  // Callback quando jogador vence por WO
  roomService.onPlayerWonByDefault = (roomCode: string, player: Player) => {
    const room = roomService.getRoom(roomCode);
    if (!room) return;

    // Build player stats
    const sortedPlayers = [...room.players].sort((a, b) => b.roundWins - a.roundWins);
    const playerStats = sortedPlayers.map((p, index) => {
      const userData = socketUserMap.get(p.id);
      return {
        odId: p.id,
        odUserId: userData?.odUserId,
        guestName: p.name,
        roundsWon: p.roundWins,
        position: p.id === player.id ? 1 : index + 1,
        damageDealt: p.stats.damageDealt,
        damageTaken: p.stats.damageTaken,
        selfDamage: p.stats.selfDamage,
        shotsFired: p.stats.shotsFired,
        itemsUsed: p.stats.itemsUsed,
        kills: p.stats.kills,
        deaths: p.stats.deaths,
      };
    });

    // Calculate awards
    const awards = calculateAwards(room.players as never);

    io.to(roomCode).emit('gameOver', {
      winner: toPublicPlayer(player),
      reason: 'Ultimo jogador restante',
      stats: playerStats,
      awards,
    });

    // Salvar no banco
    const userData = socketUserMap.get(player.id);
    gamePersistenceService.endGame({
      roomCode,
      winnerId: player.id,
      winnerUserId: userData?.odUserId,
      playerStats,
    }).catch(err => console.error('[DB] Erro ao finalizar jogo:', err));

    console.log(`[Room] ${player.name} venceu por WO na sala ${roomCode}`);
  };

  // Callback quando jogador é eliminado por timeout
  roomService.onPlayerEliminated = (roomCode: string, player: Player) => {
    io.to(roomCode).emit('playerEliminated', {
      playerId: player.id,
      playerName: player.name,
      reason: 'Timeout de reconexao',
    });
    console.log(`[Room] ${player.name} eliminado por timeout na sala ${roomCode}`);
  };

  console.log('[Room] Callbacks do room service configurados');
}

export function registerRoomHandlers(
  io: TypedIOServer,
  socket: TypedSocket,
  roomService: RoomService
): void {
  // ==========================================
  // CREATE ROOM
  // ==========================================
  socket.on('createRoom', async ({ playerName, password }) => {
    try {
      const result = roomService.createRoom(socket.id, playerName, password);

      socket.join(result.room.code);

      // Persistir no banco de dados
      const userData = socketUserMap.get(socket.id);
      gamePersistenceService.createGame({
        roomCode: result.room.code,
        hostUserId: userData?.odUserId,
        hostGuestName: userData ? undefined : playerName,
        hasPassword: !!password,
      }).catch(err => console.error('[DB] Erro ao criar jogo:', err));

      socket.emit('roomCreated', {
        code: result.room.code,
        players: result.players,
        isHost: true,
        hasPassword: !!password,
      });

      console.log(`[Room] Sala ${result.room.code} criada por ${playerName}`);
    } catch (error) {
      console.error('[Room] Erro ao criar sala:', error);
      socket.emit('joinError', 'Erro ao criar sala');
    }
  });

  // ==========================================
  // JOIN ROOM
  // ==========================================
  socket.on('joinRoom', async ({ code, playerName, password }) => {
    try {
      const result = roomService.joinRoom(code.toUpperCase(), socket.id, playerName, password);

      if ('error' in result) {
        socket.emit('joinError', result.error);
        return;
      }

      socket.join(code.toUpperCase());

      // Persistir participante no banco de dados
      const userData = socketUserMap.get(socket.id);
      const gameId = await gamePersistenceService.getGameId(code.toUpperCase());
      if (gameId) {
        gamePersistenceService.addParticipant({
          gameId,
          userId: userData?.odUserId,
          guestName: userData ? undefined : playerName,
        }).catch(err => console.error('[DB] Erro ao adicionar participante:', err));
      }

      // Notificar quem entrou
      socket.emit('roomJoined', {
        code: result.room.code,
        players: result.players,
        isHost: result.room.host === socket.id,
      });

      // Notificar outros jogadores
      socket.to(code.toUpperCase()).emit('playerJoined', {
        players: result.players,
        newPlayer: playerName,
      });

      console.log(`[Room] ${playerName} entrou na sala ${code}`);
    } catch (error) {
      console.error('[Room] Erro ao entrar na sala:', error);
      socket.emit('joinError', 'Erro ao entrar na sala');
    }
  });

  // ==========================================
  // LEAVE ROOM
  // ==========================================
  socket.on('leaveRoom', () => {
    try {
      const result = roomService.leaveRoom(socket.id);

      if (result) {
        socket.leave(result.code);

        if (result.deleted) {
          // Sala foi deletada - deletar game do banco também
          gamePersistenceService.deleteGame(result.code)
            .catch(err => console.error('[DB] Erro ao deletar jogo:', err));
          console.log(`[Room] Sala ${result.code} deletada - game removido do banco`);
        } else {
          io.to(result.code).emit('playerLeft', {
            players: result.players,
          });
        }
      }

      socket.emit('leftRoom');
    } catch (error) {
      console.error('[Room] Erro ao sair da sala:', error);
    }
  });

  // ==========================================
  // LIST ROOMS
  // ==========================================
  socket.on('listRooms', () => {
    try {
      const rooms = roomService.listAvailableRooms();
      socket.emit('roomList', rooms);
    } catch (error) {
      console.error('[Room] Erro ao listar salas:', error);
      socket.emit('roomList', []);
    }
  });

  // ==========================================
  // START GAME
  // ==========================================
  socket.on('startGame', async () => {
    try {
      const result = roomService.startGame(socket.id);

      if ('error' in result) {
        socket.emit('startError', result.error);
        return;
      }

      // Start the first round
      const roundData = gameService.startRound(result.room);

      // Persistir no banco de dados
      gamePersistenceService.startGame(result.room.code)
        .catch(err => console.error('[DB] Erro ao iniciar jogo:', err));

      // Salvar o primeiro round no banco
      gamePersistenceService.saveRound({
        roomCode: result.room.code,
        roundNumber: roundData.round,
        maxHp: roundData.maxHp,
        shellsLive: roundData.shells.live,
        shellsBlank: roundData.shells.blank,
      }).catch(err => console.error('[DB] Erro ao salvar round:', err));

      // Emit to each player with their items and reconnect credentials
      result.room.players.forEach(player => {
        const playerSocket = io.sockets.sockets.get(player.id);
        if (playerSocket) {
          playerSocket.emit('roundStarted', {
            ...roundData,
            itemsReceived: player.items as Item[],
          });

          // Enviar credenciais de reconexão
          if (player.reconnectToken) {
            playerSocket.emit('reconnectCredentials', {
              roomCode: result.room.code,
              playerName: player.name,
              reconnectToken: player.reconnectToken,
            });
          }
        }
      });

      // Start turn timer for the first player
      startTurnTimer(io, result.room as RoomWithTimer, result.room.code, roomService);

      console.log(`[Room] Jogo iniciado na sala ${result.room.code}`);
    } catch (error) {
      console.error('[Room] Erro ao iniciar jogo:', error);
      socket.emit('startError', 'Erro ao iniciar jogo');
    }
  });

  // ==========================================
  // DISCONNECT (handled separately)
  // ==========================================
  socket.on('disconnect', () => {
    try {
      const result = roomService.handleDisconnect(socket.id);

      if (result && result.room) {
        if (result.deleted) {
          // Sala foi deletada - deletar game do banco também
          gamePersistenceService.deleteGame(result.code)
            .catch(err => console.error('[DB] Erro ao deletar jogo:', err));
          console.log(`[Room] Sala ${result.code} deletada por desconexão - game removido do banco`);
        } else if (result.gameInProgress) {
          // Notificar sobre desconexão durante jogo
          io.to(result.code).emit('playerDisconnected', {
            playerId: socket.id,
            playerName: result.playerName,
            gracePeriod: 60000, // 60 segundos
            canReconnect: true,
          });
        } else {
          io.to(result.code).emit('playerLeft', {
            players: result.players,
          });
        }

        if (result.newHost) {
          io.to(result.code).emit('hostChanged', {
            newHost: result.newHost,
          });
        }
      }
    } catch (error) {
      console.error('[Room] Erro ao processar desconexão:', error);
    }
  });

  // ==========================================
  // RECONNECT TO GAME
  // ==========================================
  socket.on('reconnectToGame', ({ roomCode, playerName, reconnectToken }) => {
    try {
      const result = roomService.reconnectPlayer(
        roomCode,
        socket.id,
        playerName,
        reconnectToken
      );

      if ('error' in result) {
        socket.emit('reconnectError', { message: result.error });
        return;
      }

      socket.join(roomCode);

      socket.emit('reconnected', result.gameState);

      // Enviar novo token para reconexões futuras
      const room = roomService.getRoom(roomCode);
      const player = room?.players.find(p => p.id === socket.id);
      if (player?.reconnectToken) {
        socket.emit('reconnectCredentials', {
          roomCode,
          playerName,
          reconnectToken: player.reconnectToken,
        });
      }

      io.to(roomCode).emit('playerReconnected', {
        playerId: socket.id,
        playerName: playerName,
      });

      console.log(`[Room] ${playerName} reconectou à sala ${roomCode}`);
    } catch (error) {
      console.error('[Room] Erro ao reconectar:', error);
      socket.emit('reconnectError', { message: 'Erro ao reconectar' });
    }
  });
}
