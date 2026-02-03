// ==========================================
// ACHIEVEMENT ICONS - Ícones EXCLUSIVOS para Conquistas
// Todos os ícones são locais desta pasta - NÃO reutilizar de status/, ui/, items/
// ==========================================

import { ComponentType } from 'react';
import { IconProps } from '../Icon';

// ==========================================
// ÍCONES ANTIGOS (mantidos para compatibilidade)
// ==========================================
import { AxeIcon } from './AxeIcon';
import { SwordsIcon } from './SwordsIcon';
import { ShieldIcon } from './ShieldIcon';
import { MuscleIcon } from './MuscleIcon';
import { DoveIcon } from './DoveIcon';
import { HeartFireIcon } from './HeartFireIcon';
import { BackpackIcon } from './BackpackIcon';
import { PackageIcon } from './PackageIcon';
import { CrystalBallIcon } from './CrystalBallIcon';
import { CloverIcon } from './CloverIcon';
import { HandshakeIcon } from './HandshakeIcon';
import { SkullIcon } from './SkullIcon';
import { ExplosionIcon } from './ExplosionIcon';
import { TargetIcon } from './TargetIcon';
import { CrownIcon } from './CrownIcon';
import { TrophyIcon } from './TrophyIcon';
import { ChainIcon } from './ChainIcon';
import { FireIcon } from './FireIcon';
import { GamepadIcon } from './GamepadIcon';
import { MedalIcon } from './MedalIcon';
import { PlayersIcon } from './PlayersIcon';
import { SawIcon } from './SawIcon';
import { MedicineIcon } from './MedicineIcon';
import { AdrenalineIcon } from './AdrenalineIcon';
import { StarIcon } from './StarIcon';

// ==========================================
// NOVOS ÍCONES EXCLUSIVOS (por achievement ID)
// ==========================================
import { FirstBloodIcon } from './FirstBloodIcon';
import { SerialKillerIcon } from './SerialKillerIcon';
import { CenturionIcon } from './CenturionIcon';
import { AngelOfDeathIcon } from './AngelOfDeathIcon';
import { DemolisherIcon } from './DemolisherIcon';
import { SniperIcon } from './SniperIcon';
import { SawMasterIcon } from './SawMasterIcon';
import { SurvivorIcon } from './SurvivorIcon';
import { IronWillIcon } from './IronWillIcon';
import { PharmacistIcon } from './PharmacistIcon';
import { PacifistIcon } from './PacifistIcon';
import { LastStandIcon } from './LastStandIcon';
import { CollectorIcon } from './CollectorIcon';
import { ItemHoarderIcon } from './ItemHoarderIcon';
import { ThiefIcon } from './ThiefIcon';
import { ChainMasterIcon } from './ChainMasterIcon';
import { FortuneTellerIcon } from './FortuneTellerIcon';
import { RookieIcon } from './RookieIcon';
import { VeteranIcon } from './VeteranIcon';
import { ChampionIcon } from './ChampionIcon';
import { UnbeatableIcon } from './UnbeatableIcon';
import { DominatorIcon } from './DominatorIcon';
import { SocialButterflyIcon } from './SocialButterflyIcon';
import { FullHouseIcon } from './FullHouseIcon';
import { RivalIcon } from './RivalIcon';

// ==========================================
// EXPORTS - Ícones antigos
// ==========================================
export { AxeIcon } from './AxeIcon';
export { SwordsIcon } from './SwordsIcon';
export { ShieldIcon } from './ShieldIcon';
export { MuscleIcon } from './MuscleIcon';
export { DoveIcon } from './DoveIcon';
export { HeartFireIcon } from './HeartFireIcon';
export { BackpackIcon } from './BackpackIcon';
export { PackageIcon } from './PackageIcon';
export { CrystalBallIcon } from './CrystalBallIcon';
export { CloverIcon } from './CloverIcon';
export { HandshakeIcon } from './HandshakeIcon';
export { SkullIcon } from './SkullIcon';
export { ExplosionIcon } from './ExplosionIcon';
export { TargetIcon } from './TargetIcon';
export { CrownIcon } from './CrownIcon';
export { TrophyIcon } from './TrophyIcon';
export { ChainIcon } from './ChainIcon';
export { FireIcon } from './FireIcon';
export { GamepadIcon } from './GamepadIcon';
export { MedalIcon } from './MedalIcon';
export { PlayersIcon } from './PlayersIcon';
export { SawIcon } from './SawIcon';
export { MedicineIcon } from './MedicineIcon';
export { AdrenalineIcon } from './AdrenalineIcon';
export { StarIcon } from './StarIcon';

