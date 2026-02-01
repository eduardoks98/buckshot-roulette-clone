import { IconProps, getIconSize } from '../Icon';

const SILVER_COLOR = '#c0c0c0';

export function SilverIcon({ size, className, style, title }: IconProps) {
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
        d="M12 2L4 6v6c0 5.5 3.5 10 8 11 4.5-1 8-5.5 8-11V6l-8-4z"
        fill={SILVER_COLOR}
        opacity="0.2"
      />
      <path
        d="M12 2L4 6v6c0 5.5 3.5 10 8 11 4.5-1 8-5.5 8-11V6l-8-4z"
        stroke={SILVER_COLOR}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 6L8 8v4c0 3 2 5.5 4 6 2-.5 4-3 4-6V8l-4-2z"
        fill={SILVER_COLOR}
        opacity="0.4"
      />
    </svg>
  );
}
