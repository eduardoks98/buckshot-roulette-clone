// ==========================================
// SHOTGUN COMPONENT
// ==========================================

import { useState, useEffect } from 'react';
import './Shotgun.css';

interface ShotgunProps {
  isActive?: boolean;
  isSawedOff?: boolean;
  shellType?: 'live' | 'blank' | null;
  onShoot?: () => void;
  recoil?: boolean;
}

export default function Shotgun({
  isActive = false,
  isSawedOff = false,
  shellType = null,
  onShoot,
  recoil = false,
}: ShotgunProps) {
  const [isRecoiling, setIsRecoiling] = useState(false);

  useEffect(() => {
    if (recoil) {
      setIsRecoiling(true);
      const timer = setTimeout(() => setIsRecoiling(false), 500);
      return () => clearTimeout(timer);
    }
  }, [recoil]);

  const classes = [
    'shotgun',
    isActive && 'active',
    isSawedOff && 'sawed-off',
    isRecoiling && 'recoil',
    shellType && `shell-${shellType}`,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} onClick={isActive ? onShoot : undefined}>
      <div className="shotgun-body">
        {/* Barrel */}
        <div className="shotgun-barrel">
          {isSawedOff && <div className="saw-marks" />}
        </div>

        {/* Stock */}
        <div className="shotgun-stock" />

        {/* Trigger Guard */}
        <div className="shotgun-trigger-guard" />

        {/* Shell indicator */}
        {shellType && (
          <div className={`shell-indicator ${shellType}`}>
            {shellType === 'live' ? '🔴' : '🔵'}
          </div>
        )}
      </div>

      {/* Muzzle Flash */}
      {isRecoiling && <div className="muzzle-flash" />}
    </div>
  );
}
