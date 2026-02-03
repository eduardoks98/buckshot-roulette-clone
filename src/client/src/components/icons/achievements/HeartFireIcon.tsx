import { IconProps, getIconSize } from '../Icon';

// Cores fixas do emoji de coração em chamas ❤️‍🔥
const HEART_RED = '#E53935';
const HEART_DARK_RED = '#C62828';
const FIRE_ORANGE = '#FF6B00';
const FIRE_YELLOW = '#FFD700';
const FIRE_LIGHT = '#FFEB3B';

export function HeartFireIcon({ size, className, style, title }: IconProps) {
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
        d="M12 22C12 22 3 15 3 9C3 6 5 4 8 4C10 4 11.5 5 12 6.5C12.5 5 14 4 16 4C19 4 21 6 21 9C21 15 12 22 12 22Z"
        fill="#1a1a1a"
        opacity="0.2"
      />

      {/* Coração - vermelho */}
      <path
        d="M12 21C12 21 3 14 3 8C3 5 5 3 8 3C10 3 11.5 4 12 5.5C12.5 4 14 3 16 3C19 3 21 5 21 8C21 14 12 21 12 21Z"
        fill={HEART_RED}
      />

      {/* Interior escuro do coração */}
      <path
        d="M12 18C12 18 5 13 5 8.5C5 6 6.5 4.5 8.5 4.5C10 4.5 11 5.5 12 7C13 5.5 14 4.5 15.5 4.5C17.5 4.5 19 6 19 8.5C19 13 12 18 12 18Z"
        fill={HEART_DARK_RED}
        opacity="0.4"
      />

      {/* Chama externa - laranja */}
      <path
        d="M12 17C12 17 8 13 8 10C8 8 9 7 10 7C10.5 7 11 7.5 11.5 8C11.5 8 11 6 12 5C13 6 12.5 8 12.5 8C13 7.5 13.5 7 14 7C15 7 16 8 16 10C16 13 12 17 12 17Z"
        fill={FIRE_ORANGE}
      />

      {/* Chama média - amarela */}
      <path
        d="M12 15C12 15 9 12 9 10C9 8.5 10 8 11 8.5C11.5 9 11.5 9.5 12 9C12.5 9.5 12.5 9 13 8.5C14 8 15 8.5 15 10C15 12 12 15 12 15Z"
        fill={FIRE_YELLOW}
      />

      {/* Chama interna - amarelo claro */}
      <path
        d="M12 13C12 13 10.5 11.5 10.5 10.5C10.5 9.5 11 9 12 10C13 9 13.5 9.5 13.5 10.5C13.5 11.5 12 13 12 13Z"
        fill={FIRE_LIGHT}
      />

      {/* Centro brilhante */}
      <ellipse cx="12" cy="11" rx="0.5" ry="0.8" fill="white" opacity="0.7" />

      {/* Brilho no coração */}
      <path
        d="M6 6C7 5 8 5 9 5.5"
        stroke="white"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.3"
      />
    </svg>
  );
}
