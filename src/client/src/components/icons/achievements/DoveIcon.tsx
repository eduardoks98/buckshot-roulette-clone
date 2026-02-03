import { IconProps, getIconSize } from '../Icon';

// Cores fixas do emoji de pomba 🕊️
const DOVE_WHITE = '#FFFFFF';
const DOVE_GRAY = '#E0E0E0';
const BEAK_ORANGE = '#FFA726';
const OLIVE_GREEN = '#8BC34A';
const OLIVE_DARK = '#689F38';

export function DoveIcon({ size, className, style, title }: IconProps) {
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
        d="M8 20C6 19 4 17 4 14C4 11 6 9 9 9C9 9 9 6 12 5C15 4 17 6 17 8C17 10 16 11 15 12L19 11C21 11 22 13 21 15C20 17 17 18 14 18L10 20L8 20Z"
        fill="#1a1a1a"
        opacity="0.2"
      />

      {/* Corpo da pomba - branco */}
      <path
        d="M8 19C6 18 4 16 4 13C4 10 6 8 9 8C9 8 9 5 12 4C15 3 17 5 17 7C17 9 16 10 15 11L19 10C21 10 22 12 21 14C20 16 17 17 14 17L10 19L8 19Z"
        fill={DOVE_WHITE}
      />

      {/* Asa - camadas */}
      <path
        d="M7 12C7 12 5 13 4 15L6 14L5 16L7 15L6 17L8 15C9 14 10 13 10 12"
        fill={DOVE_WHITE}
      />
      <path
        d="M6 13L7 15"
        stroke={DOVE_GRAY}
        strokeWidth="1"
        strokeLinecap="round"
      />
      <path
        d="M7 12L8 14"
        stroke={DOVE_GRAY}
        strokeWidth="1"
        strokeLinecap="round"
      />

      {/* Cabeça */}
      <circle cx="15" cy="7" r="3" fill={DOVE_WHITE} />

      {/* Olho */}
      <circle cx="16" cy="6.5" r="1" fill="#1a1a1a" />
      <circle cx="16.3" cy="6.2" r="0.3" fill="white" />

      {/* Bico - laranja */}
      <path
        d="M18 7L21 6L18 8Z"
        fill={BEAK_ORANGE}
      />

      {/* Cauda */}
      <path
        d="M8 19L6 22L9 20L7 23L10 20"
        fill={DOVE_WHITE}
      />
      <path
        d="M7 21L8 20"
        stroke={DOVE_GRAY}
        strokeWidth="0.8"
        strokeLinecap="round"
      />

      {/* Brilho no corpo */}
      <path
        d="M11 10C12 9 14 9 15 10"
        stroke="white"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.3"
      />

      {/* Ramo de oliveira - verde */}
      <path
        d="M19 11L21 13L20 12L22 14"
        stroke={OLIVE_DARK}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <ellipse cx="21.5" cy="12" rx="1" ry="0.5" fill={OLIVE_GREEN} transform="rotate(-30 21.5 12)" />
      <ellipse cx="21" cy="13.5" rx="1" ry="0.5" fill={OLIVE_GREEN} transform="rotate(30 21 13.5)" />
    </svg>
  );
}
