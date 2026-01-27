// ==========================================
// ACHIEVEMENT TOAST COMPONENT
// Queued notification popup for unlocked achievements
// ==========================================

import { useState, useEffect, useCallback, useRef } from 'react';
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
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevAchievementsRef = useRef<AchievementUnlocked[]>([]);

  // Clear all timers
  const clearTimers = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (exitTimerRef.current) {
      clearTimeout(exitTimerRef.current);
      exitTimerRef.current = null;
    }
  }, []);

  // Advance to next achievement or dismiss
  const advanceOrDismiss = useCallback(() => {
    setExiting(true);

    exitTimerRef.current = setTimeout(() => {
      setCurrentIndex(prev => {
        const nextIndex = prev + 1;
        if (nextIndex >= achievements.length) {
          onDismiss?.();
          return prev;
        }
        setExiting(false);
        return nextIndex;
      });
    }, EXIT_ANIMATION_DURATION);
  }, [achievements.length, onDismiss]);

  // Handle manual dismiss
  const handleDismiss = useCallback(() => {
    clearTimers();
    advanceOrDismiss();
  }, [clearTimers, advanceOrDismiss]);

  // Start display timer
  useEffect(() => {
    if (achievements.length === 0 || currentIndex >= achievements.length) {
      return;
    }

    clearTimers();

    timerRef.current = setTimeout(() => {
      advanceOrDismiss();
    }, DISPLAY_DURATION);

    return () => clearTimers();
  }, [currentIndex, achievements.length, advanceOrDismiss, clearTimers]);

  // Reset index only when achievements array actually changes (new array reference with different content)
  useEffect(() => {
    const prevAchievements = prevAchievementsRef.current;
    const hasChanged = achievements.length !== prevAchievements.length ||
      achievements.some((a, i) => a.achievementId !== prevAchievements[i]?.achievementId);

    if (hasChanged && achievements.length > 0) {
      clearTimers();
      setCurrentIndex(0);
      setExiting(false);
    }

    prevAchievementsRef.current = achievements;
  }, [achievements, clearTimers]);

  // Cleanup on unmount
  useEffect(() => {
    return () => clearTimers();
  }, [clearTimers]);

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
        <button
          className="achievement-toast__close"
          onClick={handleDismiss}
          aria-label="Fechar"
        >
          ×
        </button>
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
        {achievements.length > 1 && (
          <div className="achievement-toast__counter">
            {currentIndex + 1} / {achievements.length}
          </div>
        )}
      </div>
    </div>
  );
}
