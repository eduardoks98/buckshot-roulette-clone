import { IconProps, getIconSize } from '../Icon';

const MASTER_COLOR = '#ff6b6b';
const MASTER_ACCENT = '#c0392b';

export function MasterIcon({ size, className, style, title }: IconProps) {
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
      {/* Crown base */}
      <path
        d="M4 18h16v2H4v-2z"
        fill={MASTER_COLOR}
      />
      {/* Crown body */}
      <path
        d="M4 18l2-10 4 4 2-8 2 8 4-4 2 10H4z"
        fill={MASTER_COLOR}
        opacity="0.3"
      />
      <path
        d="M4 18l2-10 4 4 2-8 2 8 4-4 2 10"
        stroke={MASTER_ACCENT}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Gems */}
      <circle cx="8" cy="16" r="1" fill={MASTER_ACCENT} />
      <circle cx="12" cy="16" r="1" fill={MASTER_ACCENT} />
      <circle cx="16" cy="16" r="1" fill={MASTER_ACCENT} />
    </svg>
  );
}
