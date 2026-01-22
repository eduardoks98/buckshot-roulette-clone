// ==========================================
// GAME SOCKET HANDLERS
// ==========================================

import { TypedIOServer, TypedSocket, socketUserMap } from '../socket';
import { GameService } from '../services/game/game.service';
import { RoomService } from '../services/game/room.service';
import { gamePersistenceService } from '../services/game/game.persistence.service';
import { GAME_RULES } from '../../../shared/constants';
import { Item, ItemId, GameAward } from '../../../shared/types';

const gameService = new GameService();

export function registerGameHandlers(
  io: TypedIOServer,
  socket: TypedSocket,
  roomService: RoomService
): void {
  // ==========================================
  // SHOOT
  // ==========================================
  socket.on('shoot', ({ targetId }) => {
    try {
      const roomData = roomService.getRoomByPlayer(socket.id);
      if (!roomData) {
        socket.emit('actionError', 'Voce nao esta em uma sala');
        return;
      }

      const { code, room } = roomData;

      // Process shot
      const result = gameService.processShot(room, socket.id, targetId);

      if ('error' in result) {
        socket.emit('actionError', result.error);
        return;
      }

      // Emit shot result
      io.to(code).emit('shotFired', result);

      // Check if target was eliminated
      const target = room.players.find(p => p.id === targetId);
      if (target && !target.alive) {
        io.to(code).emit('playerEliminated', {
          playerId: targetId,
          playerName: target.name,
          reason: 'Eliminado por tiro',
        });
      }

      // Check round end
      if (result.roundOver) {
        handleRoundEnd(io, room, code, result.winner?.id);
        return;
      }

      // Check if reloaded - usar dados já calculados, NÃO chamar de novo
      if (result.reloaded && result.newShells) {
        io.to(code).emit('shellsReloaded', {
          shells: result.newShells,
          itemsDistributed: result.itemsDistributed || [],
        });
      }

      // Advance turn
      const shotSelf = socket.id === targetId;
      const wasBlank = result.shell === 'blank';
      const nextPlayerId = gameService.advanceTurn(room, shotSelf, wasBlank);

      // Reset turn timer
      if (room.turnTimeout) {
        clearTimeout(room.turnTimeout);
      }

      room.turnStartTime = Date.now();
      room.turnTimeout = setTimeout(() => {
        handleTurnTimeout(io, room, code, roomService);
      }, GAME_RULES.TIMERS.TURN_DURATION_MS);

      io.to(code).emit('turnChanged', {
        currentPlayer: nextPlayerId,
        reason: 'shot',
        players: room.players.map(p => gameService.toPublicPlayer(p)),
      });

      console.log(`[Game] ${socket.id} atirou em ${targetId} - ${result.shell}`);
    } catch (error) {
      console.error('[Game] Erro ao processar tiro:', error);
      socket.emit('actionError', 'Erro ao processar tiro');
    }
  });

  // ==========================================
  // USE ITEM
  // ==========================================
  socket.on('useItem', ({ itemId, targetId, itemIndex }) => {
    try {
      const roomData = roomService.getRoomByPlayer(socket.id);
      if (!roomData) {
        socket.emit('actionError', 'Voce nao esta em uma sala');
        return;
      }

      const { code, room } = roomData;

      // Process item
      const result = gameService.processItem(room, socket.id, itemId as ItemId, targetId, itemIndex);

      if ('error' in result) {
        socket.emit('actionError', result.error);
        return;
      }

      // Emit item used
      io.to(code).emit('itemUsed', result);

      // Adrenalina - processar o item roubado imediatamente
      if (itemId === 'adrenaline' && result.usedImmediately && result.stolenItem) {
        const stolenItemId = result.stolenItem.id as ItemId;

        // Processar o item roubado (já está no inventário do jogador)
        const stolenResult = gameService.processItem(room, socket.id, stolenItemId, targetId);

        if (!('error' in stolenResult)) {
          // Emit o uso do item roubado
          io.to(code).emit('itemUsed', stolenResult);

          // Se o item roubado foi expired_medicine e eliminou o jogador
          if (stolenItemId === 'expired_medicine' && stolenResult.eliminated) {
            const user = room.players.find(p => p.id === socket.id);
            if (user) {
              io.to(code).emit('playerEliminated', {
                playerId: socket.id,
                playerName: user.name,
                reason: 'Remedio vencido (roubado)',
              });

              const roundEnd = gameService.checkRoundEnd(room);
              if (roundEnd.ended) {
                handleRoundEnd(io, room, code, roundEnd.winnerId);
              }
            }
          }
        }

        console.log(`[Game] ${socket.id} usou item roubado ${stolenItemId} via Adrenalina`);
      }

      // Check for elimination by expired medicine
      if (itemId === 'expired_medicine' && result.eliminated) {
        const user = room.players.find(p => p.id === socket.id);
        if (user) {
          io.to(code).emit('playerEliminated', {
            playerId: socket.id,
            playerName: user.name,
            reason: 'Remedio vencido',
          });

          const roundEnd = gameService.checkRoundEnd(room);
          if (roundEnd.ended) {
            handleRoundEnd(io, room, code, roundEnd.winnerId);
          }
        }
      }

      console.log(`[Game] ${socket.id} usou item ${itemId}`);
    } catch (error) {
      console.error('[Game] Erro ao usar item:', error);
      socket.emit('actionError', 'Erro ao usar item');
    }
  });

  // ==========================================
  // GET PLAYER ITEMS (para Adrenalina)
  // ==========================================
  socket.on('getPlayerItems', ({ targetId }) => {
    try {
      const roomData = roomService.getRoomByPlayer(socket.id);
      if (!roomData) return;

      const { room } = roomData;
      const target = room.players.find(p => p.id === targetId);

      if (!target || !target.alive) return;

      socket.emit('playerItems', {
        targetId,
        targetName: target.name,
        items: target.items as Item[],
      });
    } catch (error) {
      console.error('[Game] Erro ao obter itens:', error);
    }
  });
}

