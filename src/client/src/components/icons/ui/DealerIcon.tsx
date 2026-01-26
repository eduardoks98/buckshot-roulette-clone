import { IconProps, getIconSize, DEFAULT_ICON_COLOR } from '../Icon';

export function DealerIcon({ size, color = DEFAULT_ICON_COLOR, className, style, title }: IconProps) {
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
      {/* Cabeca do robo */}
      <rect x="6" y="4" width="12" height="10" rx="2" fill={color} opacity="0.9" />
      {/* Antena */}
      <line x1="12" y1="4" x2="12" y2="1" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="1" r="1" fill={color} />
      {/* Olhos */}
      <circle cx="9" cy="9" r="1.5" fill="black" opacity="0.7" />
      <circle cx="15" cy="9" r="1.5" fill="black" opacity="0.7" />
      {/* Brilho dos olhos */}
      <circle cx="9.5" cy="8.5" r="0.5" fill="white" opacity="0.5" />
      <circle cx="15.5" cy="8.5" r="0.5" fill="white" opacity="0.5" />
      {/* Boca */}
      <rect x="9" y="11" width="6" height="1.5" rx="0.5" fill="black" opacity="0.5" />
      {/* Corpo */}
      <rect x="7" y="15" width="10" height="6" rx="1" fill={color} opacity="0.8" />
      {/* Detalhe do corpo */}
      <rect x="10" y="16" width="4" height="2" rx="0.5" fill="black" opacity="0.3" />
      {/* Parafusos */}
      <circle cx="8" cy="6" r="0.8" fill="black" opacity="0.4" />
      <circle cx="16" cy="6" r="0.8" fill="black" opacity="0.4" />
    </svg>
  );
}
