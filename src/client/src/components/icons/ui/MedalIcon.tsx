import { IconProps, getIconSize, DEFAULT_ICON_COLOR } from '../Icon';

export function MedalIcon({ size, color = DEFAULT_ICON_COLOR, className, style, title }: IconProps) {
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
      {/* Fita */}
      <path d="M8 2l4 6 4-6H8z" fill={color} opacity="0.7" />
      <path d="M9 2l3 5 3-5" fill="none" stroke={color} strokeWidth="1" opacity="0.5" />
      {/* Medalha */}
      <circle cx="12" cy="15" r="6" fill={color} />
      {/* Borda interna */}
      <circle cx="12" cy="15" r="4" fill="none" stroke="black" strokeWidth="1" opacity="0.2" />
      {/* Estrela central */}
      <polygon
        points="12 11 13 13.5 15.5 13.5 13.5 15 14 17.5 12 16 10 17.5 10.5 15 8.5 13.5 11 13.5"
        fill="black"
        opacity="0.3"
      />
    </svg>
  );
}
