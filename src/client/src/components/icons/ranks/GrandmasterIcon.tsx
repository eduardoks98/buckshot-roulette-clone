import { IconProps, getIconSize } from '../Icon';

const GM_COLOR = '#ff4757';
const GM_ACCENT = '#8b0000';

export function GrandmasterIcon({ size, className, style, title }: IconProps) {
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
        d="M3 18h18v2H3v-2z"
        fill={GM_COLOR}
      />
      {/* Crown body with extra spikes */}
      <path
        d="M3 18l1.5-8 3 3 2.5-6 2 4 2-4 2.5 6 3-3 1.5 8H3z"
        fill={GM_COLOR}
        opacity="0.3"
      />
      <path
        d="M3 18l1.5-8 3 3 2.5-6 2 4 2-4 2.5 6 3-3 1.5 8"
        stroke={GM_ACCENT}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Gems */}
      <circle cx="7" cy="16" r="1.2" fill={GM_ACCENT} />
      <circle cx="12" cy="15" r="1.5" fill={GM_ACCENT} />
      <circle cx="17" cy="16" r="1.2" fill={GM_ACCENT} />
    </svg>
  );
}
