// ==========================================
// ELO CALCULATOR
// Sistema de ranking baseado na fórmula ELO padrão
// Com modificadores de performance
// ==========================================

const K_FACTOR = 32; // Constante de ajuste (quanto maior, mais volátil o ELO)

// Pesos para o cálculo de ELO
const BASE_WEIGHT = 0.4;        // Peso da posição final
const PERFORMANCE_WEIGHT = 0.6; // Peso do desempenho

// Limites para evitar exploits
const MAX_PERFORMANCE_BONUS = 15;   // Máximo bonus por performance
const MIN_PERFORMANCE_PENALTY = -10; // Mínimo penalidade por performance

// ==========================================
// TIPOS
// ==========================================

export interface PlayerPerformance {
  damageDealt: number;
  damageTaken: number;
  selfDamage: number;
  kills: number;
  deaths: number;
  roundsWon: number;
  totalRounds: number;
  itemsUsed: number;
  shotsFired: number;
}

export interface GameContext {
  totalPlayers: number;
  totalKills: number;
  totalDamage: number;
  totalRounds: number;
}

export interface EloCalculationInput {
  playerElo: number;
  allPlayersElo: number[];
  playerPosition: number;
  totalPlayers: number;
  performance: PlayerPerformance;
  gameContext: GameContext;
}

export interface EloCalculationResult {
  totalChange: number;
  baseChange: number;
  performanceModifier: number;
  performanceScore: number;
  breakdown: {
    damageEfficiency: number;
    killContribution: number;
    roundDominance: number;
    survivalScore: number;
  };
}

// ==========================================
// FUNÇÕES BASE (MANTIDAS PARA COMPATIBILIDADE)
// ==========================================

/**
 * Calcula a probabilidade esperada de vitória baseada nos ELOs
 * @param playerElo ELO do jogador
 * @param opponentElo ELO do oponente
 * @returns Probabilidade de vitória (0 a 1)
 */
function expectedScore(playerElo: number, opponentElo: number): number {
  return 1 / (1 + Math.pow(10, (opponentElo - playerElo) / 400));
}

/**
 * Calcula a mudança de ELO após uma partida 1v1
 * @param playerElo ELO atual do jogador
 * @param opponentElo ELO do oponente
 * @param won Se o jogador venceu (true) ou perdeu (false)
 * @returns Mudança de ELO (positivo = ganhou, negativo = perdeu)
 */
export function calculateEloChange(
  playerElo: number,
  opponentElo: number,
  won: boolean
): number {
  const expected = expectedScore(playerElo, opponentElo);
  const actual = won ? 1 : 0;
  const change = Math.round(K_FACTOR * (actual - expected));

  // Mínimo de +5 para vitória e -5 para derrota (evitar mudança 0)
  if (won && change < 5) return 5;
  if (!won && change > -5) return -5;

  return change;
}

/**
 * Calcula ELO para partida com múltiplos jogadores (2-4) - VERSÃO ANTIGA
 * Mantida para compatibilidade
 */
export function calculateMultiplayerEloChange(
  playerElo: number,
  allPlayersElo: number[],
  playerPosition: number,
  totalPlayers: number = allPlayersElo.length
): number {
  // Calcular ELO médio dos oponentes (excluindo o próprio jogador)
  const opponentsElo = allPlayersElo.filter(e => e !== playerElo);

  // Se não há oponentes diferentes, usar a média geral
  const avgOpponentElo = opponentsElo.length > 0
    ? opponentsElo.reduce((a, b) => a + b, 0) / opponentsElo.length
    : allPlayersElo.reduce((a, b) => a + b, 0) / allPlayersElo.length;

  // Score baseado na posição:
  // - 2 jogadores: 1º = 1.0, 2º = 0.0
  // - 3 jogadores: 1º = 1.0, 2º = 0.5, 3º = 0.0
  // - 4 jogadores: 1º = 1.0, 2º = 0.66, 3º = 0.33, 4º = 0.0
  let actualScore: number;
  if (totalPlayers === 2) {
    actualScore = playerPosition === 1 ? 1.0 : 0.0;
  } else if (totalPlayers === 3) {
    switch (playerPosition) {
      case 1: actualScore = 1.0; break;
      case 2: actualScore = 0.5; break;
      default: actualScore = 0.0; break;
    }
  } else {
    // 4 jogadores
    switch (playerPosition) {
      case 1: actualScore = 1.0; break;
      case 2: actualScore = 0.66; break;
      case 3: actualScore = 0.33; break;
      default: actualScore = 0.0; break;
    }
  }

  const expected = expectedScore(playerElo, avgOpponentElo);
  let change = Math.round(K_FACTOR * (actualScore - expected));

  // Garantir mudanças mínimas para dar feedback ao jogador
  if (playerPosition === 1 && change < 5) {
    change = 5; // Vencedor sempre ganha pelo menos +5
  } else if (playerPosition === totalPlayers && change > -5) {
    change = -5; // Último sempre perde pelo menos -5
  }

  return change;
}

