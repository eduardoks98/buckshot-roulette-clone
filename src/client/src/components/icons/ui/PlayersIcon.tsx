import { IconProps, getIconSize, DEFAULT_ICON_COLOR } from '../Icon';

export function PlayersIcon({ size, color = DEFAULT_ICON_COLOR, className, style, title }: IconProps) {
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
      {/* Pessoa da frente */}
      <circle cx="9" cy="7" r="3.5" fill={color} />
      <path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" fill={color} opacity="0.9" />
      {/* Pessoa de tras */}
      <circle cx="17" cy="7" r="3" fill={color} opacity="0.6" />
      <path d="M17 11a4 4 0 014 4v2h-5" fill={color} opacity="0.5" />
    </svg>
  );
}
