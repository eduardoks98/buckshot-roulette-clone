import { IconProps, getIconSize, DEFAULT_ICON_COLOR } from '../Icon';

export function AdrenalineIcon({ size, color = DEFAULT_ICON_COLOR, className, style, title }: IconProps) {
  const s = getIconSize(size);
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill={color}
      className={className}
      style={style}
      aria-hidden={!title}
      role={title ? 'img' : undefined}
    >
      {title && <title>{title}</title>}
      {/* Corpo da seringa */}
      <rect x="6" y="8" width="10" height="6" rx="1" fill={color} opacity="0.9" />
      {/* Embolo */}
      <rect x="16" y="9.5" width="5" height="3" rx="0.5" fill={color} opacity="0.7" />
      <line x1="21" y1="11" x2="22" y2="11" stroke={color} strokeWidth="2" strokeLinecap="round" />
      {/* Agulha */}
      <path d="M6 11H2" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      {/* Marcacoes */}
      <line x1="8" y1="8" x2="8" y2="6" stroke={color} strokeWidth="1" />
      <line x1="10" y1="8" x2="10" y2="7" stroke={color} strokeWidth="1" />
      <line x1="12" y1="8" x2="12" y2="6" stroke={color} strokeWidth="1" />
      <line x1="14" y1="8" x2="14" y2="7" stroke={color} strokeWidth="1" />
      {/* Liquido */}
      <rect x="7" y="9" width="6" height="4" rx="0.5" fill={color} opacity="0.4" />
    </svg>
  );
}
