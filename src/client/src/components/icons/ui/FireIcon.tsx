import { IconProps, getIconSize, DEFAULT_ICON_COLOR } from '../Icon';

export function FireIcon({ size, color = DEFAULT_ICON_COLOR, className, style, title }: IconProps) {
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
      <path
        d="M12 2c0 4-3 6-3 10 0 2.5 1.5 4.5 3 5.5 1.5-1 3-3 3-5.5 0-4-3-6-3-10z"
        fill={color}
        opacity="0.3"
      />
      <path
        d="M12 2c0 4-3 6-3 10 0 2.5 1.5 4.5 3 5.5 1.5-1 3-3 3-5.5 0-4-3-6-3-10z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 22c-4 0-7-3-7-7 0-3 2-5 4-7 0 2 1 3 3 3s3-1 3-3c2 2 4 4 4 7 0 4-3 7-7 7z"
        fill={color}
        opacity="0.15"
      />
      <path
        d="M12 22c-4 0-7-3-7-7 0-3 2-5 4-7 0 2 1 3 3 3s3-1 3-3c2 2 4 4 4 7 0 4-3 7-7 7z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
