import { IconProps, getIconSize, DEFAULT_ICON_COLOR } from '../Icon';

export function HandSawIcon({ size, color = DEFAULT_ICON_COLOR, className, style, title }: IconProps) {
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

      {/* Lamina da serra */}
      <path
        d="M1 8 L15 6 L17 10 L1 13 Z"
        fill={color}
      />

      {/* Dentes da serra - triangulos grandes e visiveis */}
      <path
        d="M1 13 L3 9 L5 13 L7 9 L9 13 L11 9 L13 13 L15 9 L17 13"
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
      />

      {/* Cabo da serra */}
      <path
        d="M15 6 L19 5 Q22 5, 22 8 L22 14 Q22 17, 19 17 L15 16 Z"
        fill={color}
      />

      {/* Buraco no cabo - area escura */}
      <ellipse cx="18.5" cy="11" rx="2" ry="3" fill="#1a1a1a" />
    </svg>
  );
}
