import { IconProps, getIconSize, DEFAULT_ICON_COLOR } from '../Icon';

export function CrownIcon({ size, color = DEFAULT_ICON_COLOR, className, style, title }: IconProps) {
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
      {/* Corpo da coroa */}
      <path
        d="M2 8l4 10h12l4-10-5 4-5-7-5 7-5-4z"
        fill={color}
        opacity="0.9"
      />
      {/* Base */}
      <rect x="5" y="18" width="14" height="2" rx="0.5" fill={color} />
      {/* Joias */}
      <circle cx="12" cy="5" r="1.5" fill={color} />
      <circle cx="6" cy="12" r="1" fill={color} opacity="0.7" />
      <circle cx="18" cy="12" r="1" fill={color} opacity="0.7" />
      <circle cx="12" cy="14" r="1" fill={color} opacity="0.5" />
    </svg>
  );
}
