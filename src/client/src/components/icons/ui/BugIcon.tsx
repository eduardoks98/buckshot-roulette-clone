import { IconProps, getIconSize, DEFAULT_ICON_COLOR } from '../Icon';

export function BugIcon({ size, color = DEFAULT_ICON_COLOR, className, style, title }: IconProps) {
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
      {/* Corpo */}
      <ellipse cx="12" cy="14" rx="5" ry="6" fill={color} opacity="0.9" />
      {/* Cabeca */}
      <circle cx="12" cy="7" r="3" fill={color} />
      {/* Antenas */}
      <path d="M10 5L8 2" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M14 5L16 2" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      {/* Pernas esquerdas */}
      <path d="M7 12L3 10" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M7 15L3 16" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M8 18L5 21" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      {/* Pernas direitas */}
      <path d="M17 12L21 10" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M17 15L21 16" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M16 18L19 21" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      {/* Olhos */}
      <circle cx="10.5" cy="6.5" r="0.8" fill="black" opacity="0.5" />
      <circle cx="13.5" cy="6.5" r="0.8" fill="black" opacity="0.5" />
    </svg>
  );
}
