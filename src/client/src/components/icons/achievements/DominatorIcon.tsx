// Achievement: Dominador - Venca todas as 3 rodadas em uma partida
import { IconProps, getIconSize } from '../Icon';

export function DominatorIcon({ size = 'md', className, style, title }: IconProps) {
  const s = getIconSize(size);

  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      style={style}
      aria-label={title || 'Dominador'}
    >
      {/* Coroa */}
      <path
        d="M8 20L12 34L24 30L36 34L40 20L32 26L24 18L16 26L8 20Z"
        fill="#fbbf24"
      />
      <path
        d="M10 22L13 32L24 28.5L35 32L38 22L31 27L24 20L17 27L10 22Z"
        fill="#fcd34d"
      />
      {/* Joias da coroa */}
      <circle cx="24" cy="24" r="4" fill="#ef4444" />
      <circle cx="24" cy="24" r="2.5" fill="#fca5a5" opacity="0.5" />
      <circle cx="14" cy="28" r="2.5" fill="#3b82f6" />
      <circle cx="34" cy="28" r="2.5" fill="#3b82f6" />
      {/* Pontas da coroa */}
      <circle cx="8" cy="20" r="3" fill="#fbbf24" />
      <circle cx="24" cy="14" r="3" fill="#fbbf24" />
      <circle cx="40" cy="20" r="3" fill="#fbbf24" />
      <circle cx="8" cy="20" r="2" fill="#fcd34d" />
      <circle cx="24" cy="14" r="2" fill="#fcd34d" />
      <circle cx="40" cy="20" r="2" fill="#fcd34d" />
      {/* Base da coroa */}
      <rect x="12" y="34" width="24" height="4" rx="1" fill="#d97706" />
      {/* Raios de poder */}
      <path d="M24 6L24 10" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />
      <path d="M18 8L20 11" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
      <path d="M30 8L28 11" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
      {/* 3/3 indicador */}
      <text x="24" y="44" textAnchor="middle" fill="#fbbf24" fontSize="6" fontWeight="bold">3/3</text>
    </svg>
  );
}
