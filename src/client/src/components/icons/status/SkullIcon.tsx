import { IconProps, getIconSize, DEFAULT_ICON_COLOR } from '../Icon';

export function SkullIcon({ size, color = DEFAULT_ICON_COLOR, className, style, title }: IconProps) {
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
      {/* Cranio */}
      <ellipse cx="12" cy="10" rx="8" ry="7" fill={color} opacity="0.9" />
      {/* Mandibula */}
      <path
        d="M7 15v4a1 1 0 001 1h2v-2h4v2h2a1 1 0 001-1v-4"
        fill={color}
        opacity="0.9"
      />
      {/* Olho esquerdo */}
      <ellipse cx="9" cy="10" rx="2" ry="2.5" fill="black" opacity="0.8" />
      {/* Olho direito */}
      <ellipse cx="15" cy="10" rx="2" ry="2.5" fill="black" opacity="0.8" />
      {/* Nariz */}
      <path d="M12 12l-1 3h2l-1-3z" fill="black" opacity="0.6" />
      {/* Dentes */}
      <rect x="9" y="16" width="1.5" height="2" fill="black" opacity="0.5" />
      <rect x="11.25" y="16" width="1.5" height="2" fill="black" opacity="0.5" />
      <rect x="13.5" y="16" width="1.5" height="2" fill="black" opacity="0.5" />
    </svg>
  );
}
