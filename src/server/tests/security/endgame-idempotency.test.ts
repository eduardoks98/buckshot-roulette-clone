import { test, beforeEach } from 'node:test';
import * as assert from 'node:assert';

import prisma from '../../src/lib/prisma';
import { gamePersistenceService } from '../../src/services/game/game.persistence.service';
import { assertIdempotent } from '@eduardoks98/testing';
import { ConcurrencyHarness } from '@eduardoks98/testing';

/**
 * TESTES ADVERSARIAIS — idempotência do endGame (persistência, Bang Shot), com DB real (MySQL).
 *
 * O endGame credita games_played/games_won/total_xp/total_kills/ELO. Se for chamado 2x pro MESMO
 * jogo (replay de evento, reconexão, restart no meio do fim), NÃO pode creditar de novo — senão é
 * money/XP/ELO-printer. Prova via ESTADO no banco: replay sequencial idempotente + concorrência real
 * (burstAsync) credita exatamente 1x.
 *
 * SEGURANÇA: só roda contra um banco *_test (guard abaixo). `npm test` no DB de dev PULA estes testes
 * — nunca suja dados reais. Rodar: DATABASE_URL="mysql://root:root@127.0.0.1:3306/buckshot_roulette_test" npm test
 */

const DB_OK = (process.env.DATABASE_URL || '').includes('_test');
const guard = DB_OK ? {} : { skip: 'requer DATABASE_URL apontando p/ um banco *_test' };

async function resetDb(): Promise<void> {
  await prisma.leaderboardEntry.deleteMany({});
  await prisma.gameParticipant.deleteMany({});
  await prisma.game.deleteMany({});
  await prisma.user.deleteMany({});
}

async function seedFinishedGame(roomCode: string) {
  const mk = (n: string) =>
    prisma.user.create({
      data: {
        email: `${n}-${roomCode}@x.com`,
        username: `${n}-${roomCode}`,
        display_name: n,
        elo_rating: 1000,
        mmr_hidden: 1000,
      },
    });
  const userA = await mk('A');
  const userB = await mk('B');

  const game = await prisma.game.create({
    data: {
      room_code: roomCode,
      status: 'IN_PROGRESS',
      is_ranked: true,
      current_round: 5,
      max_players: 2,
      game_participants: {
        create: [
          { user_id: userA.id, socket_id: 'sockA' },
          { user_id: userB.id, socket_id: 'sockB' },
        ],
      },
    },
  });

  const playerStats = [
    { odId: 'sockA', odUserId: userA.id, position: 1, roundsWon: 3, damageDealt: 30, damageTaken: 10, selfDamage: 0, shotsFired: 10, itemsUsed: 2, kills: 3, deaths: 1 },
    { odId: 'sockB', odUserId: userB.id, position: 2, roundsWon: 1, damageDealt: 10, damageTaken: 30, selfDamage: 5, shotsFired: 8, itemsUsed: 1, kills: 1, deaths: 3 },
  ];

  return { userA, userB, game, params: { roomCode, winnerUserId: userA.id, playerStats } };
}

beforeEach(async () => {
  if (!DB_OK) return;
  await resetDb();
});

/**
 * REPLAY: chamar endGame 2x pro mesmo jogo tem de deixar o estado igual a chamar 1x.
 * Hoje (sem guard de status) o 2º crédito dobra games_played/total_xp/total_kills.
 */
test('endGame e idempotente: replay nao credita recompensa duas vezes', guard, async () => {
  const { userA, params } = await seedFinishedGame('DEDUP-REPLAY');

  await assertIdempotent(
    () => gamePersistenceService.endGame(params),
    async () => {
      const u = await prisma.user.findUniqueOrThrow({
        where: { id: userA.id },
        select: { games_played: true, games_won: true, total_xp: true, total_kills: true, elo_rating: true },
      });
      return u;
    },
    'endGame nao e idempotente: replay creditou recompensa de novo (XP/ELO/stats em dobro)',
  );

  const u = await prisma.user.findUniqueOrThrow({ where: { id: userA.id } });
  assert.strictEqual(u.games_played, 1, 'games_played deveria ser 1 apos replay');
  assert.strictEqual(u.total_kills, 3, 'total_kills deveria ser 3 (creditado 1x)');
});

/**
 * CONCORRÊNCIA REAL: N endGame simultâneos pro mesmo jogo (burstAsync) só podem creditar 1x.
 * Em Node, burstAsync intercala nos awaits de I/O — expõe a corrida de verdade.
 */
test('endGame sob concorrencia credita exatamente uma vez', guard, async () => {
  const { userA, userB, params } = await seedFinishedGame('DEDUP-RACE');

  const r = await ConcurrencyHarness.burstAsync(5, () => gamePersistenceService.endGame(params));
  // pelo menos uma chamada tem de ter finalizado o jogo
  assert.ok(r.fulfilled >= 1, 'nenhuma chamada de endGame concluiu');

  const a = await prisma.user.findUniqueOrThrow({ where: { id: userA.id } });
  const b = await prisma.user.findUniqueOrThrow({ where: { id: userB.id } });

  assert.strictEqual(a.games_played, 1, `vencedor games_played deveria ser 1, foi ${a.games_played} (double-credit sob corrida)`);
  assert.strictEqual(a.games_won, 1, `games_won deveria ser 1, foi ${a.games_won}`);
  assert.strictEqual(a.total_kills, 3, `total_kills deveria ser 3 (1x), foi ${a.total_kills}`);
  assert.strictEqual(b.games_played, 1, `perdedor games_played deveria ser 1, foi ${b.games_played}`);

  const game = await prisma.game.findUniqueOrThrow({ where: { room_code: 'DEDUP-RACE' } });
  assert.strictEqual(game.status, 'COMPLETED');
});
