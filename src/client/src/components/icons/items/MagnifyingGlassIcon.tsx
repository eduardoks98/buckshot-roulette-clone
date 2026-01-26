import { IconProps, getIconSize, DEFAULT_ICON_COLOR } from '../Icon';

export function MagnifyingGlassIcon({ size, color = DEFAULT_ICON_COLOR, className, style, title }: IconProps) {
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
      <circle cx="10" cy="10" r="6" fill="none" stroke={color} strokeWidth="2.5" />
      <line x1="14.5" y1="14.5" x2="20" y2="20" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="10" cy="10" r="2" fill={color} opacity="0.3" />
    </svg>
  );
}
