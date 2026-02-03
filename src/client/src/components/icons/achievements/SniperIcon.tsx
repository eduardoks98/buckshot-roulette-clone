// Achievement: Atirador de Elite - Acerte 100 tiros com bala real
import { IconProps, getIconSize } from '../Icon';

export function SniperIcon({ size = 'md', className, style, title }: IconProps) {
  const s = getIconSize(size);

  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      style={style}
      aria-label={title || 'Atirador de Elite'}
    >
      {/* Circulo externo da mira */}
      <circle cx="24" cy="24" r="18" stroke="#ef4444" strokeWidth="2" fill="none" />
      <circle cx="24" cy="24" r="14" stroke="#ef4444" strokeWidth="1" fill="none" opacity="0.5" />
      {/* Cruz da mira */}
      <path d="M24 4L24 18" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
      <path d="M24 30L24 44" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
      <path d="M4 24L18 24" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
      <path d="M30 24L44 24" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
      {/* Centro da mira */}
      <circle cx="24" cy="24" r="3" fill="#ef4444" />
      <circle cx="24" cy="24" r="1" fill="#ffffff" />
      {/* Marcacoes de distancia */}
      <path d="M24 8L24 10" stroke="#ef4444" strokeWidth="1" strokeLinecap="round" />
      <path d="M24 38L24 40" stroke="#ef4444" strokeWidth="1" strokeLinecap="round" />
      <path d="M8 24L10 24" stroke="#ef4444" strokeWidth="1" strokeLinecap="round" />
      <path d="M38 24L40 24" stroke="#ef4444" strokeWidth="1" strokeLinecap="round" />
      {/* Pequenas marcas diagonais */}
      <path d="M32 16L34 14" stroke="#ef4444" strokeWidth="1" strokeLinecap="round" opacity="0.7" />
      <path d="M32 32L34 34" stroke="#ef4444" strokeWidth="1" strokeLinecap="round" opacity="0.7" />
      <path d="M16 32L14 34" stroke="#ef4444" strokeWidth="1" strokeLinecap="round" opacity="0.7" />
      <path d="M16 16L14 14" stroke="#ef4444" strokeWidth="1" strokeLinecap="round" opacity="0.7" />
    </svg>
  );
}
