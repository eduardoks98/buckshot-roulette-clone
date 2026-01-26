// Award Icon: Most Damage (Explosion/Impact)
import { IconProps, getIconSize, DEFAULT_ICON_COLOR } from '../Icon';

export function MostDamageIcon({ size, color = DEFAULT_ICON_COLOR, className, style, title }: IconProps) {
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
      {/* Explosion burst */}
      <path
        d="M12 2L14 8L20 6L16 11L22 12L16 14L18 20L12 16L6 20L8 14L2 12L8 11L4 6L10 8L12 2Z"
        fill={color}
        opacity="0.9"
      />
      {/* Center impact */}
      <circle cx="12" cy="12" r="3" fill="#1a1a1a" />
    </svg>
  );
}
