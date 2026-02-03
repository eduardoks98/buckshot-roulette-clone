import { IconProps, getIconSize } from '../Icon';

// Cores fixas do emoji de músculo 💪
const SKIN_TONE = '#FFCC99';
const SKIN_DARK = '#E5B080';
const SKIN_SHADOW = '#CC9966';

export function MuscleIcon({ size, className, style, title }: IconProps) {
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
        d="M5 21C5 21 3 18 3 16C3 14 4 12 6 11L8 10C9 9.5 10 9 11 9C12 9 13 9.5 14 10L15 10.5C15 10.5 17 7 17 6C17 5 18 4 19 4C20.5 4 22 5 22 7C22 9 20 12 19 13L18 14C19 15 20 16 20 18C20 20 18 22 16 22L5 21Z"
        fill="#1a1a1a"
        opacity="0.2"
      />

      {/* Braço flexionado - forma principal */}
      <path
        d="M5 20C5 20 3 17 3 15C3 13 4 11 6 10L8 9C9 8.5 10 8 11 8C12 8 13 8.5 14 9L15 9.5C15 9.5 17 6 17 5C17 4 18 3 19 3C20.5 3 22 4 22 6C22 8 20 11 19 12L18 13C19 14 20 15 20 17C20 19 18 21 16 21L5 20Z"
        fill={SKIN_TONE}
      />

      {/* Bíceps - volume */}
      <path
        d="M11 8C11 8 13 5 16 4C17.5 3.5 19 4 19 5C19 6.5 17 9 15 10"
        fill={SKIN_TONE}
      />

      {/* Sombra do bíceps */}
      <path
        d="M11 8C11 8 13 5 16 4C17.5 3.5 19 4 19 5C19 6.5 17 9 15 10"
        fill={SKIN_SHADOW}
        opacity="0.3"
      />

      {/* Definição muscular - linhas internas */}
      <path
        d="M8 12C9 11 11 10 13 10"
        stroke={SKIN_SHADOW}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M6 15C7 14 9 13 11 13"
        stroke={SKIN_SHADOW}
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* Punho fechado */}
      <ellipse cx="17" cy="18" rx="2.5" ry="2" fill={SKIN_TONE} />
      <ellipse cx="17" cy="18" rx="2.5" ry="2" fill={SKIN_DARK} opacity="0.3" />
      <path
        d="M15.5 17.5L18.5 17.5"
        stroke={SKIN_SHADOW}
        strokeWidth="1"
        strokeLinecap="round"
      />
      <path
        d="M15.5 18.5L18.5 18.5"
        stroke={SKIN_SHADOW}
        strokeWidth="1"
        strokeLinecap="round"
      />

      {/* Brilho no bíceps */}
      <path
        d="M14 6C15 5.5 16 5.5 17 6"
        stroke="white"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.4"
      />
    </svg>
  );
}
