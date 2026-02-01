// ==========================================
// PREVIEW PAGE - Minimal visual for iframe embedding
// No UI, no buttons, just animated visuals
// Uses same animation logic as AudioTest
// ==========================================

import { useEffect, useState, useRef, useCallback } from 'react';
import {
  RevolverCylinderWithSound,
  RevolverCylinderWithSoundRef,
} from '../../components/game/RevolverCylinder';
import './Preview.css';

export default function Preview() {
  const cylinderRef = useRef<RevolverCylinderWithSoundRef>(null);

  // Same state structure as AudioTest
  const [cylinderState, setCylinderState] = useState({
    totalChambers: 6,
    remainingShells: 6,
    currentPosition: 0,
    spentChambers: [] as number[],
  });

  const [isAnimating, setIsAnimating] = useState(false);
  const [shotIndex, setShotIndex] = useState(0);

  // Shot handler - same as AudioTest
  const handleShot = useCallback((isLive: boolean) => {
    if (isAnimating) return;
    setIsAnimating(true);

    // Trigger shot via ref (component handles animation + sound)
    cylinderRef.current?.triggerShot(isLive);

    // Update cylinder state after shot
    setCylinderState(prev => ({
      ...prev,
      spentChambers: [...prev.spentChambers, prev.currentPosition],
      currentPosition: (prev.currentPosition + 1) % prev.totalChambers,
      remainingShells: Math.max(0, prev.remainingShells - 1),
    }));

    // Release after animation (~550ms)
    setTimeout(() => setIsAnimating(false), 600);
  }, [isAnimating]);

  // Reload spin handler - same as AudioTest
  const handleReloadSpin = useCallback(() => {
    if (isAnimating) return;
    setIsAnimating(true);

    // Reset cylinder state
    setCylinderState({
      totalChambers: 6,
      remainingShells: 6,
      currentPosition: 0,
      spentChambers: [],
    });

    // Trigger spin via ref
    cylinderRef.current?.triggerReloadSpin();

    // Release after spin (800ms)
    setTimeout(() => setIsAnimating(false), 900);
  }, [isAnimating]);

  // Auto-animate loop
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    const doAnimation = () => {
      // If cylinder is empty or after 3 shots, do a reload spin
      if (cylinderState.remainingShells <= 3 || shotIndex >= 3) {
        handleReloadSpin();
        setShotIndex(0);

        // Schedule next shot after reload
        timeoutId = setTimeout(doAnimation, 2500);
      } else {
        // Do a shot - alternate between live and blank
        const isLive = shotIndex % 2 === 0;
        handleShot(isLive);
        setShotIndex(prev => prev + 1);

        // Schedule next action
        timeoutId = setTimeout(doAnimation, 2000);
      }
    };

    // Start after 1.5 seconds
    const initialTimeout = setTimeout(doAnimation, 1500);

    return () => {
      clearTimeout(initialTimeout);
      clearTimeout(timeoutId);
    };
  }, [cylinderState.remainingShells, shotIndex, handleShot, handleReloadSpin]);

  return (
    <div className="preview">
      <div className="preview__content">
        <h1 className="preview__title">
          BANG<span className="preview__accent">SHOT</span>
        </h1>

        <div className="preview__cylinder">
          <RevolverCylinderWithSound
            ref={cylinderRef}
            totalChambers={cylinderState.totalChambers}
            remainingShells={cylinderState.remainingShells}
            currentPosition={cylinderState.currentPosition}
            spentChambers={cylinderState.spentChambers}
            isActive={true}
            size="lg"
          />
        </div>

        <p className="preview__tagline">Roleta Russa Online</p>
      </div>

      {/* Decorative elements */}
      <div className="preview__glow preview__glow--1" />
      <div className="preview__glow preview__glow--2" />
    </div>
  );
}
