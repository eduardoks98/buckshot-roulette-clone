import { IconProps, getIconSize, DEFAULT_ICON_COLOR } from '../Icon';

export function MedicineIcon({ size, color = DEFAULT_ICON_COLOR, className, style, title }: IconProps) {
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
      {/* Capsula - metade esquerda */}
      <path
        d="M5 12a5 5 0 0110 0"
        fill={color}
        opacity="0.9"
        transform="rotate(-45 12 12)"
      />
      {/* Capsula - metade direita */}
      <path
        d="M5 12a5 5 0 000 0h10a5 5 0 010 0"
        fill={color}
        opacity="0.6"
        transform="rotate(-45 12 12)"
      />
      {/* Forma completa da pilula */}
      <rect
        x="4"
        y="9"
        width="16"
        height="6"
        rx="3"
        fill={color}
        opacity="0.9"
        transform="rotate(-45 12 12)"
      />
      {/* Divisao */}
      <line
        x1="12"
        y1="6"
        x2="12"
        y2="18"
        stroke={color}
        strokeWidth="1"
        opacity="0.3"
        transform="rotate(-45 12 12)"
      />
      {/* Brilho */}
      <ellipse cx="9" cy="10" rx="1.5" ry="0.8" fill={color} opacity="0.3" transform="rotate(-45 12 12)" />
    </svg>
  );
}
