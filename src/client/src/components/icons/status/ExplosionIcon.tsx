import { IconProps, getIconSize } from '../Icon';

export function ExplosionIcon({ size, color = '#ef4444', className, style, title }: IconProps) {
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
      {/* Explosao principal */}
      <path
        d="M12 2l2 6 5-3-2 5 5 2-5 2 2 5-5-3-2 6-2-6-5 3 2-5-5-2 5-2-2-5 5 3z"
        fill={color}
        opacity="0.9"
      />
      {/* Centro brilhante */}
      <circle cx="12" cy="12" r="3" fill={color} />
      <circle cx="12" cy="12" r="1.5" fill="white" opacity="0.5" />
    </svg>
  );
}
