import { IconProps, getIconSize } from '../Icon';

export function DisconnectedIcon({ size, color = '#fbbf24', className, style, title }: IconProps) {
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
      {/* Raio */}
      <path
        d="M13 2L4 14h7l-1 8 9-12h-7l1-8z"
        fill={color}
        opacity="0.9"
      />
      {/* Brilho central */}
      <path
        d="M11 8l-3 6h4l-0.5 4 4.5-6h-4l0.5-4z"
        fill="white"
        opacity="0.3"
      />
    </svg>
  );
}
