// ==========================================
// GAME SOCKET HANDLERS
// ==========================================

import { TypedIOServer, TypedSocket, socketUserMap } from '../socket';
import { GameService } from '../services/game/game.service';
import { RoomService } from '../services/game/room.service';
import { gamePersistenceService } from '../services/game/game.persistence.service';
import { achievementService, PlayerEndGameStats } from '../services/achievement.service';
import { GAME_RULES } from '../../../shared/constants';
import { Item, ItemId, GameAward } from '../../../shared/types';
import { logger, LOG_CATEGORIES } from '../services/logger.service';
import { endMatchSession } from '../services/session.service';

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
        handleRoundEnd(io, room, code, roomService, result.winner?.id);
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
        turnElapsed: 0, // Turno acabou de começar
      });

      // Se o próximo jogador é um bot, agendar jogada
      const nextPlayer = room.players.find(p => p.id === nextPlayerId);
      if (nextPlayer && nextPlayer.id.startsWith('BOT_')) {
        import('../services/bot/bot.service').then(({ botService }) => {
          // Delay para aguardar o overlay de shot result no cliente
          const SHOT_OVERLAY_DELAY = 3500; // 3s overlay + 500ms buffer
          botService.scheduleBotTurn(io, room as never, code, roomService, SHOT_OVERLAY_DELAY);
        });
      }

      // Log do tiro
      const shooter = room.players.find(p => p.id === socket.id);
      const targetPlayer = room.players.find(p => p.id === targetId);
      logger.info(LOG_CATEGORIES.SHOT, `${shooter?.name || socket.id} atirou em ${targetPlayer?.name || targetId}`, {
        roomCode: code,
        socketId: socket.id,
        shooter: shooter?.name,
        target: targetPlayer?.name,
        shell: result.shell,
        damage: result.damage,
        targetSelf: socket.id === targetId,
        sawedOff: result.sawedOff,
      });
    } catch (error) {
      logger.error(LOG_CATEGORIES.SHOT, 'Erro ao processar tiro', {
        socketId: socket.id,
        error: String(error),
      });
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
      // EXCETO itens que precisam de alvo (handcuffs, adrenaline) - ficam no inventário
      if (itemId === 'adrenaline' && result.usedImmediately && result.stolenItem) {
        const stolenItemId = result.stolenItem.id as ItemId;
        const needsTarget = stolenItemId === 'handcuffs' || stolenItemId === 'adrenaline';

        if (needsTarget) {
          // Item que precisa de alvo: NÃO usar automaticamente, fica no inventário
          // O jogador usará manualmente na sua vez
          console.log(`[Game] ${socket.id} roubou ${stolenItemId} via Adrenalina - item adicionado ao inventário para uso manual`);
        } else {
          // Processar o item roubado automaticamente (já está no inventário do jogador)
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
                  handleRoundEnd(io, room, code, roomService, roundEnd.winnerId);
                } else {
                  // Jogador morreu mas a rodada continua - avançar turno
                  const nextPlayerId = gameService.advanceTurn(room, false, false);

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
                    reason: 'elimination',
                    players: room.players.map(p => gameService.toPublicPlayer(p)),
                    turnElapsed: 0, // Turno acabou de começar
                  });

                  // Se o próximo jogador é um bot, agendar jogada
                  const nextPlayerElim = room.players.find(p => p.id === nextPlayerId);
                  if (nextPlayerElim && nextPlayerElim.id.startsWith('BOT_')) {
                    import('../services/bot/bot.service').then(({ botService }) => {
                      const ITEM_OVERLAY_DELAY = 3000;
                      botService.scheduleBotTurn(io, room as never, code, roomService, ITEM_OVERLAY_DELAY);
                    });
                  }
                }
              }
            }
          }

          console.log(`[Game] ${socket.id} usou item roubado ${stolenItemId} via Adrenalina`);
        }
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
            handleRoundEnd(io, room, code, roomService, roundEnd.winnerId);
          } else {
            // Jogador morreu mas a rodada continua - avançar turno
            const nextPlayerId = gameService.advanceTurn(room, false, false);

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
              reason: 'elimination',
              players: room.players.map(p => gameService.toPublicPlayer(p)),
              turnElapsed: 0, // Turno acabou de começar
            });

            // Se o próximo jogador é um bot, agendar jogada
            const nextPlayerMed = room.players.find(p => p.id === nextPlayerId);
            if (nextPlayerMed && nextPlayerMed.id.startsWith('BOT_')) {
              import('../services/bot/bot.service').then(({ botService }) => {
                const ITEM_OVERLAY_DELAY = 3000;
                botService.scheduleBotTurn(io, room as never, code, roomService, ITEM_OVERLAY_DELAY);
              });
            }
          }
        }
      }

      // Cerveja no último cartucho: avançar turno para o próximo jogador
      // Quando a cerveja causa reload, significa que acabou as shells e o turno deve passar
      if (itemId === 'beer' && result.reloaded && result.newShells) {
        io.to(code).emit('shellsReloaded', {
          shells: result.newShells,
          itemsDistributed: result.itemsDistributed || [],
        });

        // Avançar turno (cerveja no último cartucho passa a vez)
        const nextPlayerId = gameService.advanceTurn(room, false, false);

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
          reason: 'beer_reload',
          players: room.players.map(p => gameService.toPublicPlayer(p)),
          turnElapsed: 0,
        });

        // Se o próximo jogador é um bot, agendar jogada
        const nextPlayerBeer = room.players.find(p => p.id === nextPlayerId);
        if (nextPlayerBeer && nextPlayerBeer.id.startsWith('BOT_')) {
          import('../services/bot/bot.service').then(({ botService }) => {
            const ITEM_OVERLAY_DELAY = 3000;
            botService.scheduleBotTurn(io, room as never, code, roomService, ITEM_OVERLAY_DELAY);
          });
        }

        logger.info(LOG_CATEGORIES.ITEM, `Cerveja causou reload - turno passou para ${nextPlayerId}`, {
          roomCode: code,
          socketId: socket.id,
        });
      }

      // Log do uso de item
      const user = room.players.find(p => p.id === socket.id);
      logger.info(LOG_CATEGORIES.ITEM, `${user?.name || socket.id} usou ${itemId}`, {
        roomCode: code,
        socketId: socket.id,
        playerName: user?.name,
        itemId,
        targetId,
        itemIndex,
      });
    } catch (error) {
      logger.error(LOG_CATEGORIES.ITEM, 'Erro ao usar item', {
        socketId: socket.id,
        error: String(error),
      });
      socket.emit('actionError', 'Erro ao usar item');
    }
  });

  // ==========================================
  // GET PLAYER ITEMS (para Adrenalina)
  // ==========================================
  socket.on('getPlayerItems', ({ targetId }) => {
    try {
      const roomData = roomService.getRoomByPlayer(socket.id);
      if (!roomData) {
        socket.emit('actionError', 'Voce nao esta em uma sala');
        return;
      }

      const { room } = roomData;

      // Verificar se é o turno do jogador
      const currentPlayer = room.players[room.currentPlayerIndex];
      if (currentPlayer.id !== socket.id) {
        socket.emit('actionError', 'Nao e seu turno');
        return;
      }

      const target = room.players.find(p => p.id === targetId);

      if (!target) {
        socket.emit('actionError', 'Jogador nao encontrado');
        return;
      }

      // Permitir roubar de jogadores mortos/abandonados (eles mantêm itens até fim do round)
      // A única validação é se tem itens

      if (target.items.length === 0) {
        socket.emit('actionError', 'Jogador nao tem itens');
        return;
      }

      socket.emit('playerItems', {
        targetId,
        targetName: target.name,
        items: target.items as Item[],
      });

      console.log(`[Game] ${socket.id} solicitou itens de ${target.name}`);
    } catch (error) {
      console.error('[Game] Erro ao obter itens:', error);
      socket.emit('actionError', 'Erro ao obter itens do jogador');
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

  // Extended tracking for achievements/badges
  sawedShots: number;
  liveHits: number;
  expiredMedicineSurvived: number;
  adrenalineUses: number;
  handcuffUses: number;
  infoItemUses: number;
  itemsUsedBitmask: number;
  firstBloodInGame: boolean;
  turnsAt1Hp: number;
  maxConsecutiveTurnsAt1Hp: number;
  killsPerRound: number[];
  roundsSurvivedAsLast: number;
  wonRoundWithZeroShots: boolean;
  wonRoundWithZeroItems: boolean;
  finalHp: number;
  uniqueItemsUsedInGame: number;
  adrenalineUsesInGame: number;
  expiredMedicineSurvivedInGame: number;
  liveHitsInGame: number;
  allShotsLiveInGame: boolean;
  lostEarlyRounds: boolean;
  shotsInCurrentRound: number;
  itemsInCurrentRound: number;
  killsInCurrentRound: number;
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

export async function handleRoundEnd(
  io: TypedIOServer,
  room: RoomWithTimer,
  code: string,
  roomService: RoomService,
  winnerId?: string
): Promise<void> {
  // Clear turn timeout
  if (room.turnTimeout) {
    clearTimeout(room.turnTimeout);
    room.turnTimeout = null;
  }

  const winner = room.players.find(p => p.id === winnerId);

  // Aguardar overlay de tiro terminar antes de mostrar resultado do round
  // O overlay de tiro dura 3000ms no cliente, adicionamos 500ms de buffer
  const SHOT_OVERLAY_DELAY = 3500;

  await new Promise(resolve => setTimeout(resolve, SHOT_OVERLAY_DELAY));

  // Finalizar round no banco de dados
  gamePersistenceService.endRound(code, room.currentRound, winnerId || '')
    .catch(err => console.error('[DB] Erro ao finalizar round:', err));

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

    // Calculate awards
    const awards = calculateAwards(room.players);

    // Finalizar sessão de match no games-admin (tracking de tempo)
    const playerSocketIds = room.players.map(p => p.id);
    endMatchSession(code, playerSocketIds);

    // Persistir no banco de dados (await para obter xpResults)
    const winnerUserData = gameWinner ? socketUserMap.get(gameWinner.id) : null;
    let xpResults;
    try {
      const endResult = await gamePersistenceService.endGame({
        roomCode: code,
        winnerId: gameEnd.winnerId,
        winnerUserId: winnerUserData?.odUserId,
        playerStats,
      });
      xpResults = endResult?.xpResults;

      // Process achievements and badges if game was persisted
      if (endResult) {
        try {
          // Build extended stats for achievement service
          const extendedStats: PlayerEndGameStats[] = sortedPlayers.map((p, index) => {
            const uData = socketUserMap.get(p.id);
            return {
              odId: p.id,
              odUserId: uData?.odUserId,
              playerName: p.name,
              position: index + 1,
              roundsWon: p.roundWins,
              totalRounds: room.currentRound,
              totalPlayers: room.players.length,

              // Standard stats
              damageDealt: p.stats.damageDealt,
              damageTaken: p.stats.damageTaken,
              selfDamage: p.stats.selfDamage,
              shotsFired: p.stats.shotsFired,
              itemsUsed: p.stats.itemsUsed,
              kills: p.stats.kills,
              deaths: p.stats.deaths,

              // Extended tracking
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

              // Context - ELO data determined by achievement service from DB
              isWinner: p.id === gameEnd.winnerId,
              lowestEloInGame: false, // Will be determined by achievement service if needed
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

          // Include badges in game over
          io.to(code).emit('gameOver', {
            winner: gameWinner ? gameService.toPublicPlayer(gameWinner as never) : null,
            reason: 'Todos os rounds foram jogados',
            stats: playerStats,
            awards,
            xpResults: xpResults || undefined,
            badges: achievementResult.badges.length > 0 ? achievementResult.badges : undefined,
          });
        } catch (achievementError) {
          console.error('[Achievement] Erro ao processar achievements:', achievementError);
          // Emit game over without achievement data
          io.to(code).emit('gameOver', {
            winner: gameWinner ? gameService.toPublicPlayer(gameWinner as never) : null,
            reason: 'Todos os rounds foram jogados',
            stats: playerStats,
            awards,
            xpResults: xpResults || undefined,
          });
        }
      } else {
        // endGame returned null - emit without xp/achievements
        io.to(code).emit('gameOver', {
          winner: gameWinner ? gameService.toPublicPlayer(gameWinner as never) : null,
          reason: 'Todos os rounds foram jogados',
          stats: playerStats,
          awards,
        });
      }
    } catch (err) {
      console.error('[DB] Erro ao finalizar jogo:', err);
      // Still emit game over even if persistence failed
      io.to(code).emit('gameOver', {
        winner: gameWinner ? gameService.toPublicPlayer(gameWinner as never) : null,
        reason: 'Todos os rounds foram jogados',
        stats: playerStats,
        awards,
      });
    }

    // Delete room after game over (with delay to ensure event is sent)
    setTimeout(() => {
      roomService.deleteRoom(code);
    }, 2000);

    return;
  }

  // Start next round after delay
  setTimeout(() => {
    room.currentRound++;
    const roundData = gameService.startRound(room as never);

    // Salvar novo round no banco de dados
    gamePersistenceService.saveRound({
      roomCode: code,
      roundNumber: roundData.round,
      maxHp: roundData.maxHp,
      shellsLive: roundData.shells.live,
      shellsBlank: roundData.shells.blank,
    }).catch(err => console.error('[DB] Erro ao salvar round:', err));

    // Start turn timer BEFORE emitting to ensure turnStartTime is set
    startTurnTimer(io, room, code, roomService);

    // Emit to each player with their items
    room.players.forEach(player => {
      const playerSocket = io.sockets.sockets.get(player.id);
      if (playerSocket) {
        playerSocket.emit('roundStarted', {
          ...roundData,
          itemsReceived: player.items,
          turnElapsed: room.turnStartTime ? Date.now() - room.turnStartTime : 0,
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

  // Log do timeout
  logger.warn(LOG_CATEGORIES.TIMER, `Turno expirou - ${currentPlayer.name} atirou em si`, {
    roomCode: code,
    socketId: currentPlayer.id,
    playerName: currentPlayer.name,
  });

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
    handleRoundEnd(io, room, code, roomService, result.winner?.id);
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
    turnElapsed: 0, // Turno acabou de começar
  });

  // Se o próximo jogador é um bot, agendar jogada
  const nextPlayerTimeout = room.players.find(p => p.id === nextPlayerId);
  if (nextPlayerTimeout && nextPlayerTimeout.id.startsWith('BOT_')) {
    import('../services/bot/bot.service').then(({ botService }) => {
      const SHOT_OVERLAY_DELAY = 3500;
      botService.scheduleBotTurn(io, room as never, code, roomService, SHOT_OVERLAY_DELAY);
    });
  }
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

  const currentPlayer = room.players[room.currentPlayerIndex];
  logger.debug(LOG_CATEGORIES.TIMER, 'Timer iniciado', {
    roomCode: code,
    currentPlayer: currentPlayer?.name,
    duration: GAME_RULES.TIMERS.TURN_DURATION_MS,
  });

  // Se o jogador atual for um bot, agendar jogada automática
  // Adiciona delay para aguardar o overlay de Round Announcement no cliente (~3s)
  if (currentPlayer && currentPlayer.id.startsWith('BOT_')) {
    import('../services/bot/bot.service').then(({ botService }) => {
      // ROUND_ANNOUNCEMENT_DELAY: tempo que o overlay de round fica visível no cliente
      const ROUND_ANNOUNCEMENT_DELAY = 3500; // 3s overlay + 500ms buffer
      botService.scheduleBotTurn(io, room as never, code, roomService, ROUND_ANNOUNCEMENT_DELAY);
    });
  }
}

// Export the RoomWithTimer interface for use in other files
export type { RoomWithTimer };
