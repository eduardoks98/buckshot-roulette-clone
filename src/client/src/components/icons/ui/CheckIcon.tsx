import { IconProps, getIconSize, DEFAULT_ICON_COLOR } from '../Icon';

export function CheckIcon({ size, color = DEFAULT_ICON_COLOR, className, style, title }: IconProps) {
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
      {/* Circulo de fundo */}
      <circle cx="12" cy="12" r="10" fill={color} opacity="0.15" />
      <circle cx="12" cy="12" r="10" fill="none" stroke={color} strokeWidth="2" />
      {/* Check mark */}
      <path
        d="M7 12.5l3 3 7-7"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
