// ==========================================
// ITEMS - DEFINIÇÃO DOS ITENS DO JOGO
// ==========================================

import { Item, ItemId } from '../types/item.types';

export const ITEMS: Record<ItemId, Item> = {
  magnifying_glass: {
    id: 'magnifying_glass',
    emoji: '🔍',
    name: 'Lupa',
    description: 'Revela se o cartucho atual é LIVE ou BLANK',
  },
  beer: {
    id: 'beer',
    emoji: '🍺',
    name: 'Cerveja',
    description: 'Ejeta o cartucho atual sem disparar',
  },
  cigarettes: {
    id: 'cigarettes',
    emoji: '🚬',
    name: 'Cigarro',
    description: 'Restaura 1 HP (não excede máximo)',
  },
  handcuffs: {
    id: 'handcuffs',
    emoji: '⛓️',
    name: 'Algemas',
    description: 'Pula o próximo turno do oponente',
  },
  hand_saw: {
    id: 'hand_saw',
    emoji: '🪚',
    name: 'Serra',
    description: 'Próximo tiro causa 2x de dano',
  },
  phone: {
    id: 'phone',
    emoji: '📱',
    name: 'Celular',
    description: 'Revela a posição de um cartucho aleatório na arma',
  },
  inverter: {
    id: 'inverter',
    emoji: '🔄',
    name: 'Inversor',
    description: 'Inverte o cartucho atual (LIVE↔BLANK)',
  },
  adrenaline: {
    id: 'adrenaline',
    emoji: '💉',
    name: 'Adrenalina',
    description: 'Rouba e usa um item do oponente',
  },
  expired_medicine: {
    id: 'expired_medicine',
    emoji: '💊',
    name: 'Remédio Vencido',
    description: '50% chance: +2 HP ou -1 HP',
  },
  turn_reverser: {
    id: 'turn_reverser',
    emoji: '↩️',
    name: 'Inversor de Ordem',
    description: 'Inverte a direção dos turnos (horário↔anti-horário)',
  },
};

// Array de todos os itens para seleção aleatória
export const ITEMS_ARRAY: Item[] = Object.values(ITEMS);

// IDs de todos os itens
export const ITEM_IDS: ItemId[] = Object.keys(ITEMS) as ItemId[];

// Itens que precisam de alvo
export const ITEMS_REQUIRING_TARGET: ItemId[] = ['handcuffs', 'adrenaline'];

// Itens que não podem ser roubados com Adrenalina
export const NON_STEALABLE_ITEMS: ItemId[] = ['adrenaline'];

// ==========================================
// SISTEMA DE RARIDADE / PESOS
// ==========================================
// Peso maior = mais chance de aparecer
// Itens mais fortes tem peso menor (mais raros)

export const ITEM_WEIGHTS: Record<ItemId, number> = {
  magnifying_glass: 15,   // Comum - informacao basica
  beer:             15,   // Comum - ejeta cartucho
  phone:            12,   // Comum - informacao aleatoria
  inverter:         10,   // Medio - inverte cartucho
  turn_reverser:    10,   // Medio - inverte ordem
  expired_medicine:  8,   // Medio - risco/recompensa
  handcuffs:         8,   // Raro - skip turn do oponente
  cigarettes:        8,   // Raro - cura HP
  hand_saw:          7,   // Raro - dano dobrado
  adrenaline:        7,   // Raro - roubar item
};

// Peso total para calculo de probabilidade
function getTotalWeight(excludeIds?: ItemId[]): { items: Item[]; weights: number[]; totalWeight: number } {
  const items: Item[] = [];
  const weights: number[] = [];
  let totalWeight = 0;

  for (const item of ITEMS_ARRAY) {
    if (excludeIds && excludeIds.includes(item.id)) continue;
    items.push(item);
    const weight = ITEM_WEIGHTS[item.id];
    weights.push(weight);
    totalWeight += weight;
  }

  return { items, weights, totalWeight };
}

// Função para obter item aleatório COM PESOS
// excludeIds: array de ItemIds que NÃO devem ser sorteados
export function getRandomItem(excludeIds?: ItemId[]): Item {
  const { items, weights, totalWeight } = getTotalWeight(excludeIds);

  if (items.length === 0) {
    // Fallback: retorna qualquer item
    return { ...ITEMS_ARRAY[Math.floor(Math.random() * ITEMS_ARRAY.length)] };
  }

  // Weighted random selection
  let random = Math.random() * totalWeight;
  for (let i = 0; i < items.length; i++) {
    random -= weights[i];
    if (random <= 0) {
      return { ...items[i] };
    }
  }

  // Fallback (rounding errors)
  return { ...items[items.length - 1] };
}

// Função para obter item por ID
export function getItemById(id: ItemId): Item | undefined {
  return ITEMS[id];
}
