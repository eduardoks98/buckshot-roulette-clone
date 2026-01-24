// ==========================================
// ITEM PROCESSOR - LÓGICA DE ITENS COMPARTILHADA
// ==========================================

import { ItemId } from '../types/item.types';
import { ShellType, getRandomPhonePosition, rollExpiredMedicine } from '../utils/gameUtils';

// ==========================================
// TYPES
// ==========================================

export interface ItemContext {
  // Shell state
  shells: ShellType[];
  currentShellIndex: number;
  revealedShell: ShellType | null;

  // User state
  userId: string;
  userName: string;
  userHp: number;
  userMaxHp: number;
  userSawedOff: boolean;

  // Target state (for items that need a target)
  targetId?: string;
  targetName?: string;
  targetHp?: number;
  targetMaxHp?: number;
  targetHandcuffed?: boolean;
  targetHandcuffImmune?: boolean;
  targetItems?: { id: string; emoji: string; name: string }[];

  // For adrenaline - which item to steal
  stolenItemIndex?: number;

  // Turn direction (for turn_reverser)
  turnDirection: 1 | -1;
}

export interface ItemEffect {
  success: boolean;
  message: string;

  // State changes
  revealedShell?: ShellType;
  ejectedShell?: ShellType;
  advanceShellIndex?: boolean;
  clearRevealedShell?: boolean;

  // HP changes
  userHpChange?: number;
  targetHpChange?: number;

  // Status changes
  userSawedOff?: boolean;
  targetHandcuffed?: boolean;
  targetHandcuffImmune?: boolean;

  // Shell manipulation
  invertCurrentShell?: boolean;

  // Phone result
  phonePosition?: number;
  phoneShell?: ShellType;

  // Turn reverser
  invertTurnDirection?: boolean;

  // Adrenaline
  stolenItem?: { id: string; emoji: string; name: string };
  useStolenItemImmediately?: boolean;

  // Expired medicine
  medicineSuccess?: boolean;

  // User eliminated
  userEliminated?: boolean;

  // Error
  error?: string;
}

// ==========================================
// ITEM VALIDATORS
// ==========================================

export function validateItemUse(itemId: ItemId, context: ItemContext): string | null {
  switch (itemId) {
    case 'handcuffs':
      if (!context.targetId) return 'Selecione um alvo';
      if (context.targetId === context.userId) return 'Não pode algemar a si mesmo';
      if (context.targetHandcuffed) return 'Alvo já está algemado!';
      if (context.targetHandcuffImmune) return 'Alvo imune a algemas';
      break;

    case 'hand_saw':
      if (context.userSawedOff) return 'Cano já está serrado!';
      break;

    case 'beer':
      if (context.currentShellIndex >= context.shells.length) {
        return 'Não há cartuchos para ejetar!';
      }
      break;

    case 'phone':
      if (context.shells.length - context.currentShellIndex <= 1) {
        return 'Não há cartuchos além do atual para revelar!';
      }
      break;

    case 'adrenaline':
      if (!context.targetId) return 'Selecione um alvo';
      if (context.targetId === context.userId) return 'Não pode roubar de si mesmo';
      if (!context.targetItems || context.targetItems.length === 0) {
        return 'Alvo não tem itens';
      }
      if (context.stolenItemIndex === undefined) {
        return 'Selecione um item para roubar';
      }
      if (context.stolenItemIndex < 0 || context.stolenItemIndex >= context.targetItems.length) {
        return 'Item inválido';
      }
      if (context.targetItems[context.stolenItemIndex].id === 'adrenaline') {
        return 'Não pode roubar outra Adrenalina!';
      }
      break;

    case 'turn_reverser':
      // Só funciona com mais de 2 jogadores
      // Mas a validação de quantos jogadores tem é feita no server/client
      break;
  }

  return null; // No error
}

// ==========================================
// ITEM EFFECT PROCESSORS
// ==========================================

export function processItemEffect(itemId: ItemId, context: ItemContext): ItemEffect {
  // Validate first
  const validationError = validateItemUse(itemId, context);
  if (validationError) {
    return { success: false, message: validationError, error: validationError };
  }

  switch (itemId) {
    case 'magnifying_glass':
      return processMagnifyingGlass(context);

    case 'beer':
      return processBeer(context);

    case 'cigarettes':
      return processCigarettes(context);

    case 'handcuffs':
      return processHandcuffs(context);

    case 'hand_saw':
      return processHandSaw(context);

    case 'phone':
      return processPhone(context);

    case 'inverter':
      return processInverter(context);

    case 'adrenaline':
      return processAdrenaline(context);

    case 'expired_medicine':
      return processExpiredMedicine(context);

    case 'turn_reverser':
      return processTurnReverser(context);

    default:
      return { success: false, message: 'Item desconhecido', error: 'Item desconhecido' };
  }
}

