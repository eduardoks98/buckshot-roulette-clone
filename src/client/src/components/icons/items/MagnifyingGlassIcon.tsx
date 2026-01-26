import { IconProps, getIconSize, DEFAULT_ICON_COLOR } from '../Icon';

export function MagnifyingGlassIcon({ size, color = DEFAULT_ICON_COLOR, className, style, title }: IconProps) {
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

      {/* Aro da lupa - grosso e visivel */}
      <circle cx="10" cy="10" r="7" fill="none" stroke={color} strokeWidth="3" />

      {/* Lente - area escura central */}
      <circle cx="10" cy="10" r="4.5" fill="#1a1a1a" />

      {/* Brilho na lente */}
      <circle cx="8" cy="8" r="1.5" fill={color} />

      {/* Cabo da lupa */}
      <line
        x1="15"
        y1="15"
        x2="22"
        y2="22"
        stroke={color}
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}
