// Achievement: Veterano - Jogue 100 partidas
import { IconProps, getIconSize } from '../Icon';

export function VeteranIcon({ size = 'md', className, style, title }: IconProps) {
  const s = getIconSize(size);

  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      style={style}
      aria-label={title || 'Veterano'}
    >
      {/* Medalha */}
      <circle cx="24" cy="28" r="14" fill="#d97706" />
      <circle cx="24" cy="28" r="12" fill="#f59e0b" />
      <circle cx="24" cy="28" r="10" fill="#fbbf24" />
      {/* Fita */}
      <path
        d="M16 4L16 18L24 14L32 18L32 4L16 4Z"
        fill="#3b82f6"
      />
      <path
        d="M18 4L18 16L24 13L30 16L30 4L18 4Z"
        fill="#60a5fa"
      />
      {/* Listras na fita */}
      <rect x="20" y="4" width="2" height="10" fill="#1d4ed8" opacity="0.5" />
      <rect x="26" y="4" width="2" height="10" fill="#1d4ed8" opacity="0.5" />
      {/* Estrelas na medalha */}
      <path d="M18 26L19 28L21 28L19.5 29.5L20 32L18 30.5L16 32L16.5 29.5L15 28L17 28L18 26Z" fill="#fef3c7" />
      <path d="M24 22L25 24L27 24L25.5 25.5L26 28L24 26.5L22 28L22.5 25.5L21 24L23 24L24 22Z" fill="#fef3c7" />
      <path d="M30 26L31 28L33 28L31.5 29.5L32 32L30 30.5L28 32L28.5 29.5L27 28L29 28L30 26Z" fill="#fef3c7" />
      {/* Numero 100 */}
      <text x="24" y="38" textAnchor="middle" fill="#92400e" fontSize="6" fontWeight="bold">100</text>
      {/* Brilho */}
      <path d="M18 22C18 22 20 20 22 20" stroke="#fef3c7" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
    </svg>
  );
}
