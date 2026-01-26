import { IconProps, getIconSize, DEFAULT_ICON_COLOR } from '../Icon';

export function HandcuffsIcon({ size, color = DEFAULT_ICON_COLOR, className, style, title }: IconProps) {
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

      {/* Algema esquerda - aro */}
      <circle cx="6" cy="10" r="5" fill="none" stroke={color} strokeWidth="3" />

      {/* Algema esquerda - base/trava */}
      <rect x="3" y="14" width="6" height="5" rx="1" fill={color} />
      <rect x="5" y="16" width="2" height="2" rx="0.5" fill="#1a1a1a" />

      {/* Algema direita - aro */}
      <circle cx="18" cy="10" r="5" fill="none" stroke={color} strokeWidth="3" />

      {/* Algema direita - base/trava */}
      <rect x="15" y="14" width="6" height="5" rx="1" fill={color} />
      <rect x="17" y="16" width="2" height="2" rx="0.5" fill="#1a1a1a" />

      {/* Corrente central - elos */}
      <ellipse cx="12" cy="12" rx="2" ry="3" fill="none" stroke={color} strokeWidth="2" />
    </svg>
  );
}
