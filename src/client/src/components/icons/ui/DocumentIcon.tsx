import { IconProps, getIconSize, DEFAULT_ICON_COLOR } from '../Icon';

export function DocumentIcon({ size, color = DEFAULT_ICON_COLOR, className, style, title }: IconProps) {
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
      {/* Documento */}
      <path
        d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"
        fill={color}
        opacity="0.9"
      />
      {/* Dobra */}
      <path d="M14 2v6h6" fill="none" stroke={color} strokeWidth="1" opacity="0.5" />
      {/* Linhas de texto */}
      <line x1="8" y1="13" x2="16" y2="13" stroke="black" strokeWidth="1" opacity="0.3" />
      <line x1="8" y1="16" x2="14" y2="16" stroke="black" strokeWidth="1" opacity="0.3" />
    </svg>
  );
}
