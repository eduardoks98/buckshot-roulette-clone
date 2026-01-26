import { IconProps, getIconSize, DEFAULT_ICON_COLOR } from '../Icon';

export function TurnReverserIcon({ size, color = DEFAULT_ICON_COLOR, className, style, title }: IconProps) {
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

      {/* Seta em U - superior indo para direita */}
      <path
        d="M3 10 L3 5 Q3 2, 7 2 L17 2 Q21 2, 21 5 L21 10"
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Ponta da seta superior - apontando para baixo */}
      <polygon points="21 6 18 12 24 12" fill={color} />

      {/* Seta em U - inferior voltando para esquerda */}
      <path
        d="M21 14 L21 19 Q21 22, 17 22 L7 22 Q3 22, 3 19 L3 14"
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Ponta da seta inferior - apontando para cima */}
      <polygon points="3 18 0 12 6 12" fill={color} />

      {/* Simbolo central - duas pessoas trocando */}
      <circle cx="9" cy="12" r="2" fill={color} />
      <circle cx="15" cy="12" r="2" fill={color} />
      <line x1="11" y1="12" x2="13" y2="12" stroke="#1a1a1a" strokeWidth="2" />
    </svg>
  );
}
