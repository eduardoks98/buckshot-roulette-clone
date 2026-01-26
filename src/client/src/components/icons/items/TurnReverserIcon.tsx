import { IconProps, getIconSize, DEFAULT_ICON_COLOR } from '../Icon';

export function TurnReverserIcon({ size, color = DEFAULT_ICON_COLOR, className, style, title }: IconProps) {
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
      {/* Seta de retorno */}
      <path
        d="M19 12a7 7 0 01-7 7H9"
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M5 12a7 7 0 017-7h3"
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Ponta da seta esquerda */}
      <polygon points="9 15 9 21 5 18" fill={color} />
      {/* Ponta da seta direita */}
      <polygon points="15 9 15 3 19 6" fill={color} />
    </svg>
  );
}
