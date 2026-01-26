// ==========================================
// ROUND ANNOUNCEMENT OVERLAY - With Shell Loading Animation
// ==========================================

import { useState, useEffect } from 'react';
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
  const [phase, setPhase] = useState<'title' | 'loading' | 'complete'>('title');
  const [loadedShells, setLoadedShells] = useState(0);
  const [shellsToLoad, setShellsToLoad] = useState<Array<{ type: 'live' | 'blank'; loaded: boolean }>>([]);

  const totalShells = live + blank;

  // Create shuffled array of shells to load
  useEffect(() => {
    // Create array with live and blank shells, then shuffle
    const shells: Array<{ type: 'live' | 'blank'; loaded: boolean }> = [
      ...Array(live).fill(null).map(() => ({ type: 'live' as const, loaded: false })),
      ...Array(blank).fill(null).map(() => ({ type: 'blank' as const, loaded: false })),
    ];

    // Fisher-Yates shuffle
    for (let i = shells.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shells[i], shells[j]] = [shells[j], shells[i]];
    }

    setShellsToLoad(shells);
  }, [live, blank]);

  // Phase 1: Show title for 1 second, then start loading
  useEffect(() => {
    const titleTimer = setTimeout(() => {
      setPhase('loading');
    }, 1000);

    return () => clearTimeout(titleTimer);
  }, []);

  // Phase 2: Load shells one by one
  useEffect(() => {
    if (phase !== 'loading' || loadedShells >= totalShells) return;

    const loadTimer = setTimeout(() => {
      setLoadedShells(prev => prev + 1);
      setShellsToLoad(prev =>
        prev.map((shell, i) =>
          i === loadedShells ? { ...shell, loaded: true } : shell
        )
      );
    }, 300); // 300ms between each shell

    return () => clearTimeout(loadTimer);
  }, [phase, loadedShells, totalShells]);

  // Phase 3: Complete - wait a moment then call callback
  useEffect(() => {
    if (loadedShells >= totalShells && phase === 'loading') {
      const completeTimer = setTimeout(() => {
        setPhase('complete');
        // Wait a bit more before closing
        setTimeout(() => {
          onAnimationComplete?.();
        }, 800);
      }, 500);

      return () => clearTimeout(completeTimer);
    }
  }, [loadedShells, totalShells, phase, onAnimationComplete]);

  return (
    <div className="round-announcement-overlay">
      <div className={`round-announcement ${phase}`}>
        {/* Title */}
        <h2 className="round-title">
          <TargetIcon size={36} color="var(--gold-accent)" /> RODADA {round}
        </h2>

        {/* Cylinder with loading animation */}
        <div className="cylinder-loading-area">
          <RevolverCylinder
            totalChambers={totalShells}
            remainingShells={loadedShells}
            currentPosition={0}
            spentChambers={[]}
            size="lg"
            isActive={phase === 'complete'}
          />

          {/* Shells waiting to be loaded */}
          <div className="shells-queue">
            {shellsToLoad.map((shell, index) => (
              <div
                key={index}
                className={`shell-to-load ${shell.type} ${shell.loaded ? 'loaded' : ''} ${index === loadedShells ? 'loading' : ''}`}
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
        <div className={`shell-info ${phase === 'loading' || phase === 'complete' ? 'visible' : ''}`}>
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

        {phase === 'complete' && (
          <div className="ready-text">PRONTO!</div>
        )}
      </div>
    </div>
  );
}

export default RoundAnnouncementOverlay;
