import { IconProps, getIconSize, DEFAULT_ICON_COLOR } from '../Icon';

export function BeerIcon({ size, color = DEFAULT_ICON_COLOR, className, style, title }: IconProps) {
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
      {/* Caneca */}
      <path
        d="M6 6h10v12a2 2 0 01-2 2H8a2 2 0 01-2-2V6z"
        fill={color}
        opacity="0.9"
      />
      {/* Alca */}
      <path
        d="M16 8h2a2 2 0 012 2v4a2 2 0 01-2 2h-2"
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Espuma */}
      <ellipse cx="11" cy="6" rx="6" ry="2" fill={color} />
      <circle cx="8" cy="4" r="1.5" fill={color} />
      <circle cx="11" cy="3.5" r="1.2" fill={color} />
      <circle cx="14" cy="4" r="1" fill={color} />
      {/* Bolhas */}
      <circle cx="9" cy="12" r="0.8" fill="none" stroke={color} strokeWidth="0.5" opacity="0.5" />
      <circle cx="12" cy="14" r="0.6" fill="none" stroke={color} strokeWidth="0.5" opacity="0.5" />
    </svg>
  );
}
