// ==========================================
// STAT PROGRESS CARD
// Componente de estatistica com progressao
// ==========================================

import { useState, useEffect } from 'react';
import { StatProgress, StatDefinition } from '@shared/types/stats.types';
import { formatStatValue, formatMilestone } from '@shared/constants/stats';
import './StatProgressCard.css';

// ==========================================
// TYPES
// ==========================================

interface Props {
  stat: StatProgress;
  definition: StatDefinition;
}

// ==========================================
// ICON MAPPING
// ==========================================

const STAT_ICONS: Record<string, string> = {
  skull: '\u2620\uFE0F',
  grave: '\u26B0\uFE0F',
  explosion: '\uD83D\uDCA5',
  target: '\uD83C\uDFAF',
  saw: '\uD83E\uDE93',
  gamepad: '\uD83C\uDFAE',
  trophy: '\uD83C\uDFC6',
  fire: '\uD83D\uDD25',
  backpack: '\uD83C\uDF92',
  syringe: '\uD83D\uDC89',
  handcuffs: '\u26D3\uFE0F',
  magnifying: '\uD83D\uDD0D',
  medicine: '\uD83D\uDC8A',
};

// ==========================================
// COMPONENT
// ==========================================

export default function StatProgressCard({ stat, definition }: Props) {
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const [animatedValue, setAnimatedValue] = useState(0);

  // Animar progresso
  useEffect(() => {
    const duration = 800;
    const startTime = Date.now();
    const startProgress = animatedProgress;
    const targetProgress = stat.progress;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);

      setAnimatedProgress(startProgress + (targetProgress - startProgress) * easeOut);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [stat.progress]);

  // Animar valor
  useEffect(() => {
    const duration = 1000;
    const startTime = Date.now();
    const startValue = animatedValue;
    const targetValue = stat.value;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);

      setAnimatedValue(Math.floor(startValue + (targetValue - startValue) * easeOut));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [stat.value]);

  const icon = STAT_ICONS[definition.icon] || '\uD83D\uDCCA';

  return (
    <div className="stat-card">
      {/* Header */}
      <div className="stat-card__header">
        <span className="stat-card__icon">{icon}</span>
        <span className="stat-card__name">{definition.name}</span>
      </div>

      {/* Values */}
      <div className="stat-card__values">
        <span className="stat-card__current">
          {formatStatValue(animatedValue, definition.format)}
        </span>
        {stat.nextMilestone && (
          <>
            <span className="stat-card__separator">/</span>
            <span className="stat-card__target">
              {formatMilestone(stat.nextMilestone)}
            </span>
          </>
        )}
        {!stat.nextMilestone && (
          <span className="stat-card__complete">MAX</span>
        )}
      </div>

      {/* Progress Bar */}
      <div className="stat-card__progress-container">
        <div className="stat-card__progress-track">
          <div
            className="stat-card__progress-fill"
            style={{ width: `${animatedProgress}%` }}
          />
        </div>
        <span className="stat-card__progress-percent">
          {animatedProgress.toFixed(0)}%
        </span>
      </div>

      {/* Milestones */}
      <div className="stat-card__milestones">
        {definition.milestones.map((milestone, index) => {
          const isCompleted = stat.completedMilestones.includes(milestone);
          const isCurrent = stat.nextMilestone === milestone;

          let state = 'locked';
          if (isCompleted) state = 'completed';
          else if (isCurrent) state = 'current';

          return (
            <div
              key={milestone}
              className={`stat-card__milestone stat-card__milestone--${state}`}
              title={`${formatMilestone(milestone)} - ${definition.xpPerMilestone[index]} XP`}
            >
              <span className="stat-card__milestone-value">
                {formatMilestone(milestone)}
              </span>
              {isCompleted && <span className="stat-card__milestone-check">\u2713</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
