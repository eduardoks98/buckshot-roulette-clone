// ==========================================
// ROOM SOCKET HANDLERS
// ==========================================

import { TypedIOServer, TypedSocket, socketUserMap } from '../socket';
import { RoomService, Player, Room } from '../services/game/room.service';
import { GameService } from '../services/game/game.service';
import { gamePersistenceService } from '../services/game/game.persistence.service';
import { achievementService, PlayerEndGameStats } from '../services/achievement.service';
import { startTurnTimer, RoomWithTimer, calculateAwards } from './game.handler';
import { Item, PlayerPublicState } from '../../../shared/types';
import { logger, LOG_CATEGORIES } from '../services/logger.service';

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
  roomService.onPlayerWonByDefault = async (roomCode: string, player: Player, room: Room) => {
    // Room is now passed as parameter (room is deleted after this callback)

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

    // Persistir no banco (await para obter xpResults)
    const userData = socketUserMap.get(player.id);
    try {
      const endResult = await gamePersistenceService.endGame({
        roomCode,
        winnerId: player.id,
        winnerUserId: userData?.odUserId,
        playerStats,
      });

      if (endResult) {
        try {
          // Build extended stats for achievement service
          const extendedStats: PlayerEndGameStats[] = sortedPlayers.map((p, index) => {
            const uData = socketUserMap.get(p.id);
            return {
              odId: p.id,
              odUserId: uData?.odUserId,
              playerName: p.name,
              position: p.id === player.id ? 1 : index + 1,
              roundsWon: p.roundWins,
              totalRounds: room.currentRound,
              totalPlayers: room.players.length,
              damageDealt: p.stats.damageDealt,
              damageTaken: p.stats.damageTaken,
              selfDamage: p.stats.selfDamage,
              shotsFired: p.stats.shotsFired,
              itemsUsed: p.stats.itemsUsed,
              kills: p.stats.kills,
              deaths: p.stats.deaths,
              sawedShots: p.stats.sawedShots,
              liveHits: p.stats.liveHits,
              expiredMedicineSurvived: p.stats.expiredMedicineSurvived,
              adrenalineUses: p.stats.adrenalineUses,
              handcuffUses: p.stats.handcuffUses,
              infoItemUses: p.stats.infoItemUses,
              itemsUsedBitmask: p.stats.itemsUsedBitmask,
              firstBloodInGame: p.stats.firstBloodInGame,
              maxConsecutiveTurnsAt1Hp: p.stats.maxConsecutiveTurnsAt1Hp,
              killsPerRound: p.stats.killsPerRound,
              roundsSurvivedAsLast: p.stats.roundsSurvivedAsLast,
              wonRoundWithZeroShots: p.stats.wonRoundWithZeroShots,
              wonRoundWithZeroItems: p.stats.wonRoundWithZeroItems,
              finalHp: p.stats.finalHp,
              uniqueItemsUsedInGame: p.stats.uniqueItemsUsedInGame,
              adrenalineUsesInGame: p.stats.adrenalineUsesInGame,
              expiredMedicineSurvivedInGame: p.stats.expiredMedicineSurvivedInGame,
              liveHitsInGame: p.stats.liveHitsInGame,
              allShotsLiveInGame: p.stats.allShotsLiveInGame,
              lostEarlyRounds: p.stats.lostEarlyRounds,
              isWinner: p.id === player.id,
              lowestEloInGame: false,
            };
          });

          const achievementResult = await achievementService.processGameEnd(endResult.gameId, extendedStats);

          // Emit achievementsUnlocked individually to each player
          for (const [odId, achievements] of achievementResult.newAchievements) {
            if (achievements.length > 0) {
              const playerSocket = io.sockets.sockets.get(odId);
              if (playerSocket) {
                playerSocket.emit('achievementsUnlocked', achievements);
              }
            }
          }

          io.to(roomCode).emit('gameOver', {
            winner: toPublicPlayer(player),
            reason: 'Ultimo jogador restante',
            stats: playerStats,
            awards,
            xpResults: endResult.xpResults || undefined,
            badges: achievementResult.badges.length > 0 ? achievementResult.badges : undefined,
          });
        } catch (achievementError) {
          console.error('[Achievement] Erro ao processar achievements (WO):', achievementError);
          io.to(roomCode).emit('gameOver', {
            winner: toPublicPlayer(player),
            reason: 'Ultimo jogador restante',
            stats: playerStats,
            awards,
            xpResults: endResult.xpResults || undefined,
          });
        }
      } else {
        io.to(roomCode).emit('gameOver', {
          winner: toPublicPlayer(player),
          reason: 'Ultimo jogador restante',
          stats: playerStats,
          awards,
        });
      }
    } catch (err) {
      console.error('[DB] Erro ao finalizar jogo (WO):', err);
      io.to(roomCode).emit('gameOver', {
        winner: toPublicPlayer(player),
        reason: 'Ultimo jogador restante',
        stats: playerStats,
        awards,
      });
    }

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

  // Callback quando sala é deletada após grace period
  roomService.onRoomDeleted = (roomCode: string) => {
    gamePersistenceService.deleteGame(roomCode)
      .catch(err => console.error('[DB] Erro ao deletar jogo após grace period:', err));
    // Notificar todos os clientes que a sala foi deletada
    io.emit('roomDeleted', { code: roomCode });
    console.log(`[Room] Sala ${roomCode} deletada após grace period de 60s`);
  };

  // Callback quando jogador desconecta temporariamente na WaitingRoom (F5)
  roomService.onPlayerDisconnected = (roomCode: string, playerId: string, playerName: string) => {
    io.to(roomCode).emit('playerDisconnected', {
      playerId,
      playerName,
      gracePeriod: 10000, // 10 segundos para WaitingRoom
      canReconnect: true,
    });
    console.log(`[Room] ${playerName} desconectou da WaitingRoom ${roomCode} - vaga reservada por 10s`);
  };

  // Callback quando jogador reconecta na WaitingRoom
  roomService.onPlayerReconnected = (roomCode: string, oldSocketId: string, newSocketId: string, playerName: string) => {
    io.to(roomCode).emit('playerReconnected', {
      playerId: oldSocketId,
      newSocketId,
      playerName,
    });
    console.log(`[Room] ${playerName} reconectou na WaitingRoom ${roomCode}`);
  };

  // Callback quando jogador sai definitivamente (após grace period expirar)
  roomService.onPlayerLeft = (roomCode: string, players: PlayerPublicState[]) => {
    io.to(roomCode).emit('playerLeft', { players });
    io.emit('roomListUpdated');
    console.log(`[Room] Jogador removido da sala ${roomCode} após grace period`);
  };

  // Callback quando host muda
  roomService.onHostChanged = (roomCode: string, newHostName: string) => {
    io.to(roomCode).emit('hostChanged', { newHost: newHostName });
    console.log(`[Room] Novo host na sala ${roomCode}: ${newHostName}`);
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
      const userData = socketUserMap.get(socket.id);

      // Validação por userId: se usuário está logado, verificar se já está em algum jogo
      if (userData?.odUserId) {
        const existingByUserId = roomService.getRoomByUserId(userData.odUserId);
        if (existingByUserId) {
          // Já está em um jogo - emitir evento para redirecionar
          socket.emit('alreadyInGame', {
            roomCode: existingByUserId.code,
            gameStarted: existingByUserId.room.started,
          });
          console.log(`[Room] ${playerName} (userId: ${userData.odUserId}) já está em ${existingByUserId.code} - emitindo alreadyInGame`);
          return;
        }
      }

      // Validação por socket.id (fallback para guests)
      const existingRoom = roomService.getRoomByPlayer(socket.id);
      if (existingRoom) {
        socket.emit('joinError', `Você já está na sala ${existingRoom.code}. Saia primeiro.`);
        console.log(`[Room] ${playerName} tentou criar sala mas já está em ${existingRoom.code}`);
        return;
      }

      const result = roomService.createRoom(socket.id, playerName, password, userData?.odUserId);

      socket.join(result.room.code);

      // Persistir no banco de dados
      gamePersistenceService.createGame({
        roomCode: result.room.code,
        hostUserId: userData?.odUserId,
        hostGuestName: userData ? undefined : playerName,
        hostSocketId: socket.id,  // Socket ID do host
        hasPassword: !!password,
      }).catch(err => console.error('[DB] Erro ao criar jogo:', err));

      socket.emit('roomCreated', {
        code: result.room.code,
        players: result.players,
        isHost: true,
        hasPassword: !!password,
      });

      // Notificar todos os clientes que uma nova sala foi criada
      io.emit('roomListUpdated');

      logger.info(LOG_CATEGORIES.ROOM, `Sala criada: ${result.room.code}`, {
        roomCode: result.room.code,
        socketId: socket.id,
        playerName,
        userId: userData?.odUserId,
        hasPassword: !!password,
      });
    } catch (error) {
      logger.error(LOG_CATEGORIES.ROOM, 'Erro ao criar sala', {
        socketId: socket.id,
        playerName,
        error: String(error),
      });
      socket.emit('joinError', 'Erro ao criar sala');
    }
  });

  // ==========================================
  // JOIN ROOM
  // ==========================================
  socket.on('joinRoom', async ({ code, playerName, password }) => {
    try {
      const userData = socketUserMap.get(socket.id);

      // Validação por userId: se usuário está logado, verificar se já está em algum jogo
      if (userData?.odUserId) {
        const existingByUserId = roomService.getRoomByUserId(userData.odUserId);
        if (existingByUserId) {
          // Se está na mesma sala que está tentando entrar, permite reconexão
          if (existingByUserId.code === code.toUpperCase()) {
            console.log(`[Room] ${playerName} (userId: ${userData.odUserId}) reconectando à sala ${code}`);
          } else {
            // Está em outra sala - emitir evento para redirecionar
            socket.emit('alreadyInGame', {
              roomCode: existingByUserId.code,
              gameStarted: existingByUserId.room.started,
            });
            console.log(`[Room] ${playerName} (userId: ${userData.odUserId}) já está em ${existingByUserId.code} - emitindo alreadyInGame`);
            return;
          }
        }
      }

      // Validação por socket.id (fallback para guests)
      const existingRoom = roomService.getRoomByPlayer(socket.id);
      if (existingRoom) {
        // Se já está na mesma sala, permite reconexão
        if (existingRoom.code === code.toUpperCase()) {
          // Reconexão à mesma sala - continuar normalmente
          console.log(`[Room] ${playerName} reconectando à sala ${code}`);
        } else {
          // Tentando entrar em sala diferente - bloquear
          socket.emit('joinError', `Você já está na sala ${existingRoom.code}. Saia primeiro.`);
          console.log(`[Room] ${playerName} tentou entrar em ${code} mas já está em ${existingRoom.code}`);
          return;
        }
      }

      const result = roomService.joinRoom(code.toUpperCase(), socket.id, playerName, password, userData?.odUserId);

      if ('error' in result) {
        socket.emit('joinError', result.error);
        return;
      }

      socket.join(code.toUpperCase());

      // Persistir participante no banco de dados
      const gameId = await gamePersistenceService.getGameId(code.toUpperCase());
      if (gameId) {
        gamePersistenceService.addParticipant({
          gameId,
          userId: userData?.odUserId,
          guestName: userData ? undefined : playerName,
          odId: socket.id,  // Socket ID para correlação com stats
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

      logger.info(LOG_CATEGORIES.ROOM, `Jogador entrou: ${playerName}`, {
        roomCode: code.toUpperCase(),
        socketId: socket.id,
        playerName,
        userId: userData?.odUserId,
        playerCount: result.players.length,
      });
    } catch (error) {
      logger.error(LOG_CATEGORIES.ROOM, 'Erro ao entrar na sala', {
        socketId: socket.id,
        roomCode: code,
        playerName,
        error: String(error),
      });
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
        console.log(`[Room] Jogador ${result.playerName || 'desconhecido'} saiu da sala ${result.code}`);

        // Se jogo estava em andamento
        if (result.gameInProgress) {
          if (result.winner) {
            // Vitória por WO - callbacks (onPlayerWonByDefault) já cuidaram de:
            // - Persistir no banco (endGame)
            // - Emitir gameOver
            // - Deletar a sala
            console.log(`[Room] ${result.winner.name} venceu por WO - callbacks já processaram`);
            io.emit('roomDeleted', { code: result.code });
          } else if (result.deleted) {
            // Todos desistiram - jogo cancelado (callback onGameCancelled já foi chamado)
            console.log(`[Room] Jogo cancelado - todos desistiram`);
            io.emit('roomDeleted', { code: result.code });
          } else {
            // Jogador desistiu mas ainda tem outros jogando
            // Emitir playerEliminated foi feito pelo callback onPlayerEliminated
            io.to(result.code).emit('playerLeft', {
              players: result.players,
            });
          }
        } else {
          // Jogo não estava em andamento (WaitingRoom)
          if (result.deleted) {
            // Sala foi deletada
            gamePersistenceService.deleteGame(result.code)
              .catch(err => console.error('[DB] Erro ao deletar jogo:', err));
            io.emit('roomDeleted', { code: result.code });
          } else if (result.gracePeriodStarted) {
            // Sala vazia em waiting room - grace period iniciado (60s)
            console.log(`[Room] Sala ${result.code} em grace period de 60s`);
            io.emit('roomListUpdated');
          } else {
            // Sala ainda tem jogadores
            io.to(result.code).emit('playerLeft', {
              players: result.players,
            });
            io.emit('roomListUpdated');
          }
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

      // Start turn timer BEFORE emitting to ensure turnStartTime is set
      startTurnTimer(io, result.room as RoomWithTimer, result.room.code, roomService);

      // Emit to each player with their items and reconnect credentials
      result.room.players.forEach(player => {
        const playerSocket = io.sockets.sockets.get(player.id);
        if (playerSocket) {
          playerSocket.emit('roundStarted', {
            ...roundData,
            itemsReceived: player.items as Item[],
            turnElapsed: result.room.turnStartTime ? Date.now() - result.room.turnStartTime : 0,
          });

          // Enviar credenciais de reconexão
          if (player.reconnectToken) {
            console.log(`[Room] Enviando reconnectCredentials para ${player.name}`);
            playerSocket.emit('reconnectCredentials', {
              roomCode: result.room.code,
              playerName: player.name,
              reconnectToken: player.reconnectToken,
            });
          }
        }
      });

      logger.info(LOG_CATEGORIES.GAME, `Jogo iniciado: ${result.room.code}`, {
        roomCode: result.room.code,
        socketId: socket.id,
        playerCount: result.room.players.length,
        players: result.room.players.map(p => p.name),
      });
    } catch (error) {
      logger.error(LOG_CATEGORIES.GAME, 'Erro ao iniciar jogo', {
        socketId: socket.id,
        error: String(error),
      });
      socket.emit('startError', 'Erro ao iniciar jogo');
    }
  });

  // ==========================================
  // DISCONNECT (handled separately)
  // ==========================================
  socket.on('disconnect', () => {
    console.log(`[Room] Socket ${socket.id} desconectou`);
    console.log(`[Room] Rooms do socket antes de processar:`, Array.from(socket.rooms));
    try {
      const result = roomService.handleDisconnect(socket.id);
      console.log(`[Room] handleDisconnect result:`, result ? {
        code: result.code,
        gameInProgress: result.gameInProgress,
        playerName: result.playerName,
        deleted: result.deleted,
        playerDisconnected: result.playerDisconnected
      } : null);

      if (result && result.room) {
        if (result.deleted) {
          // Sala foi deletada - deletar game do banco também
          gamePersistenceService.deleteGame(result.code)
            .catch(err => console.error('[DB] Erro ao deletar jogo:', err));
          console.log(`[Room] Sala ${result.code} deletada por desconexão - game removido do banco`);
          // Notificar todos os clientes que a sala foi deletada
          io.emit('roomDeleted', { code: result.code });
        } else if (result.gameInProgress) {
          // Notificar sobre desconexão durante jogo (grace period 60s)
          console.log(`[Room] Emitindo playerDisconnected para sala ${result.code}: ${result.playerName} (jogo em andamento)`);
          io.to(result.code).emit('playerDisconnected', {
            playerId: socket.id,
            playerName: result.playerName,
            gracePeriod: 60000, // 60 segundos
            canReconnect: true,
          });
        } else if (result.playerDisconnected) {
          // Desconexão temporária na WaitingRoom (F5) - vaga reservada por 10s
          // O callback onPlayerDisconnected já foi chamado pelo room.service
          // Apenas atualizar lista de salas
          io.emit('roomListUpdated');
        } else {
          // Jogador foi removido imediatamente (não deveria acontecer na WaitingRoom agora)
          io.to(result.code).emit('playerLeft', {
            players: result.players,
          });
          io.emit('roomListUpdated');
        }

        // Host changed é tratado pelo callback onHostChanged se necessário
        // Mas se veio no result, também emitir (para casos de jogo em andamento)
        if (result.newHost && result.gameInProgress) {
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

      // CRÍTICO: Sincronizar TODOS os clientes com o estado atualizado
      // Isso garante que todos vejam o novo socket.id do jogador reconectado
      io.to(roomCode).emit('turnChanged', {
        currentPlayer: result.gameState.currentPlayer,
        reason: 'reconnected',
        players: result.gameState.players,
        turnElapsed: room!.turnStartTime ? Date.now() - room!.turnStartTime : 0,
      });

      logger.info(LOG_CATEGORIES.CONN, `Reconectou: ${playerName}`, {
        roomCode,
        socketId: socket.id,
        playerName,
        method: 'attemptReconnect',
      });
    } catch (error) {
      logger.error(LOG_CATEGORIES.CONN, 'Erro ao reconectar', {
        socketId: socket.id,
        roomCode,
        playerName,
        error: String(error),
      });
      socket.emit('reconnectError', { message: 'Erro ao reconectar' });
    }
  });

  // ==========================================
  // REJOIN GAME (Backend-first - sem token do cliente)
  // ==========================================
  socket.on('rejoinGame', ({ roomCode }) => {
    try {
      const userData = socketUserMap.get(socket.id);
      if (!userData?.odUserId) {
        socket.emit('joinError', 'Não autenticado');
        return;
      }

      const result = roomService.rejoinByUserId(roomCode, socket.id, userData.odUserId);

      if ('error' in result) {
        socket.emit('joinError', result.error);
        return;
      }

      socket.join(roomCode);

      if (result.gameStarted && result.gameState) {
        // Jogo em andamento - enviar estado completo
        socket.emit('reconnected', result.gameState);

        // Enviar novas credenciais de reconexão
        const room = roomService.getRoom(roomCode);
        const player = room?.players.find(p => p.id === socket.id);
        if (player?.reconnectToken) {
          socket.emit('reconnectCredentials', {
            roomCode,
            playerName: player.name,
            reconnectToken: player.reconnectToken,
          });
        }

        // Notificar outros jogadores
        io.to(roomCode).emit('playerReconnected', {
          playerId: socket.id,
          playerName: result.playerName,
        });

        // Sincronizar todos os clientes
        io.to(roomCode).emit('turnChanged', {
          currentPlayer: result.gameState.currentPlayer,
          reason: 'reconnected',
          players: result.gameState.players,
          turnElapsed: room?.turnStartTime ? Date.now() - room.turnStartTime : 0,
        });

        console.log(`[Room] ${result.playerName} reconectou ao jogo ${roomCode} via rejoinGame`);
      } else {
        // WaitingRoom - enviar dados da sala
        const room = roomService.getRoom(roomCode);
        if (room) {
          socket.emit('roomJoined', {
            code: roomCode,
            players: room.players.map(toPublicPlayer),
            isHost: room.host === socket.id,
          });

          // Notificar outros jogadores
          io.to(roomCode).emit('playerReconnected', {
            playerId: socket.id,
            playerName: result.playerName,
          });

          console.log(`[Room] ${result.playerName} reconectou à WaitingRoom ${roomCode} via rejoinGame`);
        }
      }
    } catch (error) {
      console.error('[Room] Erro ao rejoin:', error);
      socket.emit('joinError', 'Erro ao reconectar');
    }
  });

  // ==========================================
  // ABANDON GAME (sair definitivamente da sala)
  // ==========================================
  socket.on('abandonGame', ({ roomCode }) => {
    try {
      const userData = socketUserMap.get(socket.id);
      if (!userData?.odUserId) {
        socket.emit('gameAbandoned');
        return;
      }

      const result = roomService.removePlayerByUserId(roomCode, userData.odUserId);

      if (result) {
        socket.leave(roomCode);

        // Notificar outros jogadores
        if (!result.deleted) {
          io.to(roomCode).emit('playerLeft', {
            players: result.players,
          });
        }

        // Se sala foi deletada, notificar todos
        if (result.deleted) {
          io.emit('roomDeleted', { code: roomCode });
        }

        io.emit('roomListUpdated');
      }

      socket.emit('gameAbandoned');
      console.log(`[Room] Jogador abandonou sala ${roomCode} via abandonGame`);
    } catch (error) {
      console.error('[Room] Erro ao abandonar:', error);
      socket.emit('gameAbandoned'); // Ainda confirma para limpar estado do cliente
    }
  });

  // ==========================================
  // ADD BOT (Development Only)
  // ==========================================
  socket.on('addBot', ({ botName, difficulty }) => {
    try {
      // Verificar se está em uma sala
      const roomData = roomService.getRoomByPlayer(socket.id);
      if (!roomData) {
        socket.emit('botError', { message: 'Você não está em uma sala' });
        return;
      }

      const { code, room } = roomData;

      // Verificar se é o host
      if (room.host !== socket.id) {
        socket.emit('botError', { message: 'Apenas o host pode adicionar bots' });
        return;
      }

      // Importar botService dinamicamente para evitar dependência circular
      import('../services/bot/bot.service').then(({ botService }) => {
        const result = botService.addBotToRoom(
          io,
          roomService,
          code,
          botName || `AI-${room.players.length}`,
          difficulty || 'medium'
        );

        if (!result.success || !result.bot) {
          socket.emit('botError', { message: result.error || 'Erro desconhecido' });
          return;
        }

        socket.emit('botAdded', {
          botId: result.bot.id,
          botName: result.bot.name,
        });

        io.emit('roomListUpdated');
      });
    } catch (error) {
      logger.error(LOG_CATEGORIES.ROOM, 'Erro ao adicionar bot', {
        socketId: socket.id,
        error: String(error),
      });
      socket.emit('botError', { message: 'Erro ao adicionar bot' });
    }
  });

  // ==========================================
  // REMOVE BOT (Development Only)
  // ==========================================
  socket.on('removeBot', ({ botId }) => {
    try {
      const roomData = roomService.getRoomByPlayer(socket.id);
      if (!roomData) {
        socket.emit('botError', { message: 'Você não está em uma sala' });
        return;
      }

      const { code, room } = roomData;

      // Verificar se é o host
      if (room.host !== socket.id) {
        socket.emit('botError', { message: 'Apenas o host pode remover bots' });
        return;
      }

      import('../services/bot/bot.service').then(({ botService }) => {
        const result = botService.removeBotFromRoom(io, roomService, code, botId);

        if (!result.success) {
          socket.emit('botError', { message: result.error || 'Erro desconhecido' });
          return;
        }

        socket.emit('botRemoved', { botId });
        io.emit('roomListUpdated');
      });
    } catch (error) {
      logger.error(LOG_CATEGORIES.ROOM, 'Erro ao remover bot', {
        socketId: socket.id,
        error: String(error),
      });
      socket.emit('botError', { message: 'Erro ao remover bot' });
    }
  });

  // ==========================================
  // CHECK ACTIVE GAME
  // ==========================================
  socket.on('checkActiveGame', () => {
    const userData = socketUserMap.get(socket.id);
    if (!userData?.odUserId) {
      return;
    }

    const existingGame = roomService.getRoomByUserId(userData.odUserId);
    if (existingGame) {
      socket.emit('alreadyInGame', {
        roomCode: existingGame.code,
        gameStarted: existingGame.room.started,
      });
      console.log(`[Room] checkActiveGame: ${userData.displayName} está em ${existingGame.code}`);
    }
  });

  // ==========================================
  // REMATCH HANDLER
  // ==========================================

  socket.on('requestRematch', async ({ previousRoomCode, playerName }) => {
    const userData = socketUserMap.get(socket.id);

    // Check if user is already in another game
    if (userData?.odUserId) {
      const existingGame = roomService.getRoomByUserId(userData.odUserId);
      if (existingGame && existingGame.code !== previousRoomCode) {
        socket.emit('joinError', 'Você já está em outro jogo');
        return;
      }
    }

    // Check if a rematch room already exists for this previous game
    const existingRematchCode = roomService.getRematchRoom(previousRoomCode);

    if (existingRematchCode) {
      // Rematch room exists - join it
      const result = roomService.joinRoom(
        existingRematchCode,
        socket.id,
        playerName,
        undefined,
        userData?.odUserId
      );

      if ('error' in result) {
        socket.emit('joinError', result.error);
        return;
      }

      socket.join(existingRematchCode);

      socket.emit('roomJoined', {
        code: result.room.code,
        players: result.room.players.map(toPublicPlayer),
        isHost: result.room.host === socket.id,
      });

      socket.to(existingRematchCode).emit('playerJoined', {
        players: result.room.players.map(toPublicPlayer),
        newPlayer: playerName,
      });

      console.log(`[Rematch] ${playerName} entrou na revanche ${existingRematchCode} (anterior: ${previousRoomCode})`);
    } else {
      // No rematch room yet - create one (this player becomes host)
      const result = roomService.createRoom(socket.id, playerName, undefined, userData?.odUserId);
      const newRoomCode = result.room.code;

      // Register the rematch mapping
      roomService.setRematchRoom(previousRoomCode, newRoomCode);

      socket.join(newRoomCode);

      // Persist to database
      try {
        await gamePersistenceService.createGame({
          roomCode: newRoomCode,
          hostUserId: userData?.odUserId,
          hostGuestName: !userData?.odUserId ? playerName : undefined,
          hostSocketId: socket.id,  // Socket ID do host
          hasPassword: false,
        });
      } catch (err) {
        console.error('[DB] Erro ao criar jogo de revanche:', err);
      }

      socket.emit('roomCreated', {
        code: newRoomCode,
        players: result.players,
        isHost: true,
        hasPassword: false,
      });

      // Broadcast rematch room to all players who might be waiting
      // They can use this to auto-join when they click "Play Again"
      socket.emit('rematchRoomReady', {
        newRoomCode,
        previousRoomCode,
      });

      io.emit('roomListUpdated');

      console.log(`[Rematch] ${playerName} criou revanche ${newRoomCode} (anterior: ${previousRoomCode})`);
    }
  });
}
