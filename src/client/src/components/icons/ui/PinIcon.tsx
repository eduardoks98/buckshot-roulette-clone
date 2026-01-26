import { IconProps, getIconSize, DEFAULT_ICON_COLOR } from '../Icon';

export function PinIcon({ size, color = DEFAULT_ICON_COLOR, className, style, title }: IconProps) {
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
      {/* Cabeca do alfinete */}
      <circle cx="12" cy="8" r="5" fill={color} />
      {/* Ponta */}
      <path d="M12 13v8" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      {/* Brilho */}
      <circle cx="10" cy="6" r="1.5" fill="white" opacity="0.3" />
    </svg>
  );
}
