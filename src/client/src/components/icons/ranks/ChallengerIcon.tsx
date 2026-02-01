import { IconProps, getIconSize } from '../Icon';

const CHALLENGER_PRIMARY = '#ffd700';
const CHALLENGER_SECONDARY = '#ff6b6b';
const CHALLENGER_ACCENT = '#00d4ff';

export function ChallengerIcon({ size, className, style, title }: IconProps) {
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
      {/* Outer glow effect */}
      <circle cx="12" cy="12" r="10" fill={CHALLENGER_ACCENT} opacity="0.1" />

      {/* Crown base */}
      <path
        d="M3 17h18v3H3v-3z"
        fill={CHALLENGER_PRIMARY}
      />

      {/* Majestic crown */}
      <path
        d="M3 17l1-6 2 2 2-5 2 3 2-7 2 7 2-3 2 5 2-2 1 6H3z"
        fill={CHALLENGER_PRIMARY}
        opacity="0.4"
      />
      <path
        d="M3 17l1-6 2 2 2-5 2 3 2-7 2 7 2-3 2 5 2-2 1 6"
        stroke={CHALLENGER_SECONDARY}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Center gem */}
      <path
        d="M12 13l-2 2h4l-2-2z"
        fill={CHALLENGER_ACCENT}
      />
      <circle cx="12" cy="15" r="1.5" fill={CHALLENGER_ACCENT} />

      {/* Side gems */}
      <circle cx="7" cy="15" r="1" fill={CHALLENGER_SECONDARY} />
      <circle cx="17" cy="15" r="1" fill={CHALLENGER_SECONDARY} />
    </svg>
  );
}
