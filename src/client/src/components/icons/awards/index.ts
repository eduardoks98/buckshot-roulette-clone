// ==========================================
// AWARD ICONS - Export all award icons
// ==========================================

export { MostDamageIcon } from './MostDamageIcon';
export { TankIcon } from './TankIcon';
export { PassiveIcon } from './PassiveIcon';
export { MasochistIcon } from './MasochistIcon';
export { CollectorIcon } from './CollectorIcon';
export { ExterminatorIcon } from './ExterminatorIcon';

import { MostDamageIcon } from './MostDamageIcon';
import { TankIcon } from './TankIcon';
import { PassiveIcon } from './PassiveIcon';
import { MasochistIcon } from './MasochistIcon';
import { CollectorIcon } from './CollectorIcon';
import { ExterminatorIcon } from './ExterminatorIcon';

export const AWARD_ICONS = {
  most_damage: MostDamageIcon,
  most_damage_taken: TankIcon,
  most_passive: PassiveIcon,
  most_self_damage: MasochistIcon,
  most_items_used: CollectorIcon,
  most_kills: ExterminatorIcon,
} as const;

export type AwardIconId = keyof typeof AWARD_ICONS;
