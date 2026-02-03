// Achievement: Serial Killer - Elimine 10 jogadores
import { IconProps, getIconSize } from '../Icon';

export function SerialKillerIcon({ size = 'md', className, style, title }: IconProps) {
  const s = getIconSize(size);

  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      style={style}
      aria-label={title || 'Serial Killer'}
    >
      {/* Mascara */}
      <ellipse cx="24" cy="26" rx="16" ry="18" fill="#1f2937" />
      <ellipse cx="24" cy="26" rx="14" ry="16" fill="#374151" />
      {/* Olhos vazios */}
      <ellipse cx="17" cy="22" rx="4" ry="5" fill="#0f172a" />
      <ellipse cx="31" cy="22" rx="4" ry="5" fill="#0f172a" />
      {/* Brilho sinistro nos olhos */}
      <circle cx="18" cy="21" r="1.5" fill="#ef4444" opacity="0.8" />
      <circle cx="32" cy="21" r="1.5" fill="#ef4444" opacity="0.8" />
      {/* Marcas de contagem */}
      <path d="M6 38L8 42" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
      <path d="M10 38L12 42" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
      <path d="M14 38L16 42" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
      <path d="M18 38L20 42" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
      <path d="M6 40L20 40" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
      {/* Segunda contagem */}
      <path d="M28 38L30 42" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
      <path d="M32 38L34 42" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
      <path d="M36 38L38 42" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
      <path d="M40 38L42 42" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
      <path d="M28 40L42 40" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
