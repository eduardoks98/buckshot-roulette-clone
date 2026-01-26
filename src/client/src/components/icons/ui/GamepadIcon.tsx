import { IconProps, getIconSize, DEFAULT_ICON_COLOR } from '../Icon';

export function GamepadIcon({ size, color = DEFAULT_ICON_COLOR, className, style, title }: IconProps) {
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
      {/* Corpo do controle */}
      <path
        d="M4 8h16a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2v-6a2 2 0 012-2z"
        fill={color}
        opacity="0.9"
      />
      {/* D-pad vertical */}
      <rect x="6" y="10" width="2" height="6" rx="0.5" fill="black" opacity="0.4" />
      {/* D-pad horizontal */}
      <rect x="4" y="12" width="6" height="2" rx="0.5" fill="black" opacity="0.4" />
      {/* Botoes */}
      <circle cx="16" cy="11" r="1.2" fill="black" opacity="0.4" />
      <circle cx="19" cy="13" r="1.2" fill="black" opacity="0.4" />
      <circle cx="16" cy="15" r="1.2" fill="black" opacity="0.4" />
      <circle cx="13" cy="13" r="1.2" fill="black" opacity="0.4" />
      {/* Sticks analogicos indicados */}
      <circle cx="7" cy="13" r="0.8" fill="black" opacity="0.6" />
    </svg>
  );
}
