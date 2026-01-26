// Award Icon: Passive (Dove/Peace)
import { IconProps, getIconSize, DEFAULT_ICON_COLOR } from '../Icon';

export function PassiveIcon({ size, color = DEFAULT_ICON_COLOR, className, style, title }: IconProps) {
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
      {/* Dove body */}
      <path
        d="M12 4C8.5 4 6 7 6 10C6 12 7 14 9 15L7 20H10L11 17H13L14 20H17L15 15C17 14 18 12 18 10C18 7 15.5 4 12 4Z"
        fill={color}
        opacity="0.9"
      />
      {/* Wing */}
      <path
        d="M8 9C6 8 4 8 2 9C4 10 6 11 8 11"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      {/* Eye */}
      <circle cx="14" cy="8" r="1.5" fill="#1a1a1a" />
    </svg>
  );
}
