// ==========================================
// ELO CALCULATOR
// Sistema de ranking baseado na fórmula ELO padrão
// ==========================================

const K_FACTOR = 32; // Constante de ajuste (quanto maior, mais volátil o ELO)

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
 * Calcula ELO para partida com múltiplos jogadores (2-4)
 * @param playerElo ELO do jogador
 * @param allPlayersElo Array com ELO de TODOS os jogadores (incluindo o próprio)
 * @param playerPosition Posição final do jogador (1 = vencedor, 2 = segundo, etc)
 * @param totalPlayers Número total de jogadores na partida
 * @returns Mudança de ELO
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
