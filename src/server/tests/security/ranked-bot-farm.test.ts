import { test, beforeEach } from 'node:test';
import * as assert from 'node:assert';

import prisma from '../../src/lib/prisma';
import { gamePersistenceService } from '../../src/services/game/game.persistence.service';

/**
 * TESTE ADVERSARIAL — farm de ELO/rank contra BOTS.
 *
 * O cliente escolhe gameMode/debugRankEnabled no createRoom, o que definia is_ranked. Um jogador
 * podia abrir sala NORMAL (is_ranked=true) e jogar contra BOTS, farmando ELO/LP/leaderboard.
 * Fix server-authoritative: no endGame, ranked só vale se o roster REAL for todo de humanos
 * autenticados (user_id != null) e >= 2 deles; qualquer bot/guest => sem ELO/LP/leaderboard.
 *
 * Só roda contra um banco *_test (guard).
 */

const DB_OK = (process.env.DATABASE_URL || '').includes('_test');
const guard = DB_OK ? {} : { skip: 'requer DATABASE_URL apontando p/ um banco *_test' };

async function resetDb(): Promise<void> {
  await prisma.leaderboardEntry.deleteMany({});
  await prisma.gameParticipant.deleteMany({});
  await prisma.game.deleteMany({});
  await prisma.user.deleteMany({});
}

const mkUser = (n: string) => prisma.user.create({
  data: { email: `${n}@x.com`, username: n, display_name: n, elo_rating: 1000, mmr_hidden: 1000 },
});

const winnerStats = (odId: string, odUserId?: string) =>
  ({ odId, odUserId, position: 1, roundsWon: 3, damageDealt: 30, damageTaken: 10, selfDamage: 0, shotsFired: 10, itemsUsed: 2, kills: 3, deaths: 1 });
const loserStats = (odId: string, odUserId?: string) =>
  ({ odId, odUserId, position: 2, roundsWon: 1, damageDealt: 10, damageTaken: 30, selfDamage: 5, shotsFired: 8, itemsUsed: 1, kills: 1, deaths: 3 });

beforeEach(async () => { if (DB_OK) await resetDb(); });

test('is_ranked=true mas com BOT no roster NÃO credita ELO/LP/leaderboard (anti-farm)', guard, async () => {
  const human = await mkUser('humano');

  await prisma.game.create({
    data: {
      room_code: 'BOTFARM', status: 'IN_PROGRESS', is_ranked: true, current_round: 5, max_players: 2,
      game_participants: {
        create: [
          { user_id: human.id, socket_id: 'sockH' },
          { socket_id: 'sockBot', guest_name: '[BOT] Dealer' }, // sem user_id = bot
        ],
      },
    },
  });

  const r = await gamePersistenceService.endGame({
    roomCode: 'BOTFARM', winnerUserId: human.id,
    playerStats: [winnerStats('sockH', human.id), loserStats('sockBot')],
  });
  assert.strictEqual(r?.finalized, true);

  const h = await prisma.user.findUniqueOrThrow({ where: { id: human.id } });
  assert.strictEqual(h.elo_rating, 1000, `ELO não pode mudar contra bot, foi ${h.elo_rating} (farm)`);
  assert.strictEqual(h.mmr_hidden, 1000, `MMR não pode mudar contra bot, foi ${h.mmr_hidden}`);
  assert.strictEqual(await prisma.leaderboardEntry.count({ where: { user_id: human.id } }), 0, 'sem leaderboard em jogo com bot');
  // XP/partidas ainda contam (progressão), só o RANK que não
  assert.strictEqual(h.games_played, 1, 'games_played ainda conta (não é rank)');
});

test('ranked ALL-HUMAN (>=2) credita ELO normalmente (controle positivo — não quebrei o ranked real)', guard, async () => {
  const a = await mkUser('A');
  const b = await mkUser('B');

  await prisma.game.create({
    data: {
      room_code: 'REALRANK', status: 'IN_PROGRESS', is_ranked: true, current_round: 5, max_players: 2,
      game_participants: {
        create: [
          { user_id: a.id, socket_id: 'sockA' },
          { user_id: b.id, socket_id: 'sockB' },
        ],
      },
    },
  });

  await gamePersistenceService.endGame({
    roomCode: 'REALRANK', winnerUserId: a.id,
    playerStats: [winnerStats('sockA', a.id), loserStats('sockB', b.id)],
  });

  const aw = await prisma.user.findUniqueOrThrow({ where: { id: a.id } });
  assert.notStrictEqual(aw.elo_rating, 1000, 'ranked all-human DEVE mover o ELO do vencedor');
  assert.ok((await prisma.leaderboardEntry.count({ where: { user_id: a.id } })) > 0, 'ranked all-human gera leaderboard');
});
