import { IconProps, getIconSize, DEFAULT_ICON_COLOR } from '../Icon';

export function LockIcon({ size, color = DEFAULT_ICON_COLOR, className, style, title }: IconProps) {
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
      {/* Corpo do cadeado */}
      <rect x="5" y="11" width="14" height="10" rx="2" fill={color} />
      {/* Argola */}
      <path
        d="M8 11V7a4 4 0 018 0v4"
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Buraco da fechadura */}
      <circle cx="12" cy="15" r="1.5" fill="black" opacity="0.4" />
      <rect x="11.25" y="15" width="1.5" height="3" rx="0.5" fill="black" opacity="0.4" />
    </svg>
  );
}
