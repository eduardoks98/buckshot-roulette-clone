// ==========================================
// ROUND ANNOUNCEMENT OVERLAY - Simplified Shell Loading Animation
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

// Animation timing constants (in ms)
const TIMING = {
  TITLE: 800,           // Title + cylinder appear
  SHELL_FLY: 300,       // Time per shell flying
  SPIN: 500,            // Cylinder spin duration
  COMPLETE_DELAY: 500,  // Delay before closing
};

type AnimationPhase = 'title' | 'loading' | 'spinning' | 'complete';

export function RoundAnnouncementOverlay({
  round,
  live,
  blank,
  hp,
  onAnimationComplete,
}: RoundAnnouncementOverlayProps) {
  const [phase, setPhase] = useState<AnimationPhase>('title');
  const [loadedShells, setLoadedShells] = useState(0);
  const [flyingShellIndex, setFlyingShellIndex] = useState<number | null>(null);

  const totalShells = live + blank;

  // Create ordered array of shells to load (LIVE first, then BLANK - no shuffle)
  // This shows the player how many of each type, then the spin "shuffles" them
  const shellsToLoad = useMemo(() => {
    return [
      ...Array(live).fill(null).map(() => ({ type: 'live' as const })),
      ...Array(blank).fill(null).map(() => ({ type: 'blank' as const })),
    ];
    // NO shuffle - order is intentional to show colors grouped
  }, [live, blank]);

  // Phase 1: TITLE - Show title and cylinder
  useEffect(() => {
    const timer = setTimeout(() => {
      setPhase('loading');
    }, TIMING.TITLE);

    return () => clearTimeout(timer);
  }, []);

  // Phase 2: LOADING - Load shells one by one with flying animation
  useEffect(() => {
    if (phase !== 'loading' || loadedShells >= totalShells) return;

    // Start flying animation for current shell
    setFlyingShellIndex(loadedShells);

    const loadTimer = setTimeout(() => {
      setLoadedShells(prev => prev + 1);
      setFlyingShellIndex(null);
    }, TIMING.SHELL_FLY);

    return () => clearTimeout(loadTimer);
  }, [phase, loadedShells, totalShells]);

  // Phase 3: SPINNING - after all shells loaded
  useEffect(() => {
    if (loadedShells >= totalShells && phase === 'loading') {
      const spinTimer = setTimeout(() => {
        setPhase('spinning');
      }, 4000); // 4 seconds pause to let player see/count the shells

      return () => clearTimeout(spinTimer);
    }
  }, [loadedShells, totalShells, phase]);

  // Phase 4: COMPLETE - after spinning
  useEffect(() => {
    if (phase === 'spinning') {
      const completeTimer = setTimeout(() => {
        setPhase('complete');
        // Wait a bit more before closing
        setTimeout(() => {
          onAnimationComplete?.();
        }, TIMING.COMPLETE_DELAY);
      }, TIMING.SPIN);

      return () => clearTimeout(completeTimer);
    }
  }, [phase, onAnimationComplete]);

  return (
    <div className="round-announcement-overlay">
      <div className={`round-announcement ${phase}`}>
        {/* Title */}
        <h2 className="round-title">
          <TargetIcon size={36} color="var(--gold-accent)" /> RODADA {round}
        </h2>

        {/* Cylinder with flying shells */}
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
              // Show colors during loading, hide (?) during spinning/complete
              revealedChambers={
                phase === 'loading' || phase === 'title'
                  ? shellsToLoad.slice(0, loadedShells).map((shell, i) => ({
                      position: i,
                      type: shell.type
                    }))
                  : [] // Empty = shells show "?"
              }
            />

            {/* Flying shell animation */}
            {flyingShellIndex !== null && flyingShellIndex < shellsToLoad.length && (
              <div className={`flying-shell ${shellsToLoad[flyingShellIndex].type}`}>
                <div className="flying-shell-body">
                  <div className="flying-shell-tip"></div>
                </div>
              </div>
            )}
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

        {/* Status text based on phase */}
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
