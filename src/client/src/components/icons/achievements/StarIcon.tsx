import { IconProps, getIconSize } from '../Icon';

// Cores fixas do emoji de estrela ⭐
const STAR_GOLD = '#FFD700';
const STAR_DARK_GOLD = '#DAA520';
const STAR_LIGHT_GOLD = '#FFE55C';

export function StarIcon({ size, className, style, title }: IconProps) {
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
        d="M12 3L14.5 10H22L16 14.5L18.5 22L12 17.5L5.5 22L8 14.5L2 10H9.5L12 3Z"
        fill="#1a1a1a"
        opacity="0.2"
        transform="translate(0.5, 0.5)"
      />

      {/* Estrela principal - dourada */}
      <path
        d="M12 2L14.5 9H22L16 13.5L18.5 21L12 16.5L5.5 21L8 13.5L2 9H9.5L12 2Z"
        fill={STAR_GOLD}
      />

      {/* Sombra interna */}
      <path
        d="M12 5L13.8 10H19L15 13L17 19L12 15.5L7 19L9 13L5 10H10.2L12 5Z"
        fill={STAR_DARK_GOLD}
        opacity="0.4"
      />

      {/* Estrela interna brilhante */}
      <path
        d="M12 7L13 10.5H16.5L13.5 12.5L14.5 16L12 14L9.5 16L10.5 12.5L7.5 10.5H11L12 7Z"
        fill={STAR_LIGHT_GOLD}
      />

      {/* Centro brilhante */}
      <circle cx="12" cy="12" r="2" fill={STAR_LIGHT_GOLD} />
      <circle cx="12" cy="12" r="1" fill="white" opacity="0.5" />

      {/* Brilhos nas pontas */}
      <circle cx="12" cy="3" r="0.6" fill="white" opacity="0.6" />
      <circle cx="21" cy="9.5" r="0.5" fill="white" opacity="0.4" />
      <circle cx="3" cy="9.5" r="0.5" fill="white" opacity="0.4" />

      {/* Brilho principal */}
      <ellipse cx="10" cy="8" rx="1" ry="1.5" fill="white" opacity="0.35" />
    </svg>
  );
}
