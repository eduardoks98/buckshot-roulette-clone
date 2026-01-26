import { IconProps, getIconSize, DEFAULT_ICON_COLOR } from '../Icon';

export function CigaretteIcon({ size, color = DEFAULT_ICON_COLOR, className, style, title }: IconProps) {
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

      {/* Cigarro - corpo principal (branco/claro) */}
      <rect
        x="2"
        y="14"
        width="14"
        height="4"
        rx="1"
        fill={color}
      />

      {/* Filtro - parte mais escura */}
      <rect
        x="16"
        y="14"
        width="6"
        height="4"
        rx="1"
        fill="#1a1a1a"
      />
      <rect
        x="16"
        y="14"
        width="6"
        height="4"
        rx="1"
        fill={color}
        opacity="0.4"
      />

      {/* Ponta acesa - brasa vermelha */}
      <rect
        x="0"
        y="14"
        width="3"
        height="4"
        rx="1"
        fill="#ef4444"
      />

      {/* Fumaca - curvas grossas visiveis */}
      <path
        d="M3 12 Q5 10, 3 7 Q1 4, 3 1"
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M7 11 Q9 8, 7 5 Q5 2, 7 0"
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
