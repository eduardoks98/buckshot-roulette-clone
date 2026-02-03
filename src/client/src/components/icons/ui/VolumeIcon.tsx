import { IconProps, getIconSize, DEFAULT_ICON_COLOR } from '../Icon';

type VolumeLevel = 'off' | 'muted' | 'low' | 'medium' | 'high';

interface VolumeIconProps extends IconProps {
  level?: VolumeLevel;
}

export function VolumeIcon({ size, color = DEFAULT_ICON_COLOR, className, style, title, level = 'high' }: VolumeIconProps) {
  const s = getIconSize(size);

  // Base speaker shape
  const speaker = (
    <path
      d="M3 9v6h4l5 5V4L7 9H3z"
      fill={color}
    />
  );

  // Sound waves for different levels
  const renderWaves = () => {
    switch (level) {
      case 'off':
      case 'muted':
        // X mark for muted
        return (
          <g stroke={color} strokeWidth="2" strokeLinecap="round">
            <line x1="16" y1="9" x2="22" y2="15" />
            <line x1="22" y1="9" x2="16" y2="15" />
          </g>
        );
      case 'low':
        return (
          <path
            d="M15 9.5c1 1 1 4 0 5"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
        );
      case 'medium':
        return (
          <>
            <path
              d="M15 9.5c1 1 1 4 0 5"
              stroke={color}
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M18 7c2 2 2 8 0 10"
              stroke={color}
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />
          </>
        );
      case 'high':
      default:
        return (
          <>
            <path
              d="M15 9.5c1 1 1 4 0 5"
              stroke={color}
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M18 7c2 2 2 8 0 10"
              stroke={color}
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M21 4.5c3 3 3 12 0 15"
              stroke={color}
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />
          </>
        );
    }
  };

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
      {speaker}
      {renderWaves()}
    </svg>
  );
}
