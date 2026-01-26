import { IconProps, getIconSize, DEFAULT_ICON_COLOR } from '../Icon';

export function TrophyIcon({ size, color = DEFAULT_ICON_COLOR, className, style, title }: IconProps) {
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
      {/* Copa */}
      <path
        d="M6 4h12v6a6 6 0 01-12 0V4z"
        fill={color}
        opacity="0.9"
      />
      {/* Alca esquerda */}
      <path
        d="M6 6H4a2 2 0 00-2 2v1a3 3 0 003 3h1"
        fill="none"
        stroke={color}
        strokeWidth="2"
      />
      {/* Alca direita */}
      <path
        d="M18 6h2a2 2 0 012 2v1a3 3 0 01-3 3h-1"
        fill="none"
        stroke={color}
        strokeWidth="2"
      />
      {/* Haste */}
      <rect x="10" y="16" width="4" height="3" fill={color} />
      {/* Base */}
      <rect x="7" y="19" width="10" height="2" rx="1" fill={color} />
      {/* Brilho */}
      <ellipse cx="9" cy="8" rx="1.5" ry="2" fill="white" opacity="0.2" />
    </svg>
  );
}
