import { IconProps, getIconSize, DEFAULT_ICON_COLOR } from '../Icon';

export function TargetIcon({ size, color = DEFAULT_ICON_COLOR, className, style, title }: IconProps) {
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
      <circle cx="12" cy="12" r="9" fill="none" stroke={color} strokeWidth="2" />
      <circle cx="12" cy="12" r="5" fill="none" stroke={color} strokeWidth="2" />
      <circle cx="12" cy="12" r="2" fill={color} />
      <line x1="12" y1="2" x2="12" y2="5" stroke={color} strokeWidth="2" />
      <line x1="12" y1="19" x2="12" y2="22" stroke={color} strokeWidth="2" />
      <line x1="2" y1="12" x2="5" y2="12" stroke={color} strokeWidth="2" />
      <line x1="19" y1="12" x2="22" y2="12" stroke={color} strokeWidth="2" />
    </svg>
  );
}
