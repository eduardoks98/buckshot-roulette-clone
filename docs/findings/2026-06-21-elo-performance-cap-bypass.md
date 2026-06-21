# Bug: cap anti-exploit de ELO furado por sub-score não-clampado (ganho de ELO ilimitado)

- **Data:** 2026-06-21
- **Severidade:** P1 (ranking: ganho de ELO arbitrário se stats de performance vierem inflados)
- **Lane:** testing/segurança (achado ao fiar `@eduardoks98/testing` Node no BangShot)
- **Status:** CORRIGIDO + travado por teste (`src/server/tests/security/elo-xp-exploit.test.ts`).

## Sintoma

`shared/utils/eloCalculator.ts` declara um cap anti-exploit explícito
(`MAX_PERFORMANCE_BONUS = 15`, `MIN_PERFORMANCE_PENALTY = -10`, comentário "Limites para evitar
exploits"). Mas com stats de performance inflados, `calculatePerformanceBasedElo().performanceModifier`
chegou a **750008** (vs. cap 15) — o cap era ilusório.

## Causa-raiz

`calculatePerformanceScore` combina 4 sub-scores que **deveriam** estar todos em [0,1]. Três
(`damageEfficiency`, `killContribution`, `survivalScore`) terminam com `Math.max(0, Math.min(1, …))`.
**`calculateRoundDominance` não clampava:** retornava `roundsWon / totalRounds` cru. Com `roundsWon`
inflado (ex.: `1_000_000 / 10 = 100000`), o score de performance explodia, e como
`performanceToEloModifier` **também não tinha cap rígido** (confiava no score estar em [0,1]), o
modificador estourava o limite documentado → ganho de ELO praticamente ilimitado.

Reprodução (teste): `performance.roundsWon` >> `totalRounds` → `performanceModifier = 750008`.

## Correção

1. `calculateRoundDominance` agora clampa em [0,1] como os três irmãos.
2. `performanceToEloModifier` aplica **cap rígido** final
   (`Math.max(MIN_PERFORMANCE_PENALTY, Math.min(MAX_PERFORMANCE_BONUS, modifier))`) — defesa em
   profundidade: o modificador respeita [-10, +15] mesmo que algum sub-score futuro saia de faixa.

Seguro pro jogo legítimo: numa partida real `roundsWon ≤ totalRounds` → `roundDominance ≤ 1`, então o
clamp só afeta entradas fora de faixa (o exploit). Nenhum resultado de partida válida muda.

## Prova

`src/server/tests/security/elo-xp-exploit.test.ts` (roda com `npm test` no `src/server`,
`node:test` + `ts-node/register/transpile-only`), consumindo o toolkit `@eduardoks98/testing`:
- **ELO**: `performanceModifier` respeita o cap (15 / -10) mesmo com stats absurdos (RED→GREEN — pegou
  o 750008); vencedor sempre ≥ +5 e último ≤ -5.
- **XP**: o `breakdown` soma exatamente o `baseXp` (sem XP escondido — `assertCoinsConserved`); `totalXp`
  = `round(baseXp × multiplicador)`; `getLevelInfo` nunca estoura `displayLevel` (1..50) nem fica
  negativo, mesmo com XP absurdo (`assertColumnNoOverflow`/`assertCapRespected`).

`npm test` → 4 passed.

## Nota de integração (pro dono)

O teste consome `@eduardoks98/testing` via `file:../../../package-testing-js` (link local — os repos
ficam lado a lado em `E:/Cursor/`). **Quando o pacote for publicado no npm**, trocar por uma faixa de
versão (`^0.1`). O exploit surface de socket/Prisma (endGame dedup/idempotência sob concorrência real)
fica pra um próximo passo — precisa subir server + DB de teste (usar `ConcurrencyHarness.burstAsync`).
