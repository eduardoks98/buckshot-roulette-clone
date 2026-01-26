import { IconProps, getIconSize, DEFAULT_ICON_COLOR } from '../Icon';

export function StarIcon({ size, color = DEFAULT_ICON_COLOR, className, style, title }: IconProps) {
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
      <polygon
        points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
        fill={color}
        opacity="0.9"
      />
      {/* Brilho */}
      <polygon
        points="12 5 13.5 9.5 12 8.5 10.5 9.5 12 5"
        fill="white"
        opacity="0.3"
      />
    </svg>
  );
}
