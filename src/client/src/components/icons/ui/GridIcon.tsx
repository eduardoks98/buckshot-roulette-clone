import { IconProps, getIconSize, DEFAULT_ICON_COLOR } from '../Icon';

export function GridIcon({ size, color = DEFAULT_ICON_COLOR, className, style, title }: IconProps) {
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
      <rect x="3" y="3" width="7" height="7" rx="1" fill={color} />
      <rect x="14" y="3" width="7" height="7" rx="1" fill={color} />
      <rect x="3" y="14" width="7" height="7" rx="1" fill={color} />
      <rect x="14" y="14" width="7" height="7" rx="1" fill={color} />
    </svg>
  );
}
