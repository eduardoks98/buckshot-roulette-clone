// ==========================================
// UTILITY HELPERS
// Funcoes utilitarias compartilhadas
// ==========================================

/**
 * Retorna a cor associada a um rank
 */
export const getRankColor = (rank: string): string => {
  const colors: Record<string, string> = {
    Bronze: '#cd7f32',
    Silver: '#c0c0c0',
    Gold: '#ffd700',
    Platinum: '#e5e4e2',
    Diamond: '#b9f2ff',
    Master: '#ff6b6b',
    Grandmaster: '#ff4757',
  };
  return colors[rank] || '#c0c0c0';
};

/**
 * Retorna o icone/emoji para uma posicao no ranking
 */
export const getRankIcon = (rank: number): string => {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return `#${rank}`;
};

/**
 * Formata uma data ISO para exibicao em pt-BR
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Formata uma data ISO para exibicao curta (apenas data)
 */
export const formatDateShort = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  });
};

/**
 * Calcula win rate como porcentagem
 */
export const calculateWinRate = (gamesWon: number, gamesPlayed: number): number => {
  if (gamesPlayed === 0) return 0;
  return (gamesWon / gamesPlayed) * 100;
};

/**
 * Calcula K/D ratio
 */
export const calculateKD = (kills: number, deaths: number): string => {
  if (deaths === 0) return kills.toString();
  return (kills / deaths).toFixed(2);
};

/**
 * Converte ELO rating para nome do rank
 */
export const getRankFromElo = (elo: number): string => {
  if (elo >= 2500) return 'Grandmaster';
  if (elo >= 2200) return 'Master';
  if (elo >= 1900) return 'Diamond';
  if (elo >= 1600) return 'Platinum';
  if (elo >= 1300) return 'Gold';
  if (elo >= 1000) return 'Silver';
  return 'Bronze';
};
