import { IconProps, getIconSize } from '../Icon';

// Cores fixas do emoji de espadas ⚔️
const BLADE_SILVER = '#C0C0C0';
const BLADE_LIGHT = '#E0E0E0';
const GUARD_GOLD = '#FFD700';
const HANDLE_BROWN = '#8B4513';

export function SwordsIcon({ size, className, style, title }: IconProps) {
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

      {/* Espada esquerda - lâmina prata */}
      <path
        d="M3 3L4 2L5 3L13 11L12 12L4 4L3 5L3 3Z"
        fill={BLADE_SILVER}
      />
      <path
        d="M5 3L12 10"
        stroke={BLADE_LIGHT}
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* Espada esquerda - guarda dourada */}
      <path
        d="M11 13L14 10L15 11L12 14L11 13Z"
        fill={GUARD_GOLD}
      />

      {/* Espada esquerda - cabo marrom */}
      <path
        d="M13 15L17 19"
        stroke={HANDLE_BROWN}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle cx="18" cy="20" r="1.5" fill={GUARD_GOLD} />

      {/* Espada direita - lâmina prata */}
      <path
        d="M21 3L20 2L19 3L11 11L12 12L20 4L21 5L21 3Z"
        fill={BLADE_SILVER}
      />
      <path
        d="M19 3L12 10"
        stroke={BLADE_LIGHT}
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* Espada direita - guarda dourada */}
      <path
        d="M13 13L10 10L9 11L12 14L13 13Z"
        fill={GUARD_GOLD}
      />

      {/* Espada direita - cabo marrom */}
      <path
        d="M11 15L7 19"
        stroke={HANDLE_BROWN}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle cx="6" cy="20" r="1.5" fill={GUARD_GOLD} />

      {/* Brilho nas lâminas */}
      <path d="M6 4L10 8" stroke="white" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
      <path d="M18 4L14 8" stroke="white" strokeWidth="1" strokeLinecap="round" opacity="0.4" />

      {/* Centro - cruzamento escuro */}
      <circle cx="12" cy="11" r="1.5" fill="#1a1a1a" />
    </svg>
  );
}
