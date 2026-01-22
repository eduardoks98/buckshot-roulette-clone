// ==========================================
// ITEM TYPES
// ==========================================

export type ItemId =
  | 'magnifying_glass'
  | 'beer'
  | 'cigarettes'
  | 'handcuffs'
  | 'hand_saw'
  | 'phone'
  | 'inverter'
  | 'adrenaline'
  | 'expired_medicine'
  | 'turn_reverser';

export interface Item {
  id: ItemId;
  emoji: string;
  name: string;
  description: string;
}

export interface ItemWithIndex extends Item {
  index: number;
}

export interface ItemUseParams {
  itemId: ItemId;
  targetId?: string;
  stealItemIndex?: number;
}

export interface ItemUseResult {
  success: boolean;
  itemId: ItemId;
  playerId: string;
  playerName: string;
  message?: string;
  // Resultados específicos por item
  revealedShell?: 'live' | 'blank';
  ejectedShell?: 'live' | 'blank';
  healedAmount?: number;
  damagedAmount?: number;
  targetId?: string;
  targetName?: string;
  stolenItem?: Item;
  phonePosition?: number;
  phoneShell?: 'live' | 'blank';
  inverted?: boolean;
  directionChanged?: boolean;
  newDirection?: 1 | -1;
  failed?: boolean;
  failReason?: string;
  eliminated?: boolean;
  usedImmediately?: boolean; // Adrenalina - item roubado foi usado imediatamente
  // Estado após uso
  reloaded?: boolean;
  newShells?: {
    total: number;
    live: number;
    blank: number;
  };
}
