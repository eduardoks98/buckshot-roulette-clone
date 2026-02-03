import { IconProps, getIconSize, DEFAULT_ICON_COLOR } from '../Icon';

export function CrystalBallIcon({ size, color = DEFAULT_ICON_COLOR, className, style, title }: IconProps) {
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

      {/* Bola de cristal - forma sólida */}
      <circle cx="12" cy="10" r="8" fill={color} />

      {/* Interior escuro */}
      <circle cx="12" cy="10" r="6.5" fill="#1a1a1a" />

      {/* Névoa mística interna */}
      <ellipse cx="12" cy="11" rx="4" ry="3" fill={color} opacity="0.3" />
      <ellipse cx="11" cy="9" rx="2.5" ry="2" fill={color} opacity="0.2" />

      {/* Brilho principal */}
      <ellipse cx="9" cy="7" rx="2" ry="1.5" fill="white" opacity="0.4" />

      {/* Brilho secundário */}
      <circle cx="14" cy="6" r="0.8" fill="white" opacity="0.3" />

      {/* Estrelas místicas dentro */}
      <circle cx="10" cy="12" r="0.5" fill={color} opacity="0.8" />
      <circle cx="14" cy="10" r="0.5" fill={color} opacity="0.8" />
      <circle cx="12" cy="8" r="0.5" fill={color} opacity="0.8" />

      {/* Borda brilhante */}
      <circle
        cx="12"
        cy="10"
        r="7.5"
        fill="none"
        stroke={color}
        strokeWidth="1"
        opacity="0.5"
      />

      {/* Base - ornamentada */}
      <path
        d="M7 18H17L18 20C18 21 17 22 15 22H9C7 22 6 21 6 20L7 18Z"
        fill={color}
      />

      {/* Detalhe da base */}
      <path
        d="M8 19H16"
        stroke="#1a1a1a"
        strokeWidth="1.5"
      />
      <path
        d="M9 21H15"
        stroke="#1a1a1a"
        strokeWidth="1"
      />

      {/* Conexão bola-base */}
      <path
        d="M9 17L10 18H14L15 17"
        fill={color}
      />
      <rect x="10" y="17" width="4" height="1.5" fill={color} />
    </svg>
  );
}
