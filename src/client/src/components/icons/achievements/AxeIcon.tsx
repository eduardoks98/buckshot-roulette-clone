import { IconProps, getIconSize } from '../Icon';

// Cores fixas do emoji de machado 🪓
const BLADE_SILVER = '#C0C0C0';
const BLADE_DARK = '#909090';
const HANDLE_BROWN = '#8B4513';
const HANDLE_DARK = '#5D2906';

export function AxeIcon({ size, className, style, title }: IconProps) {
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

      {/* Cabo do machado - madeira marrom */}
      <path
        d="M5 19L11 13"
        stroke={HANDLE_BROWN}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M5.5 18.5L10.5 13.5"
        stroke={HANDLE_DARK}
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.5"
      />

      {/* Lâmina do machado - prata */}
      <path
        d="M10 14L12 12L14 6C14 6 16 4 19 4C20 4 21 5 21 6C21 9 19 11 19 11L13 13L11 15L10 14Z"
        fill={BLADE_SILVER}
      />

      {/* Detalhe interno da lâmina - escuro */}
      <path
        d="M13 11L15 7C15.5 6 17 5 18 5C18.5 5 19 5.5 19 6C19 7 18 8.5 17 9L13 11Z"
        fill={BLADE_DARK}
        opacity="0.5"
      />

      {/* Brilho na lâmina */}
      <path
        d="M14 8L16 6"
        stroke="white"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.5"
      />

      {/* Encaixe cabo-lâmina */}
      <rect x="10" y="12" width="3" height="3" rx="0.5" fill={BLADE_SILVER} transform="rotate(-45 11.5 13.5)" />
    </svg>
  );
}
