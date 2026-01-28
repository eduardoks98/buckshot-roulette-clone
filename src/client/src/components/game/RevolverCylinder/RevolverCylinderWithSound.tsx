// ==========================================
// REVOLVER CYLINDER WITH SOUND - Unified Component
// Encapsulates cylinder animation + audio in one place
// ==========================================
//
// Dois tipos de animação:
// - triggerShot: Tiro realista (click + avanço 1 posição + disparo)
// - triggerReloadSpin: Spin dramático (reload/início do round)

import { forwardRef, useImperativeHandle, useState, useCallback } from 'react';
import { RevolverCylinder, RevolverCylinderProps } from './RevolverCylinder';
import { soundManager } from '../../../audio/SoundManager';

export interface RevolverCylinderWithSoundRef {
  triggerShot: (isLive: boolean) => void;
  triggerReloadSpin: () => void;
}

export interface RevolverCylinderWithSoundProps extends Omit<RevolverCylinderProps, 'isSpinning' | 'isAdvancing' | 'shotResult'> {
  onShotComplete?: (isLive: boolean) => void;
  onReloadComplete?: () => void;
  isSawed?: boolean;
}

export const RevolverCylinderWithSound = forwardRef<RevolverCylinderWithSoundRef, RevolverCylinderWithSoundProps>(
  ({ onShotComplete, onReloadComplete, isSawed = false, ...cylinderProps }, ref) => {
    const [isSpinning, setIsSpinning] = useState(false);
    const [isAdvancing, setIsAdvancing] = useState(false);
    const [shotResult, setShotResult] = useState<'live' | 'blank' | null>(null);

    // Verifica se alguma animação está em andamento
    const isAnimating = isSpinning || isAdvancing;

    // ==========================================
    // TIRO REALISTA
    // Timeline: click(0) -> avanço(0-150ms) -> disparo(150ms) -> resultado(150-550ms)
    // ==========================================
    const triggerShot = useCallback((isLive: boolean) => {
      if (isAnimating) return;

      // 1. Click do gatilho (armar o cão)
      soundManager.play('revolver-cocking');
      setIsAdvancing(true);

      // 2. Após cilindro avançar 1 posição (150ms), dispara
      setTimeout(() => {
        setIsAdvancing(false);
        setShotResult(isLive ? 'live' : 'blank');

        // 3. Som do disparo
        if (isLive) {
          soundManager.play('shot-live');
          // Sawed-off: tiro duplo
          if (isSawed) {
            setTimeout(() => soundManager.play('shot-live'), 100);
          }
        } else {
          // Blank: click-click (tec-tec)
          soundManager.play('shot-blank');
          setTimeout(() => soundManager.play('shot-blank'), 80);
        }

        // 4. Reset após mostrar resultado (flash + feedback)
        setTimeout(() => {
          setShotResult(null);
          onShotComplete?.(isLive);
        }, 400);
      }, 150);
    }, [isAnimating, isSawed, onShotComplete]);

    // ==========================================
    // SPIN DRAMÁTICO (reload/início do round)
    // Timeline: spin(0-800ms)
    // ==========================================
    const triggerReloadSpin = useCallback(() => {
      if (isAnimating) return;

      // Som de spin
      soundManager.play('revolver-spin');
      setIsSpinning(true);

      // Após spin dramático, parar
      setTimeout(() => {
        setIsSpinning(false);
        onReloadComplete?.();
      }, 800);
    }, [isAnimating, onReloadComplete]);

    useImperativeHandle(ref, () => ({
      triggerShot,
      triggerReloadSpin,
    }), [triggerShot, triggerReloadSpin]);

    return (
      <RevolverCylinder
        {...cylinderProps}
        isSpinning={isSpinning}
        isAdvancing={isAdvancing}
        shotResult={shotResult}
      />
    );
  }
);

RevolverCylinderWithSound.displayName = 'RevolverCylinderWithSound';
