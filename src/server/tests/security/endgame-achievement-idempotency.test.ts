import { test, beforeEach } from 'node:test';
import * as assert from 'node:assert';

import prisma from '../../src/lib/prisma';
import { gamePersistenceService } from '../../src/services/game/game.persistence.service';
import { achievementService } from '../../src/services/achievement.service';

/**
 * TESTE ADVERSARIAL — double-credit de ACHIEVEMENTS/WIN-STREAK/STATS VITALÍCIOS no fim de jogo.
 *
 * O fix de idempotência anterior cobriu o crédito NÚCLEO (games_played/xp/elo) dentro do endGame,
 * mas processGameEnd (achievements/win-streak/total_* vitalícios) roda no HANDLER, FORA do gate.
 * O handler chamava processGameEnd sempre que endResult era truthy — inclusive no replay (endGame
 * retorna truthy mesmo quando já finalizado) → creditava achievements/streak/stats DE NOVO.
 *
 * Fix: endGame passou a devolver `finalized` (true só quando finalizou AGORA); o handler só chama
 * processGameEnd quando finalized===true. Este teste reproduz o fluxo do handler e prova crédito 1x.
 *
 * Só roda contra um banco *_test (guard). Rodar:
 *   DATABASE_URL="mysql://sail:secret@127.0.0.1:3307/buckshot_roulette_test" npm test
 */

const DB_OK = (process.env.DATABASE_URL || '').includes('_test');
const guard = DB_OK ? {} : { skip: 'requer DATABASE_URL apontando p/ um banco *_test' };

async function resetDb(): Promise<void> {
  await prisma.userAchievement?.deleteMany?.({}).catch(() => {});
  await prisma.gameBadge?.deleteMany?.({}).catch(() => {});
  await prisma.leaderboardEntry.deleteMany({});
  await prisma.gameParticipant.deleteMany({});
  await prisma.game.deleteMany({});
  await prisma.user.deleteMany({});
}

beforeEach(async () => {
  if (!DB_OK) return;
  await resetDb();
});

// Stats "estendidas" no mesmo shape que os handlers montam (só os campos numéricos importam
// para os increments; o resto vai com 0 para não gerar undefined no Prisma).
function extStats(odUserId: string, isWinner: boolean) {
  return {
    odId: 'sock-' + odUserId, odUserId, playerName: 'P', position: isWinner ? 1 : 2,
    roundsWon: isWinner ? 3 : 1, totalRounds: 5, totalPlayers: 2,
    damageDealt: 30, damageTaken: 10, selfDamage: 0, shotsFired: 10, itemsUsed: 2, kills: 3, deaths: 1,
    sawedShots: 2, liveHits: 4, expiredMedicineSurvived: 0, adrenalineUses: 1, handcuffUses: 1, infoItemUses: 1,
    itemsUsedBitmask: 0, firstBloodInGame: false, maxConsecutiveTurnsAt1Hp: 0, killsPerRound: 0,
    roundsSurvivedAsLast: 0, wonRoundWithZeroShots: false, wonRoundWithZeroItems: false, finalHp: 2,
    uniqueItemsUsedInGame: 2, adrenalineUsesInGame: 1, expiredMedicineSurvivedInGame: 0, liveHitsInGame: 4,
    allShotsLiveInGame: false, lostEarlyRounds: false, isWinner, lowestEloInGame: false,
  } as never;
}

async function seed(roomCode: string) {
  const mk = (n: string) => prisma.user.create({
    data: { email: `${n}-${roomCode}@x.com`, username: `${n}-${roomCode}`, display_name: n, elo_rating: 1000, mmr_hidden: 1000 },
  });
  const userA = await mk('A');
  const userB = await mk('B');
  await prisma.game.create({
    data: {
      room_code: roomCode, status: 'IN_PROGRESS', is_ranked: true, current_round: 5, max_players: 2,
      game_participants: { create: [{ user_id: userA.id, socket_id: 'sockA' }, { user_id: userB.id, socket_id: 'sockB' }] },
    },
  });
  const playerStats = [
    { odId: 'sockA', odUserId: userA.id, position: 1, roundsWon: 3, damageDealt: 30, damageTaken: 10, selfDamage: 0, shotsFired: 10, itemsUsed: 2, kills: 3, deaths: 1 },
    { odId: 'sockB', odUserId: userB.id, position: 2, roundsWon: 1, damageDealt: 10, damageTaken: 30, selfDamage: 5, shotsFired: 8, itemsUsed: 1, kills: 1, deaths: 3 },
  ];
  return { userA, userB, params: { roomCode, winnerUserId: userA.id, playerStats } };
}

// Reproduz a decisão do handler: só processa achievements quando finalized===true.
async function handlerEndGameFlow(params: any, extended: any[]) {
  const endResult = await gamePersistenceService.endGame(params);
  if (endResult && endResult.finalized) {
    await achievementService.processGameEnd(endResult.gameId, extended);
  }
  return endResult;
}

test('endGame sinaliza finalized: true na 1a vez, false no replay', guard, async () => {
  const { params } = await seed('FIN-FLAG');

  const first = await gamePersistenceService.endGame(params);
  const replay = await gamePersistenceService.endGame(params);

  assert.strictEqual(first?.finalized, true, '1a chamada deveria finalizar (finalized:true)');
  assert.strictEqual(replay?.finalized, false, 'replay NÃO pode finalizar de novo (finalized:false)');
});

test('replay do fim de jogo NÃO credita achievements/win-streak/stats vitalícios 2x', guard, async () => {
  const s = await seed('ACH-REPLAY');
  const extended = [extStats(s.userA.id, true), extStats(s.userB.id, false)];

  // 1º fim de jogo (finaliza) -> credita achievements/streak 1x
  const r1 = await handlerEndGameFlow(s.params, extended);
  assert.strictEqual(r1?.finalized, true);

  // 2º fim (replay: mesmo room_code) -> finalized:false -> processGameEnd NÃO roda
  const r2 = await handlerEndGameFlow(s.params, extended);
  assert.strictEqual(r2?.finalized, false);

  const w = await prisma.user.findUniqueOrThrow({ where: { id: s.userA.id } });
  assert.strictEqual(w.current_win_streak, 1, `win-streak deveria ser 1, foi ${w.current_win_streak} (double-credit)`);
  assert.strictEqual(w.total_damage_dealt, 30, `total_damage_dealt deveria ser 30 (1x), foi ${w.total_damage_dealt}`);
  assert.strictEqual(w.total_live_hits, 4, `total_live_hits deveria ser 4 (1x), foi ${w.total_live_hits}`);
});
