// Achievement: Pacifista - Venca uma rodada sem disparar nenhum tiro
import { IconProps, getIconSize } from '../Icon';

export function PacifistIcon({ size = 'md', className, style, title }: IconProps) {
  const s = getIconSize(size);

  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      style={style}
      aria-label={title || 'Pacifista'}
    >
      {/* Pomba */}
      <path
        d="M12 24C12 24 8 20 8 16C8 12 12 10 16 12C20 14 22 18 22 18L28 14L32 18L26 22L30 24C30 24 34 22 38 24C42 26 42 32 38 34C34 36 28 34 28 34L24 38L20 34L24 30C24 30 20 32 16 30C12 28 12 24 12 24Z"
        fill="#e5e7eb"
      />
      <path
        d="M14 22C14 22 12 20 12 17C12 14 14 13 16 14C18 15 19 17 19 17"
        fill="#f3f4f6"
      />
      {/* Olho */}
      <circle cx="14" cy="16" r="1.5" fill="#1f2937" />
      {/* Bico */}
      <path
        d="M8 16L6 18L10 18L8 16Z"
        fill="#f59e0b"
      />
      {/* Asa detalhada */}
      <path
        d="M22 18L28 14L30 16L24 20L22 18Z"
        fill="#d1d5db"
      />
      {/* Ramo de oliveira */}
      <path
        d="M30 36L36 42"
        stroke="#15803d"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <ellipse cx="32" cy="38" rx="3" ry="1.5" fill="#22c55e" transform="rotate(-30 32 38)" />
      <ellipse cx="34" cy="40" rx="3" ry="1.5" fill="#22c55e" transform="rotate(-30 34 40)" />
      <ellipse cx="36" cy="42" rx="3" ry="1.5" fill="#22c55e" transform="rotate(-30 36 42)" />
      {/* Auréola de paz */}
      <circle cx="24" cy="8" r="6" stroke="#fbbf24" strokeWidth="2" fill="none" opacity="0.6" />
    </svg>
  );
}
