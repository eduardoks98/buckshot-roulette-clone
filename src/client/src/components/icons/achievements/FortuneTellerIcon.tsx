// Achievement: Vidente - Use Lupa ou Celular 30 vezes
import { IconProps, getIconSize } from '../Icon';

export function FortuneTellerIcon({ size = 'md', className, style, title }: IconProps) {
  const s = getIconSize(size);

  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      style={style}
      aria-label={title || 'Vidente'}
    >
      {/* Base da bola de cristal */}
      <path
        d="M14 40L14 44L34 44L34 40L14 40Z"
        fill="#6b7280"
      />
      <path
        d="M12 36L12 40L36 40L36 36C36 36 32 38 24 38C16 38 12 36 12 36Z"
        fill="#4b5563"
      />
      {/* Bola de cristal */}
      <circle cx="24" cy="22" r="16" fill="#7c3aed" opacity="0.3" />
      <circle cx="24" cy="22" r="14" fill="#8b5cf6" opacity="0.4" />
      <circle cx="24" cy="22" r="12" fill="#a78bfa" opacity="0.5" />
      {/* Olho mistico dentro */}
      <ellipse cx="24" cy="22" rx="8" ry="5" fill="#ffffff" opacity="0.9" />
      <circle cx="24" cy="22" r="4" fill="#7c3aed" />
      <circle cx="24" cy="22" r="2" fill="#1f2937" />
      <circle cx="25" cy="21" r="1" fill="#ffffff" />
      {/* Brilho na bola */}
      <path
        d="M14 14C14 14 16 12 20 12"
        stroke="#ffffff"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.6"
      />
      {/* Aura mistica */}
      <circle cx="24" cy="22" r="18" stroke="#c4b5fd" strokeWidth="1" fill="none" opacity="0.4" />
      {/* Estrelas */}
      <path d="M8 10L9 12L11 12L9.5 13.5L10 16L8 14.5L6 16L6.5 13.5L5 12L7 12L8 10Z" fill="#fbbf24" opacity="0.8" />
      <path d="M40 14L41 16L43 16L41.5 17.5L42 20L40 18.5L38 20L38.5 17.5L37 16L39 16L40 14Z" fill="#fbbf24" opacity="0.8" />
      <path d="M36 6L36.5 7.5L38 7.5L37 8.5L37.5 10L36 9L34.5 10L35 8.5L34 7.5L35.5 7.5L36 6Z" fill="#fbbf24" opacity="0.6" />
    </svg>
  );
}
