import { IconProps, getIconSize, DEFAULT_ICON_COLOR } from '../Icon';

export function AdrenalineIcon({ size, color = DEFAULT_ICON_COLOR, className, style, title }: IconProps) {
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

      {/* Seringa - corpo principal */}
      <rect x="4" y="9" width="14" height="6" rx="1" fill={color} />

      {/* Liquido dentro - verde/amarelo */}
      <rect x="5" y="10" width="10" height="4" fill="#1a1a1a" />

      {/* Embolo */}
      <rect x="18" y="10" width="4" height="4" rx="0.5" fill={color} />

      {/* Agulha */}
      <path d="M4 12 L0 12" stroke={color} strokeWidth="2" strokeLinecap="round" />

      {/* Abas para segurar */}
      <rect x="14" y="7" width="2" height="2" fill={color} />
      <rect x="14" y="15" width="2" height="2" fill={color} />

      {/* Marcacoes de medida */}
      <line x1="7" y1="9" x2="7" y2="7" stroke={color} strokeWidth="1.5" />
      <line x1="10" y1="9" x2="10" y2="7" stroke={color} strokeWidth="1.5" />
      <line x1="13" y1="9" x2="13" y2="7" stroke={color} strokeWidth="1.5" />
    </svg>
  );
}
