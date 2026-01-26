import { IconProps, getIconSize } from '../Icon';

export function Medal3Icon({ size, color = '#cd7f32', className, style, title }: IconProps) {
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
      {/* Fita */}
      <path d="M8 2l4 6 4-6H8z" fill={color} opacity="0.7" />
      {/* Medalha */}
      <circle cx="12" cy="15" r="6" fill={color} />
      {/* Borda */}
      <circle cx="12" cy="15" r="4.5" fill="none" stroke="white" strokeWidth="0.5" opacity="0.3" />
      {/* Numero 3 */}
      <text x="12" y="18" textAnchor="middle" fontSize="7" fontWeight="bold" fill="white" opacity="0.9">3</text>
    </svg>
  );
}
