// Award Icon: Masochist (Broken Heart)
import { IconProps, getIconSize, DEFAULT_ICON_COLOR } from '../Icon';

export function MasochistIcon({ size, color = DEFAULT_ICON_COLOR, className, style, title }: IconProps) {
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
      {/* Left half of broken heart */}
      <path
        d="M12 21L4.5 13C2.5 10.5 2.5 7 5 5C7 3.5 9.5 3.5 11 5L12 6L11 10L13 12L11 15L12 21Z"
        fill={color}
        opacity="0.9"
      />
      {/* Right half of broken heart */}
      <path
        d="M12 21L19.5 13C21.5 10.5 21.5 7 19 5C17 3.5 14.5 3.5 13 5L12 6L13 10L11 12L13 15L12 21Z"
        fill={color}
        opacity="0.7"
      />
      {/* Crack line */}
      <path
        d="M12 6L11 10L13 12L11 15L12 21"
        stroke="#1a1a1a"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
