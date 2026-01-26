import { IconProps, getIconSize } from '../Icon';

export function ShellBlankIcon({ size, color = '#3b82f6', className, style, title }: IconProps) {
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
      {/* Cartucho */}
      <rect x="8" y="4" width="8" height="16" rx="2" fill={color} opacity="0.9" />
      {/* Ponta (primer) */}
      <rect x="9" y="4" width="6" height="3" rx="1" fill={color} />
      {/* Brilho */}
      <ellipse cx="10.5" cy="12" rx="1" ry="4" fill="white" opacity="0.25" />
      {/* Base metalica */}
      <rect x="8" y="17" width="8" height="3" rx="0.5" fill={color} opacity="0.7" />
      {/* Circulo do primer */}
      <circle cx="12" cy="18.5" r="1.5" fill={color} opacity="0.5" />
    </svg>
  );
}