// ==========================================
// MÉTRICAS DE PERFORMANCE
// ==========================================

/**
 * Calcula a eficiência de dano (0.0 a 1.0)
 * - damageDealt alto + damageTaken baixo = bom
 * - selfDamage penaliza
 */
function calculateDamageEfficiency(perf: PlayerPerformance): number {
  // Se não teve rounds, retorna neutro
  if (perf.totalRounds === 0) return 0.5;

  // Dano líquido = dano causado - dano sofrido - (self damage * 1.5 como penalidade)
  const netDamage = perf.damageDealt - perf.damageTaken - (perf.selfDamage * 1.5);

  // Em média, um jogador causa ~5-10 dano por round
  const expectedDamage = 7 * perf.totalRounds;

  // Normalizar para 0-1 baseado em expectativa
  const efficiency = (netDamage + expectedDamage) / (expectedDamage * 2);

  return Math.max(0, Math.min(1, efficiency));
}

/**
 * Calcula contribuição de kills (0.0 a 1.0)
 * - Kills relativas ao total do jogo
 */
function calculateKillContribution(
  perf: PlayerPerformance,
  context: GameContext
): number {
  // Se ninguém matou, retorna neutro
  if (context.totalKills === 0) return 0.5;

  // Kills esperadas por jogador
  const expectedKills = context.totalKills / context.totalPlayers;

  // Ratio: kills / expected
  const ratio = perf.kills / Math.max(1, expectedKills);

  // Normalizar para 0-1 (0.5 = média, 1.0 = 2x a média)
  return Math.max(0, Math.min(1, ratio / 2));
}

/**
 * Calcula dominância em rounds (0.0 a 1.0)
 * - Rounds vencidos / total de rounds
 */
function calculateRoundDominance(perf: PlayerPerformance): number {
  if (perf.totalRounds === 0) return 0.5;
  return perf.roundsWon / perf.totalRounds;
}

/**
 * Calcula score de sobrevivência (0.0 a 1.0)
 * - Menos mortes = melhor
 * - Menos self-damage = melhor
 */
function calculateSurvivalScore(perf: PlayerPerformance): number {
  if (perf.totalRounds === 0) return 0.5;

  // Penalidade por mortes (max 1 morte esperada por round em média)
  const deathPenalty = perf.deaths / Math.max(1, perf.totalRounds);

  // Penalidade por self-damage (muito danoso)
  const selfDamagePenalty = perf.selfDamage / Math.max(1, perf.totalRounds * 2);

  const score = 1 - (deathPenalty * 0.6) - (selfDamagePenalty * 0.4);
  return Math.max(0, Math.min(1, score));
}

/**
 * Calcula o score de performance total (0.0 a 1.0)
 */
function calculatePerformanceScore(
  perf: PlayerPerformance,
  context: GameContext
): { score: number; breakdown: EloCalculationResult['breakdown'] } {
  const damageEfficiency = calculateDamageEfficiency(perf);
  const killContribution = calculateKillContribution(perf, context);
  const roundDominance = calculateRoundDominance(perf);
  const survivalScore = calculateSurvivalScore(perf);

  const score = (
    (damageEfficiency * 0.30) +
    (killContribution * 0.25) +
    (roundDominance * 0.25) +
    (survivalScore * 0.20)
  );

  return {
    score,
    breakdown: {
      damageEfficiency,
      killContribution,
      roundDominance,
      survivalScore,
    },
  };
}

