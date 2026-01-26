// Award Icon: Exterminator (Skull)
import { IconProps, getIconSize, DEFAULT_ICON_COLOR } from '../Icon';

export function ExterminatorIcon({ size, color = DEFAULT_ICON_COLOR, className, style, title }: IconProps) {
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
      {/* Skull shape */}
      <path
        d="M12 2C7.58 2 4 5.58 4 10C4 13 5.5 15.5 8 17V20C8 21 9 22 10 22H14C15 22 16 21 16 20V17C18.5 15.5 20 13 20 10C20 5.58 16.42 2 12 2Z"
        fill={color}
        opacity="0.9"
      />
      {/* Left eye */}
      <ellipse cx="9" cy="10" rx="2" ry="2.5" fill="#1a1a1a" />
      {/* Right eye */}
      <ellipse cx="15" cy="10" rx="2" ry="2.5" fill="#1a1a1a" />
      {/* Nose */}
      <path
        d="M12 12L10.5 15H13.5L12 12Z"
        fill="#1a1a1a"
      />
      {/* Teeth */}
      <rect x="9" y="17" width="2" height="3" fill="#1a1a1a" rx="0.5" />
      <rect x="13" y="17" width="2" height="3" fill="#1a1a1a" rx="0.5" />
    </svg>
  );
}
