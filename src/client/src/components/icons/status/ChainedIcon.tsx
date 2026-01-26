import { IconProps, getIconSize, DEFAULT_ICON_COLOR } from '../Icon';

export function ChainedIcon({ size, color = DEFAULT_ICON_COLOR, className, style, title }: IconProps) {
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
      {/* Elo 1 */}
      <rect x="3" y="8" width="8" height="8" rx="2" fill="none" stroke={color} strokeWidth="2.5" />
      {/* Elo 2 */}
      <rect x="13" y="8" width="8" height="8" rx="2" fill="none" stroke={color} strokeWidth="2.5" />
      {/* Conexao */}
      <rect x="9" y="10" width="6" height="4" rx="1" fill={color} opacity="0.5" />
    </svg>
  );
}
