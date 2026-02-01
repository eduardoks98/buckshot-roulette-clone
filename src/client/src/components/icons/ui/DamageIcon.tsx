import { IconProps, getIconSize, DEFAULT_ICON_COLOR } from '../Icon';

export function DamageIcon({ size, color = DEFAULT_ICON_COLOR, className, style, title }: IconProps) {
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
      {/* Explosion/damage burst */}
      <path
        d="M12 2l2 6 6-2-4 5 4 5-6-2-2 6-2-6-6 2 4-5-4-5 6 2 2-6z"
        fill={color}
        opacity="0.15"
      />
      <path
        d="M12 2l2 6 6-2-4 5 4 5-6-2-2 6-2-6-6 2 4-5-4-5 6 2 2-6z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Center circle */}
      <circle cx="12" cy="12" r="3" fill={color} opacity="0.3" />
    </svg>
  );
}
