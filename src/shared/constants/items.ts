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

// Função para obter item aleatório
// excludeIds: array de ItemIds que NÃO devem ser sorteados
export function getRandomItem(excludeIds?: ItemId[]): Item {
  let availableItems = ITEMS_ARRAY;

  if (excludeIds && excludeIds.length > 0) {
    availableItems = ITEMS_ARRAY.filter(item => !excludeIds.includes(item.id));
  }

  const randomIndex = Math.floor(Math.random() * availableItems.length);
  return { ...availableItems[randomIndex] };
}

// Função para obter item por ID
export function getItemById(id: ItemId): Item | undefined {
  return ITEMS[id];
}
