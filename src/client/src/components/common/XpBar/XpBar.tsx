// ==========================================
// XP BAR COMPONENT
// Reusable XP progress bar with level display
// ==========================================

import { getLevelInfo } from '../../../../../shared/utils/xpCalculator';
import './XpBar.css';

interface XpBarProps {
  totalXp: number;
  size?: 'sm' | 'md' | 'lg';
  showLevel?: boolean;
  animated?: boolean;
}

export default function XpBar({
  totalXp,
  size = 'md',
  showLevel = true,
  animated = true,
}: XpBarProps) {
  const info = getLevelInfo(totalXp);

  const classNames = [
    'xp-bar',
    `xp-bar--${size}`,
    animated ? 'xp-bar--animated' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const fillPercent = Math.min(info.xpProgress * 100, 100);

  return (
    <div className={classNames}>
      {showLevel && (
        <span className="xp-bar__level">
          Lv.<span className="xp-bar__level-number">{info.displayLevel}</span>
          {info.prestigeLevel > 0 && (
            <span className="xp-bar__prestige">
              {Array.from({ length: info.prestigeLevel }, () => '\u2605').join('')}
            </span>
          )}
        </span>
      )}

      <div className="xp-bar__track">
        <div
          className="xp-bar__fill"
          style={{ width: `${fillPercent}%` }}
        />
      </div>

      <span className="xp-bar__text">
        <span className="xp-bar__text-current">{info.xpInCurrentLevel}</span>
        <span className="xp-bar__text-separator">/</span>
        <span className="xp-bar__text-required">{info.xpForNextLevel}</span>
        <span className="xp-bar__text-label">XP</span>
      </span>
    </div>
  );
}
