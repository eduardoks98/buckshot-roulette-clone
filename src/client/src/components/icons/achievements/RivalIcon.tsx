// Achievement: Rival - Enfrente o mesmo jogador 5 vezes
import { IconProps, getIconSize } from '../Icon';

export function RivalIcon({ size = 'md', className, style, title }: IconProps) {
  const s = getIconSize(size);

  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      style={style}
      aria-label={title || 'Rival'}
    >
      {/* Rosto esquerdo */}
      <circle cx="14" cy="20" r="10" fill="#3b82f6" />
      <circle cx="14" cy="18" r="4" fill="#93c5fd" />
      {/* Olho esquerdo - determinado */}
      <ellipse cx="12" cy="20" rx="1.5" ry="2" fill="#1f2937" />
      <ellipse cx="16" cy="20" rx="1.5" ry="2" fill="#1f2937" />
      <path d="M10 16L14 18" stroke="#1f2937" strokeWidth="1.5" strokeLinecap="round" />
      {/* Boca esquerda - seria */}
      <path d="M11 24L17 24" stroke="#1f2937" strokeWidth="1.5" strokeLinecap="round" />
      {/* Rosto direito */}
      <circle cx="34" cy="20" r="10" fill="#ef4444" />
      <circle cx="34" cy="18" r="4" fill="#fca5a5" />
      {/* Olho direito - determinado */}
      <ellipse cx="32" cy="20" rx="1.5" ry="2" fill="#1f2937" />
      <ellipse cx="36" cy="20" rx="1.5" ry="2" fill="#1f2937" />
      <path d="M38 16L34 18" stroke="#1f2937" strokeWidth="1.5" strokeLinecap="round" />
      {/* Boca direita - seria */}
      <path d="M31 24L37 24" stroke="#1f2937" strokeWidth="1.5" strokeLinecap="round" />
      {/* Raios de tensao entre eles */}
      <path d="M20 18L22 20L20 22L22 24" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M26 18L28 20L26 22L28 24" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {/* VS no centro */}
      <text x="24" y="22" textAnchor="middle" fill="#fbbf24" fontSize="6" fontWeight="bold">VS</text>
      {/* Contador de encontros */}
      <rect x="8" y="34" width="32" height="10" rx="2" fill="#1f2937" />
      <text x="24" y="42" textAnchor="middle" fill="#ffffff" fontSize="7" fontWeight="bold">5x</text>
      {/* Punhos se encontrando */}
      <path d="M4 32L8 36" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" />
      <path d="M44 32L40 36" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
