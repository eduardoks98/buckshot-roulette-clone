import { IconProps, getIconSize } from '../Icon';

// Cores fixas do emoji de mochila 🎒
const BACKPACK_ORANGE = '#FF7043';
const BACKPACK_DARK = '#E64A19';
const STRAP_GRAY = '#757575';

export function BackpackIcon({ size, className, style, title }: IconProps) {
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
        d="M5 10C5 8 7 6 12 6C17 6 19 8 19 10V21C19 22 18 23 17 23H7C6 23 5 22 5 21V10Z"
        fill="#1a1a1a"
        opacity="0.2"
      />

      {/* Corpo principal da mochila - laranja */}
      <path
        d="M5 9C5 7 7 5 12 5C17 5 19 7 19 9V20C19 21 18 22 17 22H7C6 22 5 21 5 20V9Z"
        fill={BACKPACK_ORANGE}
      />

      {/* Interior escuro */}
      <path
        d="M7 10V19C7 19.5 7.5 20 8 20H16C16.5 20 17 19.5 17 19V10C17 8.5 15 7 12 7C9 7 7 8.5 7 10Z"
        fill={BACKPACK_DARK}
        opacity="0.3"
      />

      {/* Alça superior - cinza */}
      <path
        d="M9 5V3.5C9 2.5 10 2 12 2C14 2 15 2.5 15 3.5V5"
        stroke={STRAP_GRAY}
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* Bolso frontal - sólido */}
      <rect x="8" y="11" width="8" height="7" rx="1.5" fill={BACKPACK_ORANGE} />
      <rect x="8" y="11" width="8" height="7" rx="1.5" fill={BACKPACK_DARK} opacity="0.2" />

      {/* Interior do bolso */}
      <rect x="9" y="13" width="6" height="4" rx="1" fill="#1a1a1a" opacity="0.4" />

      {/* Aba do bolso */}
      <path
        d="M8 12.5H16"
        stroke={BACKPACK_DARK}
        strokeWidth="1.5"
      />

      {/* Fecho do bolso - cinza */}
      <rect x="11" y="11.5" width="2" height="1.5" rx="0.5" fill={STRAP_GRAY} />

      {/* Alças laterais - cinza */}
      <path
        d="M5 12C4 12 3 13 3 14V16C3 17 4 18 5 18"
        stroke={STRAP_GRAY}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M19 12C20 12 21 13 21 14V16C21 17 20 18 19 18"
        stroke={STRAP_GRAY}
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* Brilho */}
      <path
        d="M8 7C9 6.5 11 6 12 6"
        stroke="white"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.3"
      />
    </svg>
  );
}
