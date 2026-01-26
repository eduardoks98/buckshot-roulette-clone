import { IconProps, getIconSize, DEFAULT_ICON_COLOR } from '../Icon';

export function PhoneIcon({ size, color = DEFAULT_ICON_COLOR, className, style, title }: IconProps) {
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
      {/* Corpo do celular */}
      <rect x="6" y="2" width="12" height="20" rx="2" fill={color} opacity="0.9" />
      {/* Tela */}
      <rect x="7.5" y="4" width="9" height="13" rx="0.5" fill="none" stroke={color} strokeWidth="0.5" opacity="0.3" />
      {/* Botao home */}
      <circle cx="12" cy="19" r="1.2" fill="none" stroke={color} strokeWidth="1" opacity="0.5" />
      {/* Camera frontal */}
      <circle cx="12" cy="3.2" r="0.5" fill={color} opacity="0.4" />
      {/* Linhas na tela */}
      <line x1="9" y1="7" x2="15" y2="7" stroke={color} strokeWidth="0.5" opacity="0.3" />
      <line x1="9" y1="9" x2="14" y2="9" stroke={color} strokeWidth="0.5" opacity="0.3" />
      <line x1="9" y1="11" x2="13" y2="11" stroke={color} strokeWidth="0.5" opacity="0.3" />
    </svg>
  );
}
