import { IconProps, getIconSize, DEFAULT_ICON_COLOR } from '../Icon';

export function CigaretteIcon({ size, color = DEFAULT_ICON_COLOR, className, style, title }: IconProps) {
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
      {/* Cigarro */}
      <rect x="4" y="14" width="14" height="4" rx="1" fill={color} opacity="0.9" />
      {/* Filtro */}
      <rect x="14" y="14" width="4" height="4" rx="0.5" fill={color} opacity="0.6" />
      {/* Ponta acesa */}
      <rect x="2" y="14" width="2" height="4" rx="0.5" fill="#ef4444" />
      {/* Fumaca */}
      <path
        d="M3 12c0-2 1.5-2 1.5-4s-1-2-1-4"
        fill="none"
        stroke={color}
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.5"
      />
      <path
        d="M6 11c0-1.5 1-1.5 1-3s-0.8-1.5-0.8-3"
        fill="none"
        stroke={color}
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.4"
      />
    </svg>
  );
}