// ==========================================
// EXPORTS - Novos ícones exclusivos
// ==========================================
export { FirstBloodIcon } from './FirstBloodIcon';
export { SerialKillerIcon } from './SerialKillerIcon';
export { CenturionIcon } from './CenturionIcon';
export { AngelOfDeathIcon } from './AngelOfDeathIcon';
export { DemolisherIcon } from './DemolisherIcon';
export { SniperIcon } from './SniperIcon';
export { SawMasterIcon } from './SawMasterIcon';
export { SurvivorIcon } from './SurvivorIcon';
export { IronWillIcon } from './IronWillIcon';
export { PharmacistIcon } from './PharmacistIcon';
export { PacifistIcon } from './PacifistIcon';
export { LastStandIcon } from './LastStandIcon';
export { CollectorIcon } from './CollectorIcon';
export { ItemHoarderIcon } from './ItemHoarderIcon';
export { ThiefIcon } from './ThiefIcon';
export { ChainMasterIcon } from './ChainMasterIcon';
export { FortuneTellerIcon } from './FortuneTellerIcon';
export { RookieIcon } from './RookieIcon';
export { VeteranIcon } from './VeteranIcon';
export { ChampionIcon } from './ChampionIcon';
export { UnbeatableIcon } from './UnbeatableIcon';
export { DominatorIcon } from './DominatorIcon';
export { SocialButterflyIcon } from './SocialButterflyIcon';
export { FullHouseIcon } from './FullHouseIcon';
export { RivalIcon } from './RivalIcon';

// ==========================================
// MAPEAMENTO ANTIGO (por icon string)
// ==========================================

export const ACHIEVEMENT_ICONS: Record<string, ComponentType<IconProps>> = {
  // Combat
  skull: SkullIcon,
  axe: AxeIcon,
  swords: SwordsIcon,
  explosion: ExplosionIcon,
  target: TargetIcon,
  saw: SawIcon,

  // Survival
  shield: ShieldIcon,
  muscle: MuscleIcon,
  medicine: MedicineIcon,
  dove: DoveIcon,
  heart_fire: HeartFireIcon,

  // Items
  backpack: BackpackIcon,
  package: PackageIcon,
  adrenaline: AdrenalineIcon,
  chain: ChainIcon,
  crystal_ball: CrystalBallIcon,

  // Games
  gamepad: GamepadIcon,
  medal: MedalIcon,
  trophy: TrophyIcon,
  fire: FireIcon,
  crown: CrownIcon,

  // Social
  players: PlayersIcon,
  clover: CloverIcon,
  handshake: HandshakeIcon,

  // Títulos adicionais
  star: StarIcon,
};

// ==========================================
// NOVO MAPEAMENTO (por achievement ID) - USAR ESTE!
// ==========================================

export const ACHIEVEMENT_ICONS_BY_ID: Record<string, ComponentType<IconProps>> = {
  // Combat (7)
  first_blood: FirstBloodIcon,
  serial_killer: SerialKillerIcon,
  centurion: CenturionIcon,
  angel_of_death: AngelOfDeathIcon,
  demolisher: DemolisherIcon,
  sniper: SniperIcon,
  saw_master: SawMasterIcon,

  // Survival (5)
  survivor: SurvivorIcon,
  iron_will: IronWillIcon,
  pharmacist: PharmacistIcon,
  pacifist: PacifistIcon,
  last_stand: LastStandIcon,

  // Items (5)
  collector: CollectorIcon,
  item_hoarder: ItemHoarderIcon,
  thief: ThiefIcon,
  chain_master: ChainMasterIcon,
  fortune_teller: FortuneTellerIcon,

  // Games (5)
  rookie: RookieIcon,
  veteran: VeteranIcon,
  champion: ChampionIcon,
  unbeatable: UnbeatableIcon,
  dominator: DominatorIcon,

  // Social (3)
  social_butterfly: SocialButterflyIcon,
  full_house: FullHouseIcon,
  rival: RivalIcon,
};

// ==========================================
// HELPERS
// ==========================================

/**
 * Obtém ícone por icon string (sistema antigo)
 * @deprecated Use getAchievementIconById para novos ícones
 */
export function getAchievementIcon(iconId: string): ComponentType<IconProps> | null {
  return ACHIEVEMENT_ICONS[iconId] || null;
}

/**
 * Obtém ícone exclusivo por achievement ID (sistema novo)
 * @param achievementId - ID da conquista (ex: 'first_blood', 'serial_killer')
 */
export function getAchievementIconById(achievementId: string): ComponentType<IconProps> | null {
  return ACHIEVEMENT_ICONS_BY_ID[achievementId] || null;
}
