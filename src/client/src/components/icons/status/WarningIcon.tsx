import { IconProps, getIconSize, DEFAULT_ICON_COLOR } from '../Icon';

export function WarningIcon({ size, color = DEFAULT_ICON_COLOR, className, style, title }: IconProps) {
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
      {/* Triangulo */}
      <path
        d="M12 2L2 20h20L12 2z"
        fill={color}
        opacity="0.9"
      />
      {/* Exclamacao - linha */}
      <rect x="11" y="8" width="2" height="6" rx="1" fill="#000" />
      {/* Exclamacao - ponto */}
      <circle cx="12" cy="17" r="1.2" fill="#000" />
    </svg>
  );
}
