// Achievement: Anjo da Morte - Alcance 500 eliminacoes
import { IconProps, getIconSize } from '../Icon';

export function AngelOfDeathIcon({ size = 'md', className, style, title }: IconProps) {
  const s = getIconSize(size);

  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      style={style}
      aria-label={title || 'Anjo da Morte'}
    >
      {/* Asas esquerda */}
      <path
        d="M4 24C4 24 6 16 10 12C14 8 20 8 20 12C20 16 16 20 12 22C8 24 4 24 4 24Z"
        fill="#1f2937"
      />
      <path
        d="M6 24C6 24 8 18 11 15C14 12 18 12 18 14C18 16 15 19 12 21C9 23 6 24 6 24Z"
        fill="#374151"
      />
      {/* Asas direita */}
      <path
        d="M44 24C44 24 42 16 38 12C34 8 28 8 28 12C28 16 32 20 36 22C40 24 44 24 44 24Z"
        fill="#1f2937"
      />
      <path
        d="M42 24C42 24 40 18 37 15C34 12 30 12 30 14C30 16 33 19 36 21C39 23 42 24 42 24Z"
        fill="#374151"
      />
      {/* Foice */}
      <path
        d="M24 10L24 40"
        stroke="#6b7280"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M24 10C24 10 16 12 14 18C12 24 16 28 24 28"
        stroke="#9ca3af"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M14 18C14 18 18 16 20 18C22 20 20 24 16 24"
        fill="#d1d5db"
      />
      {/* Caveira pequena na base */}
      <circle cx="24" cy="38" r="4" fill="#e5e7eb" />
      <circle cx="22" cy="37" r="1" fill="#1f2937" />
      <circle cx="26" cy="37" r="1" fill="#1f2937" />
      <path d="M22 40L26 40" stroke="#1f2937" strokeWidth="1" />
    </svg>
  );
}
