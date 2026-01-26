import { IconProps, getIconSize, DEFAULT_ICON_COLOR } from '../Icon';

export function ChartIcon({ size, color = DEFAULT_ICON_COLOR, className, style, title }: IconProps) {
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
      {/* Barras */}
      <rect x="4" y="14" width="4" height="6" rx="0.5" fill={color} opacity="0.7" />
      <rect x="10" y="10" width="4" height="10" rx="0.5" fill={color} opacity="0.85" />
      <rect x="16" y="6" width="4" height="14" rx="0.5" fill={color} />
      {/* Linha de base */}
      <line x1="2" y1="20" x2="22" y2="20" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