/**
 * Converte score de performance (0-1) em modificador de ELO
 * - 0.5 = neutro (0 bonus/penalty)
 * - 1.0 = max bonus
 * - 0.0 = max penalty
 */
function performanceToEloModifier(performanceScore: number): number {
  // Centralizar em 0 (-0.5 a +0.5)
  const centered = performanceScore - 0.5;

  // Escalar para limites
  if (centered >= 0) {
    return centered * 2 * MAX_PERFORMANCE_BONUS;
  } else {
    return centered * 2 * Math.abs(MIN_PERFORMANCE_PENALTY);
  }
}

// ==========================================
// FUNÇÃO PRINCIPAL - ELO POR DESEMPENHO
// ==========================================

/**
 * Calcula mudança de ELO considerando posição E desempenho
 * @param input Dados completos para o cálculo
 * @returns Resultado detalhado do cálculo
 */
export function calculatePerformanceBasedElo(input: EloCalculationInput): EloCalculationResult {
  const {
    playerElo,
    allPlayersElo,
    playerPosition,
    totalPlayers,
    performance,
    gameContext,
  } = input;

  // 1. Calcular ELO base por posição (sistema atual)
  const baseChange = calculateMultiplayerEloChange(
    playerElo,
    allPlayersElo,
    playerPosition,
    totalPlayers
  );

  // 2. Calcular score de performance
  const { score: perfScore, breakdown } = calculatePerformanceScore(performance, gameContext);

  // 3. Calcular modificador de performance
  const perfModifier = performanceToEloModifier(perfScore);

  // 4. Combinar com pesos baseado na posição
  let totalChange: number;

  if (playerPosition === 1) {
    // Vencedor: base + bonus de performance (só adiciona, não subtrai)
    const bonusFromPerf = Math.max(0, perfModifier);
    totalChange = baseChange + Math.round(bonusFromPerf * PERFORMANCE_WEIGHT);
  } else if (playerPosition === totalPlayers) {
    // Último lugar: base + modificador (pode reduzir penalty se jogou bem)
    totalChange = baseChange + Math.round(perfModifier * PERFORMANCE_WEIGHT);
  } else {
    // Posições intermediárias: aplicação completa do modificador
    totalChange = Math.round(
      (baseChange * BASE_WEIGHT) +
      (baseChange * PERFORMANCE_WEIGHT) +
      (perfModifier * PERFORMANCE_WEIGHT)
    );
  }

  // 5. Garantir limites mínimos
  if (playerPosition === 1 && totalChange < 5) {
    totalChange = 5; // Vencedor sempre ganha pelo menos +5
  } else if (playerPosition === totalPlayers && totalChange > -5) {
    totalChange = -5; // Último sempre perde pelo menos -5
  }

  return {
    totalChange: Math.round(totalChange),
    baseChange,
    performanceModifier: Math.round(perfModifier),
    performanceScore: perfScore,
    breakdown,
  };
}

// ==========================================
// FUNÇÕES DE RANK
// ==========================================

/**
 * Calcula o rank baseado no ELO
 * @param elo ELO atual
 * @returns Nome do rank
 */
export function getRankFromElo(elo: number): string {
  if (elo >= 2400) return 'Grandmaster';
  if (elo >= 2100) return 'Master';
  if (elo >= 1800) return 'Diamond';
  if (elo >= 1500) return 'Platinum';
  if (elo >= 1200) return 'Gold';
  if (elo >= 900) return 'Silver';
  return 'Bronze';
}

/**
 * Retorna o ELO mínimo para um rank específico
 * @param rank Nome do rank
 * @returns ELO mínimo necessário
 */
export function getMinEloForRank(rank: string): number {
  const ranks: Record<string, number> = {
    'Grandmaster': 2400,
    'Master': 2100,
    'Diamond': 1800,
    'Platinum': 1500,
    'Gold': 1200,
    'Silver': 900,
    'Bronze': 0,
  };
  return ranks[rank] || 0;
}
