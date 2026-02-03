// Achievement: Centuriao - Alcance 100 eliminacoes
import { IconProps, getIconSize } from '../Icon';

export function CenturionIcon({ size = 'md', className, style, title }: IconProps) {
  const s = getIconSize(size);

  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      style={style}
      aria-label={title || 'Centuriao'}
    >
      {/* Capacete romano */}
      <path
        d="M24 8C14 8 8 16 8 26C8 30 10 34 14 36L14 42H34L34 36C38 34 40 30 40 26C40 16 34 8 24 8Z"
        fill="#d4a418"
      />
      <path
        d="M24 8C18 8 12 14 12 24C12 28 14 32 16 34L16 40H32L32 34C34 32 36 28 36 24C36 14 30 8 24 8Z"
        fill="#fbbf24"
      />
      {/* Crista do capacete */}
      <path
        d="M24 4C24 4 22 6 22 8L22 14C22 14 24 12 26 14L26 8C26 6 24 4 24 4Z"
        fill="#dc2626"
      />
      <path
        d="M22 14L22 6C22 6 18 8 18 12L18 18C18 18 20 16 22 18L22 14Z"
        fill="#ef4444"
      />
      <path
        d="M26 14L26 6C26 6 30 8 30 12L30 18C30 18 28 16 26 18L26 14Z"
        fill="#ef4444"
      />
      {/* Viseira */}
      <rect x="10" y="20" width="28" height="4" rx="1" fill="#92400e" />
      {/* Protetor de face */}
      <path
        d="M14 26L14 34C14 34 18 36 24 36C30 36 34 34 34 34L34 26"
        stroke="#92400e"
        strokeWidth="2"
        fill="none"
      />
      {/* Numero 100 */}
      <text x="24" y="44" textAnchor="middle" fill="#dc2626" fontSize="8" fontWeight="bold">C</text>
    </svg>
  );
}
