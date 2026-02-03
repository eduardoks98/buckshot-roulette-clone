// Achievement: Novato - Jogue sua primeira partida
import { IconProps, getIconSize } from '../Icon';

export function RookieIcon({ size = 'md', className, style, title }: IconProps) {
  const s = getIconSize(size);

  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      style={style}
      aria-label={title || 'Novato'}
    >
      {/* Controle de game */}
      <rect x="6" y="16" width="36" height="20" rx="6" fill="#374151" />
      <rect x="8" y="18" width="32" height="16" rx="4" fill="#4b5563" />
      {/* D-pad esquerdo */}
      <rect x="12" y="22" width="4" height="10" rx="1" fill="#1f2937" />
      <rect x="10" y="25" width="10" height="4" rx="1" fill="#1f2937" />
      {/* Botoes direita */}
      <circle cx="34" cy="24" r="3" fill="#ef4444" />
      <circle cx="38" cy="28" r="3" fill="#22c55e" />
      <circle cx="30" cy="28" r="3" fill="#3b82f6" />
      <circle cx="34" cy="32" r="3" fill="#fbbf24" />
      {/* Botoes centrais */}
      <rect x="20" y="26" width="4" height="2" rx="1" fill="#6b7280" />
      <rect x="25" y="26" width="4" height="2" rx="1" fill="#6b7280" />
      {/* Estrela de novato */}
      <path
        d="M24 4L26 10L32 10L27 14L29 20L24 16L19 20L21 14L16 10L22 10L24 4Z"
        fill="#fbbf24"
      />
      <path
        d="M24 6L25.5 10.5L30 10.5L26.5 13L28 17L24 14.5L20 17L21.5 13L18 10.5L22.5 10.5L24 6Z"
        fill="#fef3c7"
        opacity="0.5"
      />
      {/* Brilho */}
      <circle cx="34" cy="24" r="1" fill="#ffffff" opacity="0.6" />
    </svg>
  );
}
