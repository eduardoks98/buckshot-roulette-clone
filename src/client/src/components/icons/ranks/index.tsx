export { BronzeIcon } from './BronzeIcon';
export { SilverIcon } from './SilverIcon';
export { GoldIcon } from './GoldIcon';
export { PlatinumIcon } from './PlatinumIcon';
export { DiamondIcon } from './DiamondIcon';
export { MasterIcon } from './MasterIcon';
export { GrandmasterIcon } from './GrandmasterIcon';
export { ChallengerIcon } from './ChallengerIcon';

// Helper component to render rank icon by tier name
import { IconProps } from '../Icon';
import { BronzeIcon } from './BronzeIcon';
import { SilverIcon } from './SilverIcon';
import { GoldIcon } from './GoldIcon';
import { PlatinumIcon } from './PlatinumIcon';
import { DiamondIcon } from './DiamondIcon';
import { MasterIcon } from './MasterIcon';
import { GrandmasterIcon } from './GrandmasterIcon';
import { ChallengerIcon } from './ChallengerIcon';

interface RankIconProps extends IconProps {
  tier: string;
}

export function RankIcon({ tier, ...props }: RankIconProps) {
  switch (tier) {
    case 'Bronze':
      return <BronzeIcon {...props} />;
    case 'Silver':
      return <SilverIcon {...props} />;
    case 'Gold':
      return <GoldIcon {...props} />;
    case 'Platinum':
      return <PlatinumIcon {...props} />;
    case 'Diamond':
      return <DiamondIcon {...props} />;
    case 'Master':
      return <MasterIcon {...props} />;
    case 'Grandmaster':
      return <GrandmasterIcon {...props} />;
    case 'Challenger':
      return <ChallengerIcon {...props} />;
    default:
      return <BronzeIcon {...props} />;
  }
}
