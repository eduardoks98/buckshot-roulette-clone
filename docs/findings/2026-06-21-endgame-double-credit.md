# P0: endGame sem idempotência → recompensa dobrada (XP/ELO/stats-printer)

- **Data:** 2026-06-21
- **Severidade:** P0 (progressão: replay/concorrência do fim de jogo credita XP/ELO/stats em dobro)
- **Lane:** testing/segurança (exploit de persistência/concorrência via `@eduardoks98/testing`)
- **Status:** CORRIGIDO + travado por teste com DB real (`src/server/tests/security/endgame-idempotency.test.ts`).

## Sintoma

`GamePersistenceService.endGame()` credita por jogador: `games_played +1`, `games_won`, `total_xp`,
`total_kills`, `total_deaths`, `rounds_*`, ELO/LP/MMR e leaderboard. A transação interativa (P0 fix
anterior) torna **UM** endGame atômico, mas **não havia guarda de idempotência**: chamar `endGame` 2×
para o mesmo `room_code` (replay de evento, reconexão, restart no meio do fim, dois call-sites
`game.handler`/`room.handler`) creditava tudo **de novo** → XP/ELO/stats-printer.

Reprodução: `endGame(params)` 2× sequenciais → `games_played = 2`, `total_xp`/`total_kills` em dobro.

## Causa-raiz

Dentro da transação, o jogo era finalizado com um `update` **incondicional**
(`status = COMPLETED`) seguido do crédito — sem checar se já estava `COMPLETED`. Nada impedia uma
2ª execução de rodar o mesmo crédito. (Sob concorrência o MySQL às vezes abortava as duplicatas por
deadlock — mas isso é acidental, não uma garantia; o replay sequencial creditava sempre.)

## Correção

Gate de idempotência **atômico** no início da transação: finaliza o jogo de forma condicional e só
credita se a transição realmente aconteceu.

```ts
const claim = await tx.game.updateMany({
  where: { room_code: roomCode, status: { not: GameStatus.COMPLETED } },
  data: { status: GameStatus.COMPLETED, winner_id: winnerUserId, ended_at: new Date() },
});
if (claim.count === 0) {
  // jogo já finalizado por outra chamada — idempotente, NÃO credita de novo
  return { gameId: existingGame.id, xpResults: [] };
}
const game = await tx.game.findUniqueOrThrow({ where: { room_code: roomCode }, include: { … } });
// … crédito normal usando `game`
```

O `UPDATE … WHERE status != 'COMPLETED'` é um único statement com lock de linha: sob concorrência só
**uma** transação afeta a linha (count=1); as outras veem count=0 e retornam sem creditar. Sob replay,
a 2ª chamada vê count=0. Determinístico, sem depender de deadlock.

## Prova (DB real)

`src/server/tests/security/endgame-idempotency.test.ts` (consome `@eduardoks98/testing`):
- **replay** (`assertIdempotent`): `endGame` 2× → estado igual a 1× (`games_played=1`, `total_kills=3`).
  RED antes do fix (dobrava), GREEN depois.
- **concorrência** (`ConcurrencyHarness.burstAsync`, 5×): credita exatamente 1× (`games_played=1`,
  `games_won=1`), `game.status=COMPLETED`.

### Como rodar (precisa de um banco *_test isolado)
```bash
cd src/server
DATABASE_URL="mysql://root:root@127.0.0.1:3306/buckshot_roulette_test" npx prisma db push --skip-generate
DATABASE_URL="mysql://root:root@127.0.0.1:3306/buckshot_roulette_test" npm test
```
Guard de segurança: os testes de DB **só rodam** se `DATABASE_URL` contiver `_test`. Um `npm test` sem
isso (DB de dev) **pula** estes testes — nunca suja dados reais. Os testes de lógica pura
(`elo-xp-exploit`) rodam sempre. Toda a suíte: 6 passed.

## Nota (pro dono)

O gate fecha o crédito duplicado na persistência (camada robusta, independente de flag in-memory nos
handlers). Os call-sites `game.handler.ts:685` / `room.handler.ts:150` podem manter o guard in-memory
deles como otimização, mas a garantia de "creditar 1×" agora é do banco. Dep do toolkit ainda via
`file:` local até publicar `@eduardoks98/testing` no npm.
