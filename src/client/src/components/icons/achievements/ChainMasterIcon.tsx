// Achievement: Mestre das Correntes - Algeme 20 jogadores
import { IconProps, getIconSize } from '../Icon';

export function ChainMasterIcon({ size = 'md', className, style, title }: IconProps) {
  const s = getIconSize(size);

  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      style={style}
      aria-label={title || 'Mestre das Correntes'}
    >
      {/* Algema esquerda */}
      <circle cx="12" cy="24" r="10" stroke="#6b7280" strokeWidth="4" fill="none" />
      <circle cx="12" cy="24" r="6" stroke="#9ca3af" strokeWidth="2" fill="none" />
      {/* Fechadura esquerda */}
      <rect x="8" y="14" width="8" height="6" rx="1" fill="#4b5563" />
      <circle cx="12" cy="17" r="1.5" fill="#1f2937" />
      {/* Algema direita */}
      <circle cx="36" cy="24" r="10" stroke="#6b7280" strokeWidth="4" fill="none" />
      <circle cx="36" cy="24" r="6" stroke="#9ca3af" strokeWidth="2" fill="none" />
      {/* Fechadura direita */}
      <rect x="32" y="14" width="8" height="6" rx="1" fill="#4b5563" />
      <circle cx="36" cy="17" r="1.5" fill="#1f2937" />
      {/* Corrente conectando */}
      <ellipse cx="20" cy="24" rx="3" ry="4" stroke="#6b7280" strokeWidth="2" fill="none" />
      <ellipse cx="24" cy="24" rx="3" ry="4" stroke="#6b7280" strokeWidth="2" fill="none" />
      <ellipse cx="28" cy="24" rx="3" ry="4" stroke="#6b7280" strokeWidth="2" fill="none" />
      {/* Brilho metalico */}
      <path d="M6 20L8 22" stroke="#d1d5db" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
      <path d="M40 20L42 22" stroke="#d1d5db" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
      {/* Efeito de poder */}
      <circle cx="12" cy="24" r="12" stroke="#fbbf24" strokeWidth="1" fill="none" opacity="0.4" />
      <circle cx="36" cy="24" r="12" stroke="#fbbf24" strokeWidth="1" fill="none" opacity="0.4" />
    </svg>
  );
}
