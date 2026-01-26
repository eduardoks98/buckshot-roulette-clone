// ==========================================
// REVOLVER CYLINDER - Animated Game Component
// ==========================================

import { useEffect, useState, useRef } from 'react';
import './RevolverCylinder.css';

export interface RevealedChamber {
  position: number;  // 0-based index in the cylinder
  type: 'live' | 'blank';
}

export interface RevolverCylinderProps {
  totalChambers: number;  // Total chambers in cylinder (fixed for the round)
  remainingShells: number;  // How many shells are still in the cylinder
  currentPosition?: number;  // Current chamber position (0 = first, rotates to point at arrow)
  revealedChambers?: RevealedChamber[];  // Chambers revealed by magnifying glass or phone
  spentChambers?: number[];  // Indexes of chambers that have been fired (empty)
  isSpinning?: boolean;
  isActive?: boolean;
  shotResult?: 'live' | 'blank' | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZES = {
  sm: 120,
  md: 180,
  lg: 240,
};

export function RevolverCylinder({
  totalChambers: totalChambersInput,
  remainingShells,
  currentPosition = 0,
  revealedChambers = [],
  spentChambers = [],
  isSpinning = false,
  isActive = false,
  shotResult = null,
  size = 'md',
  className = '',
}: RevolverCylinderProps) {
  const [animationPhase, setAnimationPhase] = useState<'idle' | 'spinning' | 'result'>('idle');
  const [showMuzzleFlash, setShowMuzzleFlash] = useState(false);
  const [displayRotation, setDisplayRotation] = useState(0);
  const prevPositionRef = useRef(currentPosition);

  // Total chambers is fixed for the round (at least 2)
  const totalChambers = Math.max(totalChambersInput, 2);
  const s = SIZES[size];
  const cx = s / 2;
  const cy = s / 2;
  const outerRadius = s * 0.42;

  // Adjust chamber size based on number of chambers
  const chamberRadius = totalChambers <= 4 ? s * 0.11 :
                        totalChambers <= 6 ? s * 0.09 :
                        totalChambers <= 8 ? s * 0.07 : s * 0.06;
  const chamberDistance = totalChambers <= 4 ? s * 0.24 :
                          totalChambers <= 6 ? s * 0.28 :
                          totalChambers <= 8 ? s * 0.30 : s * 0.32;

  // Angle per chamber
  const anglePerChamber = 360 / totalChambers;

  // Generate chamber positions in a circle
  const chambers = Array.from({ length: totalChambers }, (_, i) => {
    const angle = (i * anglePerChamber - 90) * (Math.PI / 180);
    return {
      x: cx + Math.cos(angle) * chamberDistance,
      y: cy + Math.sin(angle) * chamberDistance,
      index: i,
    };
  });

  // Check if a chamber is revealed (by lupa or phone)
  const getRevealedType = (index: number): 'live' | 'blank' | null => {
    const revealed = revealedChambers.find(r => r.position === index);
    return revealed ? revealed.type : null;
  };

  // Check if chamber has been spent (fired)
  const isSpent = (index: number): boolean => {
    return spentChambers.includes(index);
  };

  // Check if chamber still has a shell
  const hasShell = (index: number): boolean => {
    // Chamber has shell if it's not spent and index is within remaining + spent range
    return !isSpent(index) && index < (remainingShells + spentChambers.length);
  };

  // Animate rotation when position changes
  useEffect(() => {
    // Calculate rotation to bring current position to top (firing position)
    // Chamber 0 starts at top (-90°), so we rotate by currentPosition * anglePerChamber
    const newRotation = currentPosition * anglePerChamber;
    setDisplayRotation(newRotation);
    prevPositionRef.current = currentPosition;
  }, [currentPosition, anglePerChamber]);

  // Handle shot animation sequence
  useEffect(() => {
    if (isSpinning && animationPhase === 'idle') {
      setAnimationPhase('spinning');

      // After spin, show result and stop at the correct position
      const spinTimer = setTimeout(() => {
        setAnimationPhase('result');
        if (shotResult) {
          setShowMuzzleFlash(true);
          setTimeout(() => setShowMuzzleFlash(false), 200);
        }

        // Reset after showing result
        const resetTimer = setTimeout(() => {
          setAnimationPhase('idle');
        }, 800);

        return () => clearTimeout(resetTimer);
      }, 600);

      return () => clearTimeout(spinTimer);
    }

    if (!isSpinning && animationPhase !== 'idle') {
      // Reset if spinning stops externally
      const resetTimer = setTimeout(() => {
        setAnimationPhase('idle');
      }, 1000);
      return () => clearTimeout(resetTimer);
    }
  }, [isSpinning, animationPhase, shotResult]);

  const cylinderClasses = [
    'revolver-cylinder',
    `revolver-cylinder--${size}`,
    isActive ? 'revolver-cylinder--active' : '',
    animationPhase === 'spinning' ? 'revolver-cylinder--spinning' : '',
    animationPhase === 'result' && shotResult === 'live' ? 'revolver-cylinder--shot-live' : '',
    animationPhase === 'result' && shotResult === 'blank' ? 'revolver-cylinder--shot-blank' : '',
    className,
  ].filter(Boolean).join(' ');

  // Calculate rotation style for the cylinder
  // During spinning, we animate with CSS but end at the correct position
  const targetRotation = currentPosition * anglePerChamber;

  const cylinderRotationStyle = (() => {
    if (animationPhase === 'spinning') {
      // Spin animation: 2 full rotations (720deg) + final position
      return {
        transform: `rotate(-${720 + targetRotation}deg)`,
        transition: 'transform 0.6s cubic-bezier(0.25, 0.1, 0.25, 1)',
      };
    }
    // Idle or result: just show the current position
    return {
      transform: `rotate(-${displayRotation}deg)`,
      transition: animationPhase === 'idle' ? 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
    };
  })();

  return (
    <div className={cylinderClasses}>
      {/* Muzzle Flash */}
      {showMuzzleFlash && shotResult === 'live' && (
        <div className="revolver-muzzle-flash revolver-muzzle-flash--live" />
      )}
      {showMuzzleFlash && shotResult === 'blank' && (
        <div className="revolver-muzzle-flash revolver-muzzle-flash--blank" />
      )}

      {/* Firing position arrow indicator at top (fixed, doesn't rotate) */}
      <div className="revolver-firing-arrow">
        <svg width="20" height="16" viewBox="0 0 20 16">
          <polygon
            points="10,16 0,0 20,0"
            fill="var(--gold-accent, #d4a418)"
            opacity="0.9"
          />
        </svg>
      </div>

      <svg
        width={s}
        height={s}
        viewBox={`0 0 ${s} ${s}`}
        className="revolver-cylinder__svg"
        style={cylinderRotationStyle}
      >
        {/* Outer ring */}
        <circle
          cx={cx}
          cy={cy}
          r={outerRadius}
          fill="none"
          stroke="var(--gold-accent, #d4a418)"
          strokeWidth="3"
          opacity="0.4"
        />

        {/* Inner decorative ring */}
        <circle
          cx={cx}
          cy={cy}
          r={outerRadius * 0.7}
          fill="none"
          stroke="var(--gold-accent, #d4a418)"
          strokeWidth="1.5"
          opacity="0.2"
        />

        {/* Center pin */}
        <circle
          cx={cx}
          cy={cy}
          r={s * 0.05}
          fill="var(--gold-accent, #d4a418)"
          opacity="0.6"
        />

        {/* Chambers */}
        {chambers.map((chamber, i) => {
          const revealedType = getRevealedType(i);
          const spent = isSpent(i);
          const shellPresent = hasShell(i);

          return (
            <g key={i} className="revolver-chamber">
              {/* Chamber base circle */}
              <circle
                cx={chamber.x}
                cy={chamber.y}
                r={chamberRadius}
                fill={
                  spent ? 'rgba(30, 30, 30, 0.8)' :  // Empty/spent chamber - dark hole
                  revealedType === 'live' ? '#ef4444' :
                  revealedType === 'blank' ? '#3b82f6' :
                  shellPresent ? 'rgba(80, 80, 80, 0.8)' : 'rgba(30, 30, 30, 0.5)'
                }
                stroke={
                  spent ? 'rgba(60, 60, 60, 0.5)' :  // Spent chamber - dim border
                  shellPresent ? 'var(--gold-accent, #d4a418)' : 'rgba(100, 100, 100, 0.3)'
                }
                strokeWidth={shellPresent && !spent ? '2' : '1'}
                opacity={spent ? 0.6 : 1}
                className={`chamber-fill ${spent ? 'chamber-spent' : ''}`}
              />

              {/* Revealed chamber highlight */}
              {revealedType && !spent && (
                <circle
                  cx={chamber.x}
                  cy={chamber.y}
                  r={chamberRadius * 0.4}
                  fill={revealedType === 'live' ? '#fca5a5' : '#93c5fd'}
                  opacity="0.6"
                />
              )}

              {/* Question mark for hidden shells */}
              {shellPresent && !revealedType && !spent && (
                <text
                  x={chamber.x}
                  y={chamber.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="var(--gold-accent, #d4a418)"
                  fontSize={chamberRadius * 1.2}
                  fontWeight="bold"
                  className="chamber-question"
                  style={{ transform: `rotate(${displayRotation}deg)`, transformOrigin: `${chamber.x}px ${chamber.y}px` }}
                >
                  ?
                </text>
              )}

              {/* Spent indicator - small smoke effect or empty hole */}
              {spent && (
                <circle
                  cx={chamber.x}
                  cy={chamber.y}
                  r={chamberRadius * 0.3}
                  fill="rgba(50, 50, 50, 0.8)"
                  className="chamber-spent-hole"
                />
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default RevolverCylinder;