// ==========================================
// HELPERS
// ==========================================

interface PlayerStats {
  damageDealt: number;
  damageTaken: number;
  selfDamage: number;
  shotsFired: number;
  itemsUsed: number;
  kills: number;
  deaths: number;
}

interface RoomWithTimer {
  code: string;
  currentRound: number;
  currentPlayerIndex: number;
  turnTimeout: NodeJS.Timeout | null;
  turnStartTime: number | null;
  players: {
    id: string;
    name: string;
    roundWins: number;
    alive: boolean;
    items: Item[];
    stats: PlayerStats;
  }[];
}

export function calculateAwards(players: RoomWithTimer['players']): GameAward[] {
  const awards: GameAward[] = [];

  if (players.length === 0) return awards;

  // Mais Dano Causado
  const mostDamage = players.reduce((a, b) =>
    a.stats.damageDealt > b.stats.damageDealt ? a : b
  );
  if (mostDamage.stats.damageDealt > 0) {
    awards.push({
      type: 'most_damage',
      playerId: mostDamage.id,
      playerName: mostDamage.name,
      value: mostDamage.stats.damageDealt,
    });
  }

  // Mais Dano Sofrido
  const mostDamageTaken = players.reduce((a, b) =>
    a.stats.damageTaken > b.stats.damageTaken ? a : b
  );
  if (mostDamageTaken.stats.damageTaken > 0) {
    awards.push({
      type: 'most_damage_taken',
      playerId: mostDamageTaken.id,
      playerName: mostDamageTaken.name,
      value: mostDamageTaken.stats.damageTaken,
    });
  }

  // Mais Passivo (menos tiros disparados)
  const mostPassive = players.reduce((a, b) =>
    a.stats.shotsFired < b.stats.shotsFired ? a : b
  );
  awards.push({
    type: 'most_passive',
    playerId: mostPassive.id,
    playerName: mostPassive.name,
    value: mostPassive.stats.shotsFired,
  });

  // Mais Dano em Si Mesmo
  const mostSelfDamage = players.reduce((a, b) =>
    a.stats.selfDamage > b.stats.selfDamage ? a : b
  );
  if (mostSelfDamage.stats.selfDamage > 0) {
    awards.push({
      type: 'most_self_damage',
      playerId: mostSelfDamage.id,
      playerName: mostSelfDamage.name,
      value: mostSelfDamage.stats.selfDamage,
    });
  }

  // Mais Itens Usados
  const mostItemsUsed = players.reduce((a, b) =>
    a.stats.itemsUsed > b.stats.itemsUsed ? a : b
  );
  if (mostItemsUsed.stats.itemsUsed > 0) {
    awards.push({
      type: 'most_items_used',
      playerId: mostItemsUsed.id,
      playerName: mostItemsUsed.name,
      value: mostItemsUsed.stats.itemsUsed,
    });
  }

  // Mais Kills
  const mostKills = players.reduce((a, b) =>
    a.stats.kills > b.stats.kills ? a : b
  );
  if (mostKills.stats.kills > 0) {
    awards.push({
      type: 'most_kills',
      playerId: mostKills.id,
      playerName: mostKills.name,
      value: mostKills.stats.kills,
    });
  }

  return awards;
}

