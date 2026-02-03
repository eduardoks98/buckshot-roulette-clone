import { IconProps, getIconSize, DEFAULT_ICON_COLOR } from '../Icon';

export function CloverIcon({ size, color = DEFAULT_ICON_COLOR, className, style, title }: IconProps) {
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

      {/* Folha superior */}
      <path
        d="M12 2C9 2 8 4 8 6C8 8 10 10 12 10C14 10 16 8 16 6C16 4 15 2 12 2Z"
        fill={color}
      />
      <path
        d="M12 4C10.5 4 10 5 10 6C10 7 11 8 12 8"
        stroke="#1a1a1a"
        strokeWidth="1"
        strokeLinecap="round"
      />

      {/* Folha esquerda */}
      <path
        d="M2 10C2 7 4 6 6 6C8 6 10 8 10 10C10 12 8 14 6 14C4 14 2 13 2 10Z"
        fill={color}
      />
      <path
        d="M4 10C4 8.5 5 8 6 8C7 8 8 9 8 10"
        stroke="#1a1a1a"
        strokeWidth="1"
        strokeLinecap="round"
      />

      {/* Folha direita */}
      <path
        d="M22 10C22 7 20 6 18 6C16 6 14 8 14 10C14 12 16 14 18 14C20 14 22 13 22 10Z"
        fill={color}
      />
      <path
        d="M20 10C20 8.5 19 8 18 8C17 8 16 9 16 10"
        stroke="#1a1a1a"
        strokeWidth="1"
        strokeLinecap="round"
      />

      {/* Folha inferior */}
      <path
        d="M12 12C9 12 8 14 8 16C8 18 10 19 12 19C14 19 16 18 16 16C16 14 15 12 12 12Z"
        fill={color}
      />
      <path
        d="M12 14C10.5 14 10 15 10 16C10 17 11 17.5 12 17.5"
        stroke="#1a1a1a"
        strokeWidth="1"
        strokeLinecap="round"
      />

      {/* Centro do trevo */}
      <circle cx="12" cy="10" r="2.5" fill={color} />
      <circle cx="12" cy="10" r="1.5" fill="#1a1a1a" />

      {/* Caule */}
      <path
        d="M12 19V22"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
      />

      {/* Brilhos nas folhas */}
      <circle cx="10" cy="5" r="0.8" fill="white" opacity="0.25" />
      <circle cx="5" cy="9" r="0.8" fill="white" opacity="0.25" />
      <circle cx="19" cy="9" r="0.8" fill="white" opacity="0.25" />
      <circle cx="10" cy="15" r="0.8" fill="white" opacity="0.25" />
    </svg>
  );
}
