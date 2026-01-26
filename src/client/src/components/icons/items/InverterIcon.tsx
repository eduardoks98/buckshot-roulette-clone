import { IconProps, getIconSize, DEFAULT_ICON_COLOR } from '../Icon';

export function InverterIcon({ size, color = DEFAULT_ICON_COLOR, className, style, title }: IconProps) {
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
      {/* Seta circular superior */}
      <path
        d="M12 4a8 8 0 016.93 4"
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <polygon points="20 6 18 10 16 6" fill={color} />
      {/* Seta circular inferior */}
      <path
        d="M12 20a8 8 0 01-6.93-4"
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <polygon points="4 18 6 14 8 18" fill={color} />
      {/* Centro */}
      <circle cx="12" cy="12" r="2" fill={color} opacity="0.5" />
    </svg>
  );
}
