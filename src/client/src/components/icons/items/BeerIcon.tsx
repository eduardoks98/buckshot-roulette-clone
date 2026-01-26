import { IconProps, getIconSize, DEFAULT_ICON_COLOR } from '../Icon';

export function BeerIcon({ size, color = DEFAULT_ICON_COLOR, className, style, title }: IconProps) {
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

      {/* Corpo da caneca */}
      <path
        d="M4 6h12v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6z"
        fill={color}
      />

      {/* Cerveja dentro - area escura */}
      <rect x="5" y="8" width="10" height="11" fill="#1a1a1a" />

      {/* Espuma no topo - bolhas grandes */}
      <circle cx="6" cy="5" r="2.5" fill={color} />
      <circle cx="10" cy="4" r="3" fill={color} />
      <circle cx="14" cy="5" r="2.5" fill={color} />
      <circle cx="8" cy="3" r="2" fill={color} />
      <circle cx="12" cy="3" r="2" fill={color} />

      {/* Alca da caneca */}
      <path
        d="M16 8h2a3 3 0 013 3v2a3 3 0 01-3 3h-2"
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
