// Achievement: Demolidor - Cause 50 de dano total
import { IconProps, getIconSize } from '../Icon';

export function DemolisherIcon({ size = 'md', className, style, title }: IconProps) {
  const s = getIconSize(size);

  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      style={style}
      aria-label={title || 'Demolidor'}
    >
      {/* Punho */}
      <path
        d="M12 20C12 20 8 22 8 28C8 34 12 38 18 38L30 38C34 38 38 34 38 28L38 24C38 20 36 18 32 18L24 18"
        fill="#fbbf24"
      />
      {/* Dedos */}
      <rect x="14" y="12" width="6" height="14" rx="3" fill="#fbbf24" />
      <rect x="21" y="10" width="6" height="16" rx="3" fill="#fbbf24" />
      <rect x="28" y="12" width="6" height="14" rx="3" fill="#fbbf24" />
      <rect x="35" y="16" width="5" height="10" rx="2.5" fill="#fbbf24" />
      {/* Sombras nos dedos */}
      <rect x="14" y="20" width="6" height="6" rx="2" fill="#d97706" opacity="0.5" />
      <rect x="21" y="20" width="6" height="6" rx="2" fill="#d97706" opacity="0.5" />
      <rect x="28" y="20" width="6" height="6" rx="2" fill="#d97706" opacity="0.5" />
      {/* Impacto */}
      <path d="M6 14L2 10" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
      <path d="M4 20L0 20" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
      <path d="M6 26L2 30" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
      {/* Rachaduras */}
      <path d="M44 16L48 12" stroke="#f97316" strokeWidth="2" strokeLinecap="round" />
      <path d="M46 22L48 22" stroke="#f97316" strokeWidth="2" strokeLinecap="round" />
      <path d="M44 28L48 32" stroke="#f97316" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
