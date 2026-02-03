import { IconProps, getIconSize } from '../Icon';

// Cores fixas do emoji de escudo 🛡️
const SHIELD_BLUE = '#2196F3';
const SHIELD_DARK_BLUE = '#1565C0';
const SHIELD_GOLD = '#FFD700';
const SHIELD_DARK_GOLD = '#DAA520';

export function ShieldIcon({ size, className, style, title }: IconProps) {
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
        d="M12 3L3 6V12C3 17.5 7 21.5 12 23C17 21.5 21 17.5 21 12V6L12 3Z"
        fill="#1a1a1a"
        opacity="0.2"
      />

      {/* Corpo do escudo - azul */}
      <path
        d="M12 2L3 5V11C3 16.5 7 20.5 12 22C17 20.5 21 16.5 21 11V5L12 2Z"
        fill={SHIELD_BLUE}
      />

      {/* Área interna escura */}
      <path
        d="M12 4L5 6.5V11C5 15.5 8 18.5 12 20C16 18.5 19 15.5 19 11V6.5L12 4Z"
        fill={SHIELD_DARK_BLUE}
        opacity="0.4"
      />

      {/* Emblema central - estrela dourada */}
      <path
        d="M12 7L13 10H16L13.5 12L14.5 15L12 13L9.5 15L10.5 12L8 10H11L12 7Z"
        fill={SHIELD_GOLD}
      />

      {/* Brilho na estrela */}
      <circle cx="12" cy="11" r="1" fill={SHIELD_DARK_GOLD} opacity="0.5" />

      {/* Brilho superior */}
      <path
        d="M6 6L10 5"
        stroke="white"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.3"
      />

      {/* Borda de destaque - dourada */}
      <path
        d="M12 2L3 5V11C3 16.5 7 20.5 12 22C17 20.5 21 16.5 21 11V5L12 2Z"
        fill="none"
        stroke={SHIELD_GOLD}
        strokeWidth="1"
        opacity="0.6"
      />
    </svg>
  );
}
