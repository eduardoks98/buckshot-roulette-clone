// ==========================================
// ROUND ANNOUNCEMENT OVERLAY - With Cylinder Shell Loading Animation
// ==========================================

import { useState, useEffect, useMemo } from 'react';
import { RevolverCylinder } from '../RevolverCylinder';
import { TargetIcon, HeartFullIcon } from '../../icons';
import './RoundAnnouncementOverlay.css';

export interface RoundAnnouncementOverlayProps {
  round: number;
  live: number;
  blank: number;
  hp: number;
  onAnimationComplete?: () => void;
}

export function RoundAnnouncementOverlay({
  round,
  live,
  blank,
  hp,
  onAnimationComplete,
}: RoundAnnouncementOverlayProps) {
  const [phase, setPhase] = useState<'title' | 'loading' | 'spinning' | 'complete'>('title');
  const [loadedShells, setLoadedShells] = useState(0);
  const [flyingShellIndex, setFlyingShellIndex] = useState<number | null>(null);

  const totalShells = live + blank;

  // Create shuffled array of shells to load
  const shellsToLoad = useMemo(() => {
    const shells: Array<{ type: 'live' | 'blank' }> = [
      ...Array(live).fill(null).map(() => ({ type: 'live' as const })),
      ...Array(blank).fill(null).map(() => ({ type: 'blank' as const })),
    ];

    // Fisher-Yates shuffle
    for (let i = shells.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shells[i], shells[j]] = [shells[j], shells[i]];
    }

    return shells;
  }, [live, blank]);

  // Phase 1: Show title for 1 second, then start loading
  useEffect(() => {
    const titleTimer = setTimeout(() => {
      setPhase('loading');
    }, 1000);

    return () => clearTimeout(titleTimer);
  }, []);

  // Phase 2: Load shells one by one with flying animation
  useEffect(() => {
    if (phase !== 'loading' || loadedShells >= totalShells) return;

    // Start flying animation for current shell
    setFlyingShellIndex(loadedShells);

    const loadTimer = setTimeout(() => {
      setLoadedShells(prev => prev + 1);
      setFlyingShellIndex(null);
    }, 400); // 400ms per shell

    return () => clearTimeout(loadTimer);
  }, [phase, loadedShells, totalShells]);

  // Phase 3: Spinning - after all shells loaded
  useEffect(() => {
    if (loadedShells >= totalShells && phase === 'loading') {
      const spinTimer = setTimeout(() => {
        setPhase('spinning');
      }, 300);

      return () => clearTimeout(spinTimer);
    }
  }, [loadedShells, totalShells, phase]);

  // Phase 4: Complete - after spinning
  useEffect(() => {
    if (phase === 'spinning') {
      const completeTimer = setTimeout(() => {
        setPhase('complete');
        // Wait a bit more before closing
        setTimeout(() => {
          onAnimationComplete?.();
        }, 800);
      }, 1200); // Spin for 1.2 seconds

      return () => clearTimeout(completeTimer);
    }
  }, [phase, onAnimationComplete]);

  // Calculate chamber position for flying shell animation
  const getChamberAngle = (index: number) => {
    const anglePerChamber = 360 / totalShells;
    return (index * anglePerChamber - 90) * (Math.PI / 180);
  };

  return (
    <div className="round-announcement-overlay">
      <div className={`round-announcement ${phase}`}>
        {/* Title */}
        <h2 className="round-title">
          <TargetIcon size={36} color="var(--gold-accent)" /> RODADA {round}
        </h2>

        {/* Cylinder with loading animation */}
        <div className="cylinder-loading-area">
          <div className="cylinder-wrapper">
            <RevolverCylinder
              totalChambers={totalShells}
              remainingShells={loadedShells}
              currentPosition={0}
              spentChambers={[]}
              size="lg"
              isSpinning={phase === 'spinning'}
              isActive={phase === 'complete' || phase === 'spinning'}
            />

            {/* Flying shell animation */}
            {flyingShellIndex !== null && flyingShellIndex < shellsToLoad.length && (
              <div
                className={`flying-shell ${shellsToLoad[flyingShellIndex].type}`}
                style={{
                  '--target-angle': `${getChamberAngle(flyingShellIndex)}rad`,
                } as React.CSSProperties}
              >
                <div className="flying-shell-body">
                  <div className="flying-shell-tip"></div>
                </div>
              </div>
            )}
          </div>

          {/* Shells waiting to be loaded */}
          <div className="shells-queue">
            {shellsToLoad.map((shell, index) => (
              <div
                key={index}
                className={`shell-to-load ${shell.type} ${index < loadedShells ? 'loaded' : ''} ${index === flyingShellIndex ? 'flying' : ''}`}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="shell-body">
                  <div className="shell-tip"></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Shell count legend */}
        <div className={`shell-info ${phase !== 'title' ? 'visible' : ''}`}>
          <span className="shell-count live">
            {live} LIVE
          </span>
          <span className="shell-count blank">
            {blank} BLANK
          </span>
        </div>

        {/* HP info */}
        <div className={`hp-announcement ${phase === 'complete' ? 'visible' : ''}`}>
          <HeartFullIcon size={24} /> {hp} HP cada
        </div>

        {/* Loading indicator */}
        {phase === 'loading' && loadedShells < totalShells && (
          <div className="loading-text">
            Carregando... {loadedShells}/{totalShells}
          </div>
        )}

        {phase === 'spinning' && (
          <div className="spinning-text">Embaralhando...</div>
        )}

        {phase === 'complete' && (
          <div className="ready-text">PRONTO!</div>
        )}
      </div>
    </div>
  );
}

export default RoundAnnouncementOverlay;
