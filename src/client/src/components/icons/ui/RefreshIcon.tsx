import { IconProps, getIconSize, DEFAULT_ICON_COLOR } from '../Icon';

export function RefreshIcon({ size, color = DEFAULT_ICON_COLOR, className, style, title }: IconProps) {
  const s = getIconSize(size);
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      className={className}
      style={style}
      aria-hidden={!title}
      role={title ? 'img' : undefined}
    >
      {title && <title>{title}</title>}
      <path d="M21 12a9 9 0 11-3-6.7" />
      <polyline points="21 3 21 9 15 9" fill={color} stroke={color} />
    </svg>
  );
}
