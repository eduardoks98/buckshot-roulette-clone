// Achievement: Campeao - Venca 10 partidas
import { IconProps, getIconSize } from '../Icon';

export function ChampionIcon({ size = 'md', className, style, title }: IconProps) {
  const s = getIconSize(size);

  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      style={style}
      aria-label={title || 'Campeao'}
    >
      {/* Trofeu - copa */}
      <path
        d="M14 8L14 20C14 26 18 30 24 30C30 30 34 26 34 20L34 8L14 8Z"
        fill="#fbbf24"
      />
      <path
        d="M16 10L16 20C16 24 19 28 24 28C29 28 32 24 32 20L32 10L16 10Z"
        fill="#fcd34d"
      />
      {/* Alcas do trofeu */}
      <path
        d="M14 12C14 12 8 12 8 18C8 24 14 24 14 24"
        stroke="#fbbf24"
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M34 12C34 12 40 12 40 18C40 24 34 24 34 24"
        stroke="#fbbf24"
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
      />
      {/* Base */}
      <rect x="20" y="30" width="8" height="4" fill="#d97706" />
      <rect x="16" y="34" width="16" height="4" rx="1" fill="#92400e" />
      <rect x="14" y="38" width="20" height="6" rx="2" fill="#78350f" />
      {/* Estrela no trofeu */}
      <path
        d="M24 14L25.5 17.5L29 18L26.5 20.5L27 24L24 22L21 24L21.5 20.5L19 18L22.5 17.5L24 14Z"
        fill="#ffffff"
        opacity="0.9"
      />
      {/* Brilho */}
      <path d="M18 12C18 12 20 10 22 12" stroke="#fef3c7" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
      {/* Numero 1 */}
      <text x="24" y="43" textAnchor="middle" fill="#fbbf24" fontSize="5" fontWeight="bold">#1</text>
    </svg>
  );
}
