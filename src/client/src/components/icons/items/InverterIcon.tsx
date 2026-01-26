import { IconProps, getIconSize, DEFAULT_ICON_COLOR } from '../Icon';

export function InverterIcon({ size, color = DEFAULT_ICON_COLOR, className, style, title }: IconProps) {
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

      {/* Seta superior - sentido horario */}
      <path
        d="M12 2 A10 10 0 0 1 22 12"
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
      />

      {/* Ponta da seta superior */}
      <polygon points="22 8 22 14 18 11" fill={color} />

      {/* Seta inferior - sentido anti-horario */}
      <path
        d="M12 22 A10 10 0 0 1 2 12"
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
      />

      {/* Ponta da seta inferior */}
      <polygon points="2 16 2 10 6 13" fill={color} />

      {/* Centro - circulo */}
      <circle cx="12" cy="12" r="3" fill={color} />
      <circle cx="12" cy="12" r="1.5" fill="#1a1a1a" />
    </svg>
  );
}
