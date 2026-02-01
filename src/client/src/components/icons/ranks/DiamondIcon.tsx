import { IconProps, getIconSize } from '../Icon';

const DIAMOND_COLOR = '#b9f2ff';
const DIAMOND_ACCENT = '#00d4ff';

export function DiamondIcon({ size, className, style, title }: IconProps) {
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
      {/* Diamond shape */}
      <path
        d="M12 2l-8 8 8 12 8-12-8-8z"
        fill={DIAMOND_COLOR}
        opacity="0.3"
      />
      <path
        d="M12 2l-8 8 8 12 8-12-8-8z"
        stroke={DIAMOND_ACCENT}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Inner facets */}
      <path
        d="M12 2l-4 8h8l-4-8zM8 10l4 12 4-12H8z"
        stroke={DIAMOND_ACCENT}
        strokeWidth="1"
        opacity="0.5"
      />
    </svg>
  );
}
