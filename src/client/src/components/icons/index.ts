// ==========================================
// ICONS - CENTRALIZED EXPORTS
// ==========================================

// Base types and utilities
export { ICON_SIZES, getIconSize, DEFAULT_ICON_COLOR } from './Icon';
export type { IconProps, IconSize } from './Icon';

// Item icons
export * from './items';

// Status icons
export * from './status';

// Shell icons
export * from './shells';

// UI icons
export * from './ui';

// Award icons
export * from './awards';

// ==========================================
// ITEM ICON MAP - For dynamic rendering
// ==========================================

import {
  MagnifyingGlassIcon,
  BeerIcon,
  CigaretteIcon,
  HandcuffsIcon,
  HandSawIcon,
  PhoneIcon,
  InverterIcon,
  AdrenalineIcon,
  MedicineIcon,
  TurnReverserIcon,
} from './items';

export const ITEM_ICONS = {
  magnifying_glass: MagnifyingGlassIcon,
  beer: BeerIcon,
  cigarettes: CigaretteIcon,
  handcuffs: HandcuffsIcon,
  hand_saw: HandSawIcon,
  phone: PhoneIcon,
  inverter: InverterIcon,
  adrenaline: AdrenalineIcon,
  expired_medicine: MedicineIcon,
  turn_reverser: TurnReverserIcon,
} as const;

export type ItemIconId = keyof typeof ITEM_ICONS;
