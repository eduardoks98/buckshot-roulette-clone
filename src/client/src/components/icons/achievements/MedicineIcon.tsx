import { IconProps, getIconSize } from '../Icon';

// Cores fixas do emoji de remédio 💊
const CAPSULE_WHITE = '#F5F5F5';
const CAPSULE_PINK = '#E91E63';
const CAPSULE_DARK_PINK = '#C2185B';
const CAPSULE_RED = '#E53935';

export function MedicineIcon({ size, className, style, title }: IconProps) {
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
        d="M8 5C8 3.5 9.5 2 12 2C14.5 2 16 3.5 16 5V13H8V5Z"
        fill="#1a1a1a"
        opacity="0.2"
      />

      {/* Cápsula - metade superior (rosa/vermelho) */}
      <path
        d="M8 4C8 2.5 9.5 1 12 1C14.5 1 16 2.5 16 4V12H8V4Z"
        fill={CAPSULE_PINK}
      />

      {/* Interior da metade superior */}
      <path
        d="M9.5 4C9.5 3 10.5 2 12 2C13.5 2 14.5 3 14.5 4V11H9.5V4Z"
        fill={CAPSULE_DARK_PINK}
        opacity="0.3"
      />

      {/* Cápsula - metade inferior (branco) */}
      <path
        d="M8 12H16V20C16 21.5 14.5 23 12 23C9.5 23 8 21.5 8 20V12Z"
        fill={CAPSULE_WHITE}
      />

      {/* Interior da metade inferior */}
      <path
        d="M9.5 13H14.5V20C14.5 21 13.5 22 12 22C10.5 22 9.5 21 9.5 20V13Z"
        fill="#DDDDDD"
        opacity="0.4"
      />

      {/* Linha divisória */}
      <rect x="8" y="11" width="8" height="2" fill={CAPSULE_RED} />
      <rect x="8.5" y="11.5" width="7" height="1" fill="#1a1a1a" opacity="0.2" />

      {/* Cruz médica na parte superior (branca) */}
      <rect x="11" y="4" width="2" height="5" fill={CAPSULE_WHITE} opacity="0.8" />
      <rect x="9.5" y="5.5" width="5" height="2" fill={CAPSULE_WHITE} opacity="0.8" />

      {/* Brilhos */}
      <ellipse cx="10" cy="5" rx="1" ry="1.5" fill="white" opacity="0.4" />
      <ellipse cx="10" cy="16" rx="0.8" ry="1.2" fill="white" opacity="0.3" />
    </svg>
  );
}
