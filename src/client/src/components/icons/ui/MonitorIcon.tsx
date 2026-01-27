import { IconProps, getIconSize, DEFAULT_ICON_COLOR } from '../Icon';

export function MonitorIcon({ size, color = DEFAULT_ICON_COLOR, className, style, title }: IconProps) {
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
      {/* Tela */}
      <rect x="2" y="3" width="20" height="14" rx="2" fill={color} opacity="0.9" />
      {/* Tela interna */}
      <rect x="4" y="5" width="16" height="10" rx="1" fill="black" opacity="0.3" />
      {/* Base */}
      <path d="M8 19h8" stroke={color} strokeWidth="2" strokeLinecap="round" />
      {/* Suporte */}
      <path d="M12 17v2" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