// ==========================================
// INDIVIDUAL ITEM PROCESSORS
// ==========================================

function processMagnifyingGlass(context: ItemContext): ItemEffect {
  const currentShell = context.shells[context.currentShellIndex];
  return {
    success: true,
    message: `Cartucho atual: ${currentShell === 'live' ? 'LIVE' : 'BLANK'}`,
    revealedShell: currentShell,
  };
}

function processBeer(context: ItemContext): ItemEffect {
  const ejectedShell = context.shells[context.currentShellIndex];
  return {
    success: true,
    message: `Cartucho ejetado: ${ejectedShell === 'live' ? 'LIVE' : 'BLANK'}`,
    ejectedShell,
    advanceShellIndex: true,
    clearRevealedShell: true,
  };
}

function processCigarettes(context: ItemContext): ItemEffect {
  if (context.userHp >= context.userMaxHp) {
    return {
      success: true,
      message: 'HP já está no máximo',
      userHpChange: 0,
    };
  }
  return {
    success: true,
    message: 'Recuperou 1 HP',
    userHpChange: 1,
  };
}

function processHandcuffs(context: ItemContext): ItemEffect {
  return {
    success: true,
    message: `${context.targetName} foi algemado!`,
    targetHandcuffed: true,
    targetHandcuffImmune: true,
  };
}

function processHandSaw(_context: ItemContext): ItemEffect {
  return {
    success: true,
    message: 'Próximo tiro causa dano dobrado!',
    userSawedOff: true,
  };
}

function processPhone(context: ItemContext): ItemEffect {
  const result = getRandomPhonePosition(context.shells, context.currentShellIndex);
  if (!result) {
    return {
      success: false,
      message: 'Não há cartuchos além do atual',
      error: 'Não há cartuchos além do atual',
    };
  }

  // Posição absoluta (1-indexed para mostrar ao jogador)
  const absolutePosition = context.currentShellIndex + result.position + 1;
  const shellType = result.shell === 'live' ? '🔴 LIVE' : '🔵 BLANK';

  return {
    success: true,
    message: `Cartucho #${absolutePosition}: ${shellType}`,
    phonePosition: absolutePosition,
    phoneShell: result.shell,
  };
}

function processInverter(_context: ItemContext): ItemEffect {
  return {
    success: true,
    message: 'Cartucho invertido!',
    invertCurrentShell: true,
    clearRevealedShell: true,
  };
}

function processAdrenaline(context: ItemContext): ItemEffect {
  const stolenItem = context.targetItems![context.stolenItemIndex!];
  return {
    success: true,
    message: `Roubou ${stolenItem.emoji} ${stolenItem.name} de ${context.targetName}!`,
    stolenItem,
    useStolenItemImmediately: true,
  };
}

function processExpiredMedicine(context: ItemContext): ItemEffect {
  const result = rollExpiredMedicine();

  if (result.heal) {
    const actualHeal = Math.min(result.amount, context.userMaxHp - context.userHp);
    return {
      success: true,
      message: `Remédio funcionou! +${actualHeal} HP`,
      userHpChange: actualHeal,
      medicineSuccess: true,
    };
  } else {
    const newHp = context.userHp - result.amount;
    return {
      success: true,
      message: 'Remédio vencido! -1 HP',
      userHpChange: -result.amount,
      medicineSuccess: false,
      userEliminated: newHp <= 0,
    };
  }
}

function processTurnReverser(_context: ItemContext): ItemEffect {
  return {
    success: true,
    message: 'Direção dos turnos invertida!',
    invertTurnDirection: true,
  };
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Verifica se um item requer alvo
 */
export function itemRequiresTarget(itemId: ItemId): boolean {
  return itemId === 'handcuffs' || itemId === 'adrenaline';
}

/**
 * Verifica se um item é roubável (não é adrenalina)
 */
export function itemIsStealable(itemId: ItemId): boolean {
  return itemId !== 'adrenaline';
}
