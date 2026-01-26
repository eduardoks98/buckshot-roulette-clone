import { IconProps, getIconSize, DEFAULT_ICON_COLOR } from '../Icon';

export function CameraIcon({ size, color = DEFAULT_ICON_COLOR, className, style, title }: IconProps) {
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
      {/* Corpo da camera */}
      <rect x="2" y="7" width="20" height="13" rx="2" fill={color} opacity="0.9" />
      {/* Topo */}
      <path d="M7 7V5a1 1 0 011-1h8a1 1 0 011 1v2" fill={color} />
      {/* Lente */}
      <circle cx="12" cy="13" r="4" fill="none" stroke="black" strokeWidth="2" opacity="0.4" />
      <circle cx="12" cy="13" r="2" fill="black" opacity="0.3" />
      {/* Flash */}
      <rect x="17" y="9" width="3" height="2" rx="0.5" fill="black" opacity="0.3" />
    </svg>
  );
}
