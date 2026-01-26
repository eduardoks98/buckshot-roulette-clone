import { IconProps, getIconSize, DEFAULT_ICON_COLOR } from '../Icon';

export function PhoneIcon({ size, color = DEFAULT_ICON_COLOR, className, style, title }: IconProps) {
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

      {/* Corpo do celular */}
      <rect x="5" y="1" width="14" height="22" rx="2" fill={color} />

      {/* Tela - area escura */}
      <rect x="7" y="3" width="10" height="12" rx="1" fill="#1a1a1a" />

      {/* Antena no topo */}
      <rect x="10" y="0" width="4" height="2" rx="1" fill={color} />

      {/* Teclado numerico - grid 3x3 */}
      <rect x="7" y="16" width="3" height="2" rx="0.5" fill="#1a1a1a" />
      <rect x="10.5" y="16" width="3" height="2" rx="0.5" fill="#1a1a1a" />
      <rect x="14" y="16" width="3" height="2" rx="0.5" fill="#1a1a1a" />
      <rect x="7" y="19" width="3" height="2" rx="0.5" fill="#1a1a1a" />
      <rect x="10.5" y="19" width="3" height="2" rx="0.5" fill="#1a1a1a" />
      <rect x="14" y="19" width="3" height="2" rx="0.5" fill="#1a1a1a" />
    </svg>
  );
}
