import { IconProps, getIconSize } from '../Icon';

// Cores fixas do emoji de medalha 🎖️
const MEDAL_GOLD = '#FFD700';
const MEDAL_DARK_GOLD = '#DAA520';
const MEDAL_LIGHT_GOLD = '#FFE55C';
const RIBBON_RED = '#E53935';
const RIBBON_DARK_RED = '#C62828';
const RIBBON_BLUE = '#1E88E5';

export function MedalIcon({ size, className, style, title }: IconProps) {
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

      {/* Fita esquerda - vermelha */}
      <path
        d="M8 1H10L12 8L10 9L8 1Z"
        fill={RIBBON_RED}
      />
      <path
        d="M8.5 2H9.5L11 7L10 7.5L8.5 2Z"
        fill={RIBBON_DARK_RED}
        opacity="0.5"
      />

      {/* Fita direita - azul */}
      <path
        d="M16 1H14L12 8L14 9L16 1Z"
        fill={RIBBON_BLUE}
      />
      <path
        d="M15.5 2H14.5L13 7L14 7.5L15.5 2Z"
        fill="#1565C0"
        opacity="0.5"
      />

      {/* Sombra da medalha */}
      <circle cx="12" cy="16" r="7" fill="#1a1a1a" opacity="0.2" />

      {/* Medalha - disco principal dourado */}
      <circle cx="12" cy="15" r="7" fill={MEDAL_GOLD} />

      {/* Borda interna */}
      <circle cx="12" cy="15" r="5.5" fill={MEDAL_DARK_GOLD} opacity="0.4" />

      {/* Anel interno da medalha */}
      <circle cx="12" cy="15" r="5" fill={MEDAL_GOLD} />
      <circle cx="12" cy="15" r="4" fill={MEDAL_DARK_GOLD} opacity="0.3" />

      {/* Estrela central - dourada clara */}
      <path
        d="M12 11L13 13.5H15.5L13.5 15L14.5 17.5L12 15.5L9.5 17.5L10.5 15L8.5 13.5H11L12 11Z"
        fill={MEDAL_LIGHT_GOLD}
      />

      {/* Brilho na medalha */}
      <ellipse cx="10" cy="13" rx="1.5" ry="1" fill="white" opacity="0.4" />

      {/* Brilho secundário */}
      <ellipse cx="14" cy="12" rx="0.8" ry="0.5" fill="white" opacity="0.3" />

      {/* Detalhes de borda */}
      <circle cx="12" cy="15" r="6.5" fill="none" stroke={MEDAL_LIGHT_GOLD} strokeWidth="0.5" opacity="0.6" />
    </svg>
  );
}
