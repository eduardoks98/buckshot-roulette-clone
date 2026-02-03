import { IconProps, getIconSize, DEFAULT_ICON_COLOR } from '../Icon';

export function PackageIcon({ size, color = DEFAULT_ICON_COLOR, className, style, title }: IconProps) {
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

      {/* Face superior da caixa */}
      <path
        d="M12 3L21 8L12 13L3 8L12 3Z"
        fill={color}
      />

      {/* Face frontal esquerda - mais escura */}
      <path
        d="M3 8L12 13V22L3 17V8Z"
        fill={color}
        opacity="0.7"
      />

      {/* Face frontal direita */}
      <path
        d="M21 8L12 13V22L21 17V8Z"
        fill={color}
        opacity="0.85"
      />

      {/* Interior escuro - abertura da caixa */}
      <path
        d="M12 5L18 8.5L12 12L6 8.5L12 5Z"
        fill="#1a1a1a"
      />

      {/* Fita vertical */}
      <path
        d="M12 3V13"
        stroke={color}
        strokeWidth="2"
      />
      <path
        d="M12 13V22"
        stroke={color}
        strokeWidth="2"
        opacity="0.9"
      />

      {/* Fita horizontal no topo */}
      <path
        d="M6 5.5L12 3L18 5.5"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* Laço da fita */}
      <ellipse cx="10" cy="2.5" rx="2" ry="1.5" fill={color} />
      <ellipse cx="14" cy="2.5" rx="2" ry="1.5" fill={color} />
      <circle cx="12" cy="3" r="1" fill={color} />

      {/* Brilho */}
      <path
        d="M6 6L9 4.5"
        stroke="white"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.2"
      />
    </svg>
  );
}
