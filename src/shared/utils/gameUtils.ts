// ==========================================
// GAME UTILITIES - FUNÇÕES COMPARTILHADAS
// ==========================================

import { GAME_RULES } from '../constants/game-rules';

// ==========================================
// TYPES
// ==========================================

export type ShellType = 'live' | 'blank';

export interface ShellInfo {
  total: number;
  live: number;
  blank: number;
}

// ==========================================
// RANDOM UTILITIES
// ==========================================

/**
 * Retorna um número aleatório entre min e max (inclusive)
 */
export function getRandomInRange(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Embaralha um array usando Fisher-Yates shuffle
 */
export function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// ==========================================
// HP UTILITIES
// ==========================================

/**
 * Gera um HP aleatório dentro dos limites das regras
 */
export function getRandomHP(): number {
  return getRandomInRange(GAME_RULES.HP.MIN, GAME_RULES.HP.MAX);
}

// ==========================================
// SHELL UTILITIES
// ==========================================

/**
 * Gera um array de shells aleatórios seguindo as REGRAS OFICIAIS do Buckshot Roulette:
 * - Total: entre 2 e 8 shells
 * - Número PAR: quantidade IGUAL de live e blank (ex: 4 = 2+2, 6 = 3+3)
 * - Número ÍMPAR: exatamente UMA a mais de live OU blank (ex: 5 = 3+2 ou 2+3)
 */
export function generateShells(): ShellType[] {
  const totalShells = getRandomInRange(
    GAME_RULES.SHELLS.MIN_TOTAL,
    GAME_RULES.SHELLS.MAX_TOTAL
  );

  let liveCount: number;
  let blankCount: number;

  if (totalShells % 2 === 0) {
    // REGRA OFICIAL: Número par = quantidade IGUAL de live e blank
    liveCount = totalShells / 2;
    blankCount = totalShells / 2;
  } else {
    // REGRA OFICIAL: Número ímpar = exatamente 1 a mais de live OU blank
    const halfFloor = Math.floor(totalShells / 2);
    const halfCeil = Math.ceil(totalShells / 2);

    // 50% chance de ter mais live ou mais blank
    if (Math.random() < 0.5) {
      liveCount = halfCeil;   // Ex: 3 live
      blankCount = halfFloor; // Ex: 2 blank
    } else {
      liveCount = halfFloor;  // Ex: 2 live
      blankCount = halfCeil;  // Ex: 3 blank
    }
  }

  const shells: ShellType[] = [
    ...Array(liveCount).fill('live'),
    ...Array(blankCount).fill('blank'),
  ];

  return shuffle(shells);
}

/**
 * Conta os shells restantes a partir de um índice
 */
export function getShellCounts(shells: ShellType[], currentIndex: number): ShellInfo {
  const remaining = shells.slice(currentIndex);
  return {
    total: remaining.length,
    live: remaining.filter(s => s === 'live').length,
    blank: remaining.filter(s => s === 'blank').length,
  };
}

/**
 * Retorna o shell atual (na posição do índice)
 */
export function getCurrentShell(shells: ShellType[], currentIndex: number): ShellType | null {
  if (currentIndex >= shells.length) return null;
  return shells[currentIndex];
}

// ==========================================
// DAMAGE UTILITIES
// ==========================================

/**
 * Calcula o dano baseado no tipo de shell e se a arma está serrada
 */
export function calculateDamage(shell: ShellType, sawedOff: boolean): number {
  if (shell === 'blank') return 0;
  return sawedOff ? GAME_RULES.DAMAGE.SAWED_OFF : GAME_RULES.DAMAGE.NORMAL;
}

// ==========================================
// ITEM UTILITIES
// ==========================================

/**
 * Calcula quantos itens distribuir por reload
 */
export function getItemCountPerReload(): number {
  return getRandomInRange(
    GAME_RULES.ITEMS.PER_RELOAD.MIN,
    GAME_RULES.ITEMS.PER_RELOAD.MAX
  );
}

/**
 * Verifica se um jogador pode receber mais itens
 */
export function canReceiveMoreItems(currentItemCount: number): boolean {
  return currentItemCount < GAME_RULES.ITEMS.MAX_PER_PLAYER;
}

// ==========================================
// MEDICINE UTILITIES
// ==========================================

/**
 * Resultado do uso de Expired Medicine (50% chance cada)
 */
export function rollExpiredMedicine(): { heal: boolean; amount: number } {
  const heal = Math.random() < 0.5;
  return {
    heal,
    amount: heal ? 2 : 1, // +2 HP se curar, -1 HP se falhar
  };
}

// ==========================================
// PHONE UTILITIES
// ==========================================

/**
 * Escolhe uma posição aleatória para o telefone revelar
 * Exclui a posição atual (currentIndex)
 */
export function getRandomPhonePosition(
  shells: ShellType[],
  currentIndex: number
): { position: number; shell: ShellType } | null {
  const remaining = shells.length - currentIndex;
  if (remaining <= 1) return null;

  // Posições disponíveis (excluindo a atual)
  const availablePositions: number[] = [];
  for (let i = currentIndex + 1; i < shells.length; i++) {
    availablePositions.push(i);
  }

  if (availablePositions.length === 0) return null;

  const randomIndex = Math.floor(Math.random() * availablePositions.length);
  const position = availablePositions[randomIndex];

  return {
    position: position - currentIndex, // Posição relativa (1 = próximo, 2 = depois, etc.)
    shell: shells[position],
  };
}
