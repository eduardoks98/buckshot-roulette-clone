// ==========================================
// LEVEL BADGE COMPONENT
// Circular badge displaying player level with prestige stars
// ==========================================

import { getLevelInfo } from '../../../../../shared/utils/xpCalculator';
import './LevelBadge.css';

interface LevelBadgeProps {
  totalXp: number;
  size?: 'sm' | 'md' | 'lg';
}

export default function LevelBadge({
  totalXp,
  size = 'md',
}: LevelBadgeProps) {
  const info = getLevelInfo(totalXp);

  const classNames = [
    'level-badge',
    `level-badge--${size}`,
  ].join(' ');

  return (
    <div className={classNames}>
      <div className="level-badge__circle">
        <span className="level-badge__number">{info.displayLevel}</span>
      </div>
      {info.prestigeLevel > 0 && (
        <span className="level-badge__prestige">
          {Array.from({ length: info.prestigeLevel }, () => '\u2605').join('')}
        </span>
      )}
    </div>
  );
}
