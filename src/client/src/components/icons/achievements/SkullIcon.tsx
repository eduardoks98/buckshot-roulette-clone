import { IconProps, getIconSize } from '../Icon';

// Cores fixas do emoji de caveira 💀
const SKULL_WHITE = '#F5F5F5';
const SKULL_BONE = '#E8E8E8';
const SKULL_SHADOW = '#D0D0D0';

export function SkullIcon({ size, className, style, title }: IconProps) {
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
      <ellipse cx="12" cy="11" rx="9" ry="8" fill="#1a1a1a" opacity="0.3" />

      {/* Crânio - forma principal */}
      <ellipse cx="12" cy="10" rx="9" ry="8" fill={SKULL_WHITE} />

      {/* Sombra no crânio */}
      <ellipse cx="12" cy="12" rx="8" ry="6" fill={SKULL_SHADOW} opacity="0.3" />

      {/* Mandíbula */}
      <path
        d="M5 14V18C5 19 6 20 7 20H9V18H11V20H13V18H15V20H17C18 20 19 19 19 18V14"
        fill={SKULL_BONE}
      />

      {/* Olho esquerdo - buraco escuro */}
      <ellipse cx="8" cy="10" rx="2.5" ry="3" fill="#1a1a1a" />

      {/* Olho direito - buraco escuro */}
      <ellipse cx="16" cy="10" rx="2.5" ry="3" fill="#1a1a1a" />

      {/* Brilho nos olhos */}
      <ellipse cx="7.5" cy="9" rx="0.8" ry="1" fill="#333" />
      <ellipse cx="15.5" cy="9" rx="0.8" ry="1" fill="#333" />

      {/* Nariz - buraco em forma de coração invertido */}
      <path d="M12 12L10.5 15H13.5L12 12Z" fill="#1a1a1a" />

      {/* Dentes */}
      <rect x="7" y="16" width="2" height="3" rx="0.3" fill={SKULL_WHITE} />
      <rect x="9.5" y="16" width="2" height="3" rx="0.3" fill={SKULL_WHITE} />
      <rect x="12.5" y="16" width="2" height="3" rx="0.3" fill={SKULL_WHITE} />
      <rect x="15" y="16" width="2" height="3" rx="0.3" fill={SKULL_WHITE} />

      {/* Linhas entre os dentes */}
      <line x1="9" y1="16" x2="9" y2="19" stroke="#1a1a1a" strokeWidth="0.8" />
      <line x1="11.5" y1="16" x2="11.5" y2="19" stroke="#1a1a1a" strokeWidth="0.8" />
      <line x1="14.5" y1="16" x2="14.5" y2="19" stroke="#1a1a1a" strokeWidth="0.8" />

      {/* Brilho no crânio */}
      <ellipse cx="8" cy="6" rx="3" ry="1.5" fill="white" opacity="0.5" />
      <ellipse cx="15" cy="7" rx="2" ry="1" fill="white" opacity="0.4" />
    </svg>
  );
}
