import { IconProps, getIconSize } from '../Icon';

// Cores fixas do emoji de coroa 👑
const CROWN_GOLD = '#FFD700';
const CROWN_DARK_GOLD = '#DAA520';
const CROWN_LIGHT_GOLD = '#FFE55C';
const JEWEL_RED = '#E53935';
const JEWEL_BLUE = '#1E88E5';
const JEWEL_GREEN = '#43A047';

export function CrownIcon({ size, className, style, title }: IconProps) {
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
        d="M2 9L5 19H19L22 9L17 13L12 5L7 13L2 9Z"
        fill="#1a1a1a"
        opacity="0.2"
      />

      {/* Corpo da coroa - dourado */}
      <path
        d="M2 8L5 18H19L22 8L17 12L12 4L7 12L2 8Z"
        fill={CROWN_GOLD}
      />

      {/* Sombra interna */}
      <path
        d="M4 9L6 16H18L20 9L16 12L12 6L8 12L4 9Z"
        fill={CROWN_DARK_GOLD}
        opacity="0.5"
      />

      {/* Base da coroa - dourada */}
      <rect x="4" y="18" width="16" height="3" rx="1" fill={CROWN_GOLD} />
      <rect x="5" y="19" width="14" height="1.5" fill={CROWN_DARK_GOLD} opacity="0.4" />

      {/* Joia central (topo) - vermelha */}
      <circle cx="12" cy="4" r="2" fill={JEWEL_RED} />
      <circle cx="12" cy="4" r="0.8" fill="#FF6B6B" opacity="0.6" />

      {/* Joia esquerda - azul */}
      <circle cx="7" cy="12" r="1.5" fill={JEWEL_BLUE} />
      <circle cx="7" cy="12" r="0.6" fill="#64B5F6" opacity="0.6" />

      {/* Joia direita - verde */}
      <circle cx="17" cy="12" r="1.5" fill={JEWEL_GREEN} />
      <circle cx="17" cy="12" r="0.6" fill="#81C784" opacity="0.6" />

      {/* Joia frontal - vermelha */}
      <circle cx="12" cy="14" r="1.5" fill={JEWEL_RED} />
      <circle cx="12" cy="14" r="0.6" fill="#FF6B6B" opacity="0.6" />

      {/* Brilhos na coroa */}
      <path
        d="M6 10L8 9"
        stroke="white"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.4"
      />
      <ellipse cx="15" cy="8" rx="1" ry="0.5" fill="white" opacity="0.3" />
      <ellipse cx="9" cy="15" rx="0.8" ry="0.4" fill="white" opacity="0.25" />
    </svg>
  );
}
