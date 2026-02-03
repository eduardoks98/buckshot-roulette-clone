import { IconProps, getIconSize } from '../Icon';

// Cores fixas do emoji de fogo 🔥
const FIRE_RED = '#FF4500';
const FIRE_ORANGE = '#FF6B00';
const FIRE_YELLOW = '#FFD700';
const FIRE_LIGHT_YELLOW = '#FFEB3B';

export function FireIcon({ size, className, style, title }: IconProps) {
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

      {/* Chama externa - vermelha */}
      <path
        d="M12 2C12 2 8 6 8 10C8 11 8 12 8.5 13C7.5 12 6 10 6 8C4 10 3 13 3 15C3 19 7 22 12 22C17 22 21 19 21 15C21 13 20 10 18 8C18 10 16.5 12 15.5 13C16 12 16 11 16 10C16 6 12 2 12 2Z"
        fill={FIRE_RED}
      />

      {/* Chama média - laranja */}
      <path
        d="M12 5C12 5 9 8 9 11C9 12 9 13 9.5 14C8.5 13 7.5 11.5 7.5 10C6 11.5 5 13.5 5 15.5C5 18.5 8 20.5 12 20.5C16 20.5 19 18.5 19 15.5C19 13.5 18 11.5 16.5 10C16.5 11.5 15.5 13 14.5 14C15 13 15 12 15 11C15 8 12 5 12 5Z"
        fill={FIRE_ORANGE}
      />

      {/* Chama interna - amarela */}
      <path
        d="M12 8C12 8 10 10 10 12.5C10 14 10.5 15 11 15.5C10.5 15 9.5 14 9.5 13C8.5 14 8 15 8 16C8 18 9.5 19 12 19C14.5 19 16 18 16 16C16 15 15.5 14 14.5 13C14.5 14 13.5 15 13 15.5C13.5 15 14 14 14 12.5C14 10 12 8 12 8Z"
        fill={FIRE_YELLOW}
      />

      {/* Centro da chama - amarelo claro */}
      <path
        d="M12 10C12 10 11 11 11 13C11 13.5 11 14 11.5 14.5C10.5 14 10 13 10 14.5C10 16 10.5 17 12 17C13.5 17 14 16 14 14.5C14 13 13.5 14 12.5 14.5C13 14 13 13.5 13 13C13 11 12 10 12 10Z"
        fill={FIRE_LIGHT_YELLOW}
      />

      {/* Chama mais interna */}
      <path
        d="M12 12C12 12 11 13 11 14C11 15 11.5 16 12 16C12.5 16 13 15 13 14C13 13 12 12 12 12Z"
        fill={FIRE_LIGHT_YELLOW}
      />

      {/* Centro brilhante */}
      <ellipse cx="12" cy="14.5" rx="0.8" ry="1" fill="white" opacity="0.7" />

      {/* Faíscas - amarelas */}
      <circle cx="8" cy="6" r="0.6" fill={FIRE_YELLOW} />
      <circle cx="15" cy="5" r="0.5" fill={FIRE_ORANGE} />
      <circle cx="17" cy="8" r="0.5" fill={FIRE_YELLOW} />
      <circle cx="6" cy="10" r="0.4" fill={FIRE_ORANGE} />
    </svg>
  );
}
