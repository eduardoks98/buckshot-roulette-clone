// Achievement: Mestre da Serra - Cause dano dobrado 20 vezes
import { IconProps, getIconSize } from '../Icon';

export function SawMasterIcon({ size = 'md', className, style, title }: IconProps) {
  const s = getIconSize(size);

  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      style={style}
      aria-label={title || 'Mestre da Serra'}
    >
      {/* Serra circular */}
      <circle cx="24" cy="24" r="18" fill="#6b7280" />
      <circle cx="24" cy="24" r="14" fill="#9ca3af" />
      <circle cx="24" cy="24" r="4" fill="#374151" />
      {/* Dentes da serra */}
      {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle, i) => {
        const rad = (angle * Math.PI) / 180;
        const x1 = 24 + 14 * Math.cos(rad);
        const y1 = 24 + 14 * Math.sin(rad);
        const x2 = 24 + 20 * Math.cos(rad + 0.15);
        const y2 = 24 + 20 * Math.sin(rad + 0.15);
        const x3 = 24 + 14 * Math.cos(rad + 0.3);
        const y3 = 24 + 14 * Math.sin(rad + 0.3);
        return (
          <path
            key={i}
            d={`M${x1} ${y1}L${x2} ${y2}L${x3} ${y3}Z`}
            fill="#4b5563"
          />
        );
      })}
      {/* Gotas de sangue */}
      <circle cx="38" cy="12" r="3" fill="#ef4444" />
      <circle cx="42" cy="18" r="2" fill="#ef4444" opacity="0.8" />
      <circle cx="36" cy="8" r="1.5" fill="#ef4444" opacity="0.6" />
      {/* Brilho */}
      <path
        d="M16 16C16 16 18 18 20 18"
        stroke="#d1d5db"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.6"
      />
      {/* x2 multiplicador */}
      <text x="24" y="27" textAnchor="middle" fill="#fbbf24" fontSize="8" fontWeight="bold">x2</text>
    </svg>
  );
}
