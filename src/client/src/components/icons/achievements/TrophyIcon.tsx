import { IconProps, getIconSize } from '../Icon';

// Cores fixas do emoji de troféu 🏆
const TROPHY_GOLD = '#FFD700';
const TROPHY_DARK_GOLD = '#DAA520';
const TROPHY_LIGHT_GOLD = '#FFE55C';
const TROPHY_BRONZE = '#CD7F32';

export function TrophyIcon({ size, className, style, title }: IconProps) {
  const s = getIconSize(size);
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      style={style}
      aria-hidden={!title}
      role={title ? 'img' : undefined}
    >
      {title && <title>{title}</title>}

      {/* Sombra de fundo */}
      <path
        d="M5 4H19V11C19 15.5 16 18 12 18C8 18 5 15.5 5 11V4Z"
        fill="#1a1a1a"
        opacity="0.2"
      />

      {/* Copa principal - dourada */}
      <path
        d="M5 3H19V10C19 14.5 16 17 12 17C8 17 5 14.5 5 10V3Z"
        fill={TROPHY_GOLD}
      />

      {/* Interior da copa */}
      <path
        d="M7 5H17V10C17 13.5 15 15 12 15C9 15 7 13.5 7 10V5Z"
        fill={TROPHY_DARK_GOLD}
        opacity="0.4"
      />

      {/* Alça esquerda - dourada */}
      <path
        d="M5 5H3C2 5 1 6 1 7V9C1 11 2.5 12 4 12H5V10H4C3 10 3 9 3 9V7H5V5Z"
        fill={TROPHY_GOLD}
      />

      {/* Alça direita - dourada */}
      <path
        d="M19 5H21C22 5 23 6 23 7V9C23 11 21.5 12 20 12H19V10H20C21 10 21 9 21 9V7H19V5Z"
        fill={TROPHY_GOLD}
      />

      {/* Sombra nas alças */}
      <rect x="3" y="7" width="1" height="2" fill={TROPHY_DARK_GOLD} opacity="0.5" />
      <rect x="20" y="7" width="1" height="2" fill={TROPHY_DARK_GOLD} opacity="0.5" />

      {/* Estrela central na copa - mais clara */}
      <path
        d="M12 6L13 9H16L13.5 11L14.5 14L12 12L9.5 14L10.5 11L8 9H11L12 6Z"
        fill={TROPHY_LIGHT_GOLD}
      />

      {/* Haste - bronze */}
      <rect x="10" y="17" width="4" height="2" fill={TROPHY_BRONZE} />
      <rect x="10.5" y="17.5" width="3" height="1" fill="#1a1a1a" opacity="0.3" />

      {/* Base - bronze */}
      <rect x="6" y="19" width="12" height="3" rx="1" fill={TROPHY_BRONZE} />
      <rect x="7" y="20" width="10" height="1.5" fill="#1a1a1a" opacity="0.3" />

      {/* Detalhes da base */}
      <rect x="8" y="19" width="1" height="3" fill={TROPHY_GOLD} opacity="0.6" />
      <rect x="15" y="19" width="1" height="3" fill={TROPHY_GOLD} opacity="0.6" />

      {/* Brilhos na copa */}
      <ellipse cx="9" cy="7" rx="1.5" ry="2" fill="white" opacity="0.4" />
      <ellipse cx="8" cy="9" rx="0.8" ry="1" fill="white" opacity="0.25" />

      {/* Brilho na borda */}
      <path
        d="M6 4C7 3.5 10 3 12 3"
        stroke="white"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.35"
      />
    </svg>
  );
}
