// ==========================================
// TIMER COMPONENT
// ==========================================

import { useEffect, useState } from 'react';
import './Timer.css';

interface TimerProps {
  seconds: number;
  onExpire?: () => void;
  warningThreshold?: number;
  paused?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function Timer({
  seconds: initialSeconds,
  onExpire,
  warningThreshold = 10,
  paused = false,
  size = 'md',
}: TimerProps) {
  const [seconds, setSeconds] = useState(initialSeconds);

  useEffect(() => {
    setSeconds(initialSeconds);
  }, [initialSeconds]);

  useEffect(() => {
    if (paused || seconds <= 0) return;

    const interval = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onExpire?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [paused, onExpire, seconds]);

  const isWarning = seconds <= warningThreshold && seconds > 0;
  const isCritical = seconds <= 5 && seconds > 0;

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${secs}s`;
  };

  return (
    <div
      className={`timer timer-${size} ${isWarning ? 'warning' : ''} ${isCritical ? 'critical' : ''}`}
    >
      <span className="timer-value">{formatTime(seconds)}</span>
    </div>
  );
}
