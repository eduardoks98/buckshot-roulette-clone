import { IconProps, getIconSize, DEFAULT_ICON_COLOR } from '../Icon';

export function MedicineIcon({ size, color = DEFAULT_ICON_COLOR, className, style, title }: IconProps) {
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

      {/* Capsula - rotacionada */}
      <g transform="rotate(-45 12 12)">
        {/* Metade esquerda - clara */}
        <path
          d="M4 12 Q4 7, 8 7 L12 7 L12 17 L8 17 Q4 17, 4 12 Z"
          fill={color}
        />

        {/* Metade direita - escura (vencida) */}
        <path
          d="M20 12 Q20 7, 16 7 L12 7 L12 17 L16 17 Q20 17, 20 12 Z"
          fill="#1a1a1a"
        />
        <path
          d="M20 12 Q20 7, 16 7 L12 7 L12 17 L16 17 Q20 17, 20 12 Z"
          fill={color}
          opacity="0.4"
        />

        {/* Linha divisoria */}
        <line x1="12" y1="6" x2="12" y2="18" stroke={color} strokeWidth="1" />
      </g>

      {/* X de alerta - visivel */}
      <g transform="translate(17, 17)">
        <circle cx="0" cy="0" r="4" fill={color} />
        <line x1="-2" y1="-2" x2="2" y2="2" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" />
        <line x1="2" y1="-2" x2="-2" y2="2" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" />
      </g>
    </svg>
  );
}
