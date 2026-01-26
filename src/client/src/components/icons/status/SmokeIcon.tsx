import { IconProps, getIconSize } from '../Icon';

export function SmokeIcon({ size, color = '#6b7280', className, style, title }: IconProps) {
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
      {/* Nuvens de fumaca */}
      <circle cx="8" cy="16" r="4" fill={color} opacity="0.7" />
      <circle cx="14" cy="14" r="5" fill={color} opacity="0.8" />
      <circle cx="10" cy="10" r="4" fill={color} opacity="0.6" />
      <circle cx="16" cy="8" r="3" fill={color} opacity="0.5" />
      <circle cx="12" cy="6" r="2.5" fill={color} opacity="0.4" />
      {/* Linhas de movimento */}
      <path
        d="M6 18c0-2 1-3 1-5"
        fill="none"
        stroke={color}
        strokeWidth="1"
        opacity="0.3"
        strokeLinecap="round"
      />
      <path
        d="M18 12c0-2-1-3-1-5"
        fill="none"
        stroke={color}
        strokeWidth="1"
        opacity="0.3"
        strokeLinecap="round"
      />
    </svg>
  );
}
