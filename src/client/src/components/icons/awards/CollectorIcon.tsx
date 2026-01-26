// Award Icon: Collector (Backpack/Bag)
import { IconProps, getIconSize, DEFAULT_ICON_COLOR } from '../Icon';

export function CollectorIcon({ size, color = DEFAULT_ICON_COLOR, className, style, title }: IconProps) {
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
      {/* Backpack body */}
      <rect
        x="5"
        y="8"
        width="14"
        height="14"
        rx="3"
        fill={color}
        opacity="0.9"
      />
      {/* Top flap */}
      <path
        d="M7 8V6C7 4 9 2 12 2C15 2 17 4 17 6V8"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      {/* Front pocket */}
      <rect
        x="8"
        y="13"
        width="8"
        height="5"
        rx="1"
        fill="#1a1a1a"
        opacity="0.6"
      />
      {/* Zipper line */}
      <line
        x1="12"
        y1="13"
        x2="12"
        y2="18"
        stroke={color}
        strokeWidth="1"
        opacity="0.5"
      />
    </svg>
  );
}
