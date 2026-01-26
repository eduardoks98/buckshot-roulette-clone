import { IconProps, getIconSize, DEFAULT_ICON_COLOR } from '../Icon';

export function PerformanceIcon({ size, color = DEFAULT_ICON_COLOR, className, style, title }: IconProps) {
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
      {/* Velocimetro */}
      <path
        d="M12 2a10 10 0 00-10 10c0 3.5 1.8 6.5 4.5 8.3l1.5-2.6A7 7 0 1119 10"
        fill="none"
        stroke={color}
        strokeWidth="2"
      />
      {/* Ponteiro */}
      <path
        d="M12 12l5-8"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Centro */}
      <circle cx="12" cy="12" r="2" fill={color} />
      {/* Marcacoes */}
      <circle cx="6" cy="15" r="1" fill={color} opacity="0.5" />
      <circle cx="8" cy="9" r="1" fill={color} opacity="0.5" />
      <circle cx="12" cy="6" r="1" fill={color} opacity="0.5" />
      <circle cx="16" cy="9" r="1" fill={color} opacity="0.5" />
      <circle cx="18" cy="15" r="1" fill={color} opacity="0.5" />
    </svg>
  );
}