function handleRoundEnd(
  io: TypedIOServer,
  room: RoomWithTimer,
  code: string,
  winnerId?: string
): void {
  // Clear turn timeout
  if (room.turnTimeout) {
    clearTimeout(room.turnTimeout);
    room.turnTimeout = null;
  }

  const winner = room.players.find(p => p.id === winnerId);

  // Emit round ended
  io.to(code).emit('roundEnded', {
    winnerId: winnerId || '',
    winnerName: winner?.name || '',
    roundNumber: room.currentRound,
    roundWins: room.players.map(p => ({ playerId: p.id, wins: p.roundWins })),
  });

  // Check game end
  const gameEnd = gameService.checkGameEnd(room as never);

  if (gameEnd.ended) {
    const gameWinner = room.players.find(p => p.id === gameEnd.winnerId);

    // Build player stats for persistence
    const sortedPlayers = [...room.players].sort((a, b) => b.roundWins - a.roundWins);
    const playerStats = sortedPlayers.map((p, index) => {
      const userData = socketUserMap.get(p.id);
      return {
        odId: p.id,
        odUserId: userData?.odUserId,
        guestName: p.name,
        roundsWon: p.roundWins,
        position: index + 1,
        damageDealt: p.stats.damageDealt,
        damageTaken: p.stats.damageTaken,
        selfDamage: p.stats.selfDamage,
        shotsFired: p.stats.shotsFired,
        itemsUsed: p.stats.itemsUsed,
        kills: p.stats.kills,
        deaths: p.stats.deaths,
      };
    });

    // Persistir no banco de dados
    const winnerUserData = gameWinner ? socketUserMap.get(gameWinner.id) : null;
    gamePersistenceService.endGame({
      roomCode: code,
      winnerId: gameEnd.winnerId,
      winnerUserId: winnerUserData?.odUserId,
      playerStats,
    }).catch(err => console.error('[DB] Erro ao finalizar jogo:', err));

    // Calculate awards
    const awards = calculateAwards(room.players);

    io.to(code).emit('gameOver', {
      winner: gameWinner ? gameService.toPublicPlayer(gameWinner as never) : null,
      reason: 'Todos os rounds foram jogados',
      stats: playerStats,
      awards,
    });
    return;
  }

  // Start next round after delay
  setTimeout(() => {
    room.currentRound++;
    const roundData = gameService.startRound(room as never);

    // Emit to each player with their items
    room.players.forEach(player => {
      const playerSocket = io.sockets.sockets.get(player.id);
      if (playerSocket) {
        playerSocket.emit('roundStarted', {
          ...roundData,
          itemsReceived: player.items,
        });
      }
    });
  }, 3000);
}

function handleTurnTimeout(
  io: TypedIOServer,
  room: RoomWithTimer,
  code: string,
  roomService: RoomService
): void {
  const currentPlayer = room.players[room.currentPlayerIndex];
  if (!currentPlayer || !currentPlayer.alive) return;

  // Auto-shoot self
  const result = gameService.processShot(room as never, currentPlayer.id, currentPlayer.id);

  if ('error' in result) return;

  io.to(code).emit('shotFired', result);
  io.to(code).emit('turnTimedOut', {
    playerId: currentPlayer.id,
    playerName: currentPlayer.name,
  });

  // Check if player was eliminated
  const player = room.players.find(p => p.id === currentPlayer.id);
  if (player && !player.alive) {
    io.to(code).emit('playerEliminated', {
      playerId: currentPlayer.id,
      playerName: currentPlayer.name,
      reason: 'Tempo esgotado - auto-tiro',
    });
  }

  // Continue game flow
  if (result.roundOver) {
    handleRoundEnd(io, room, code, result.winner?.id);
    return;
  }

  // Usar dados já calculados, NÃO chamar reloadShells de novo
  if (result.reloaded && result.newShells) {
    io.to(code).emit('shellsReloaded', {
      shells: result.newShells,
      itemsDistributed: result.itemsDistributed || [],
    });
  }

  const wasBlank = result.shell === 'blank';
  const nextPlayerId = gameService.advanceTurn(room as never, true, wasBlank);

  // Set new timeout
  room.turnStartTime = Date.now();
  room.turnTimeout = setTimeout(() => {
    handleTurnTimeout(io, room, code, roomService);
  }, GAME_RULES.TIMERS.TURN_DURATION_MS);

  io.to(code).emit('turnChanged', {
    currentPlayer: nextPlayerId,
    reason: 'timeout',
    players: room.players.map(p => gameService.toPublicPlayer(p as never)),
  });
}

// ==========================================
// EXPORTED HELPER: Start turn timer
// ==========================================
export function startTurnTimer(
  io: TypedIOServer,
  room: RoomWithTimer,
  code: string,
  roomService: RoomService
): void {
  // Clear any existing timer
  if (room.turnTimeout) {
    clearTimeout(room.turnTimeout);
  }

  // Set turn start time and timeout
  room.turnStartTime = Date.now();
  room.turnTimeout = setTimeout(() => {
    handleTurnTimeout(io, room, code, roomService);
  }, GAME_RULES.TIMERS.TURN_DURATION_MS);

  console.log(`[Game] Turn timer started for room ${code}`);
}

// Export the RoomWithTimer interface for use in other files
export type { RoomWithTimer };
