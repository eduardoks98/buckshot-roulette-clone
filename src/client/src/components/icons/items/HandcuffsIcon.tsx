import { IconProps, getIconSize, DEFAULT_ICON_COLOR } from '../Icon';

export function HandcuffsIcon({ size, color = DEFAULT_ICON_COLOR, className, style, title }: IconProps) {
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
      {/* Algema esquerda */}
      <circle cx="7" cy="12" r="4" fill="none" stroke={color} strokeWidth="2.5" />
      <rect x="5" y="15" width="4" height="3" rx="0.5" fill={color} />
      {/* Algema direita */}
      <circle cx="17" cy="12" r="4" fill="none" stroke={color} strokeWidth="2.5" />
      <rect x="15" y="15" width="4" height="3" rx="0.5" fill={color} />
      {/* Corrente */}
      <path
        d="M11 12h2"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Buraco da fechadura */}
      <circle cx="7" cy="12" r="1" fill={color} opacity="0.5" />
      <circle cx="17" cy="12" r="1" fill={color} opacity="0.5" />
    </svg>
  );
}
