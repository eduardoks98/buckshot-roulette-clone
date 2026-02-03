import { IconProps, getIconSize, DEFAULT_ICON_COLOR } from '../Icon';

export function HandshakeIcon({ size, color = DEFAULT_ICON_COLOR, className, style, title }: IconProps) {
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

      {/* Braço esquerdo */}
      <path
        d="M1 10L4 8L7 9L9 8"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Braço direito */}
      <path
        d="M23 10L20 8L17 9L15 8"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Mão esquerda - sólida */}
      <path
        d="M7 9L9 8L12 10L12 13C12 14 11 15 10 15L8 14L7 12L7 9Z"
        fill={color}
      />

      {/* Mão direita - sólida */}
      <path
        d="M17 9L15 8L12 10L12 13C12 14 13 15 14 15L16 14L17 12L17 9Z"
        fill={color}
      />

      {/* Área de aperto - escura */}
      <ellipse cx="12" cy="11" rx="2.5" ry="2" fill="#1a1a1a" />

      {/* Dedos entrelaçados - detalhes */}
      <path
        d="M10 12L9 14L8 16"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M10 13L9.5 15L9 17"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M14 12L15 14L16 16"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M14 13L14.5 15L15 17"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* Polegares */}
      <ellipse cx="10" cy="9" rx="1.5" ry="1" fill={color} />
      <ellipse cx="14" cy="9" rx="1.5" ry="1" fill={color} />

      {/* Detalhe dos punhos */}
      <rect x="3" y="8" width="3" height="4" rx="1" fill={color} />
      <rect x="18" y="8" width="3" height="4" rx="1" fill={color} />
      <path d="M4 9H5.5" stroke="#1a1a1a" strokeWidth="1" />
      <path d="M18.5 9H20" stroke="#1a1a1a" strokeWidth="1" />

      {/* Brilho */}
      <path
        d="M11 9L13 9"
        stroke="white"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.2"
      />
    </svg>
  );
}
