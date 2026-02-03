import { IconProps, getIconSize } from '../Icon';

// Cores fixas do emoji de explosão 💥
const EXPLOSION_RED = '#FF4500';
const EXPLOSION_ORANGE = '#FF6B00';
const EXPLOSION_YELLOW = '#FFD700';
const EXPLOSION_LIGHT = '#FFEB3B';

export function ExplosionIcon({ size, className, style, title }: IconProps) {
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

      {/* Raios externos - vermelho */}
      <path
        d="M12 1L13.5 7L19 3L15.5 8.5L23 10L16 12L23 14L15.5 15.5L19 21L13.5 17L12 23L10.5 17L5 21L8.5 15.5L1 14L8 12L1 10L8.5 8.5L5 3L10.5 7L12 1Z"
        fill={EXPLOSION_RED}
      />

      {/* Camada média - laranja */}
      <path
        d="M12 4L13 8L16 6L14 9.5L19 11L14.5 12L19 13L14 14.5L16 18L13 16L12 20L11 16L8 18L10 14.5L5 13L9.5 12L5 11L10 9.5L8 6L11 8L12 4Z"
        fill={EXPLOSION_ORANGE}
      />

      {/* Camada interna - amarelo */}
      <path
        d="M12 6L12.8 9L15 7.5L13.5 10L17 11L14 12L17 13L13.5 14L15 16.5L12.8 15L12 18L11.2 15L9 16.5L10.5 14L7 13L10 12L7 11L10.5 10L9 7.5L11.2 9L12 6Z"
        fill={EXPLOSION_YELLOW}
      />

      {/* Centro da explosão - núcleo amarelo claro */}
      <circle cx="12" cy="12" r="4" fill={EXPLOSION_YELLOW} />

      {/* Centro mais claro */}
      <circle cx="12" cy="12" r="2.5" fill={EXPLOSION_LIGHT} />

      {/* Centro brilhante */}
      <circle cx="12" cy="12" r="1.5" fill="white" opacity="0.8" />

      {/* Faíscas amarelas */}
      <circle cx="7" cy="7" r="0.8" fill={EXPLOSION_YELLOW} />
      <circle cx="17" cy="7" r="0.8" fill={EXPLOSION_YELLOW} />
      <circle cx="7" cy="17" r="0.8" fill={EXPLOSION_YELLOW} />
      <circle cx="17" cy="17" r="0.8" fill={EXPLOSION_YELLOW} />

      {/* Brilhos */}
      <circle cx="10" cy="9" r="0.5" fill="white" opacity="0.6" />
      <circle cx="14" cy="10" r="0.4" fill="white" opacity="0.5" />
    </svg>
  );
}
