import { IconProps, getIconSize, DEFAULT_ICON_COLOR } from '../Icon';

export function HandSawIcon({ size, color = DEFAULT_ICON_COLOR, className, style, title }: IconProps) {
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
      {/* Lamina */}
      <path
        d="M4 8h14l2 4H4V8z"
        fill={color}
        opacity="0.9"
      />
      {/* Dentes da serra */}
      <path
        d="M4 12l1.5-2 1.5 2 1.5-2 1.5 2 1.5-2 1.5 2 1.5-2 1.5 2 1.5-2 1.5 2"
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* Cabo */}
      <path
        d="M18 8v8a2 2 0 002 2h1a1 1 0 001-1v-4a1 1 0 00-1-1h-1V8"
        fill={color}
        opacity="0.7"
      />
      {/* Detalhe do cabo */}
      <rect x="19" y="10" width="2" height="6" rx="0.5" fill={color} opacity="0.5" />
    </svg>
  );
}
