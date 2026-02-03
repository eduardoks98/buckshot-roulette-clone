import { IconProps, getIconSize } from '../Icon';

// Cores fixas do emoji de serra 🪚
const SAW_SILVER = '#C0C0C0';
const SAW_DARK_SILVER = '#909090';
const SAW_LIGHT_SILVER = '#E0E0E0';
const HANDLE_BROWN = '#8B4513';
const HANDLE_DARK = '#5D2906';

export function SawIcon({ size, className, style, title }: IconProps) {
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

      {/* Cabo da serra - marrom */}
      <path
        d="M3 14L5 12L7 14L5 16L3 14Z"
        fill={HANDLE_BROWN}
      />
      <path
        d="M5 12L7 10L9 12"
        stroke={HANDLE_BROWN}
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* Cabo - parte de trás */}
      <rect x="2" y="13" width="4" height="4" rx="1" fill={HANDLE_BROWN} />
      <rect x="2.5" y="13.5" width="3" height="3" rx="0.5" fill={HANDLE_DARK} opacity="0.4" />

      {/* Lâmina da serra - prata */}
      <path
        d="M7 10L20 6L21 7L8 14L7 10Z"
        fill={SAW_SILVER}
      />

      {/* Interior da lâmina - sombra */}
      <path
        d="M8 10L18 7L19 8L9 13L8 10Z"
        fill={SAW_DARK_SILVER}
        opacity="0.4"
      />

      {/* Dentes da serra - prata */}
      <path
        d="M10 8L11 6L12 8L13 6L14 8L15 6L16 8L17 6L18 8L19 6L20 7"
        stroke={SAW_LIGHT_SILVER}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Detalhes dos dentes */}
      <path
        d="M11 7L12 6M13 7L14 6M15 7L16 6M17 7L18 6"
        stroke={SAW_DARK_SILVER}
        strokeWidth="0.5"
        opacity="0.6"
      />

      {/* Brilho na lâmina */}
      <path
        d="M10 9L14 8"
        stroke="white"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.4"
      />

      {/* Parafuso do cabo */}
      <circle cx="4" cy="15" r="1" fill={SAW_SILVER} />
      <circle cx="4" cy="15" r="0.5" fill={SAW_DARK_SILVER} />
    </svg>
  );
}
