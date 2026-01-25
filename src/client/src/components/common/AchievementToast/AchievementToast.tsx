// ==========================================
// ACHIEVEMENT TOAST COMPONENT
// Queued notification popup for unlocked achievements
// ==========================================

import { useState, useEffect, useCallback } from 'react';
import type { AchievementUnlocked } from '../../../../../shared/types/achievement.types';
import './AchievementToast.css';

interface AchievementToastProps {
  achievements: AchievementUnlocked[];
  onDismiss?: () => void;
}

const DISPLAY_DURATION = 5000;
const EXIT_ANIMATION_DURATION = 350;

export default function AchievementToast({
  achievements,
  onDismiss,
}: AchievementToastProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [exiting, setExiting] = useState(false);

  const advanceOrDismiss = useCallback(() => {
    setExiting(true);

    const exitTimer = setTimeout(() => {
      const nextIndex = currentIndex + 1;

      if (nextIndex >= achievements.length) {
        onDismiss?.();
      } else {
        setCurrentIndex(nextIndex);
        setExiting(false);
      }
    }, EXIT_ANIMATION_DURATION);

    return exitTimer;
  }, [currentIndex, achievements.length, onDismiss]);

  useEffect(() => {
    if (achievements.length === 0) return;

    const displayTimer = setTimeout(() => {
      advanceOrDismiss();
    }, DISPLAY_DURATION);

    return () => clearTimeout(displayTimer);
  }, [currentIndex, achievements.length, advanceOrDismiss]);

  // Reset index when achievements array changes
  useEffect(() => {
    setCurrentIndex(0);
    setExiting(false);
  }, [achievements]);

  if (achievements.length === 0 || currentIndex >= achievements.length) {
    return null;
  }

  const achievement = achievements[currentIndex];

  const cardClassName = [
    'achievement-toast__card',
    exiting ? 'achievement-toast__card--exit' : 'achievement-toast__card--enter',
  ].join(' ');

  return (
    <div className="achievement-toast">
      <div className={cardClassName} key={currentIndex}>
        <div className="achievement-toast__header">
          CONQUISTA DESBLOQUEADA!
        </div>
        <div className="achievement-toast__body">
          <span className="achievement-toast__icon">{achievement.icon}</span>
          <div className="achievement-toast__info">
            <span className="achievement-toast__name">{achievement.name}</span>
            <span className="achievement-toast__description">{achievement.description}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
