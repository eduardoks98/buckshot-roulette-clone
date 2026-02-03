// Achievement: Ladrao - Roube 10 itens com Adrenalina
import { IconProps, getIconSize } from '../Icon';

export function ThiefIcon({ size = 'md', className, style, title }: IconProps) {
  const s = getIconSize(size);

  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      style={style}
      aria-label={title || 'Ladrao'}
    >
      {/* Mao pegando */}
      <path
        d="M8 28C8 28 4 26 4 22C4 18 8 16 12 18L16 20L16 14C16 12 18 10 20 12L20 18"
        fill="#fbbf24"
      />
      <path
        d="M20 18L20 10C20 8 22 6 24 8L24 18"
        fill="#fbbf24"
      />
      <path
        d="M24 18L24 12C24 10 26 8 28 10L28 18"
        fill="#fbbf24"
      />
      <path
        d="M28 18L28 14C28 12 30 10 32 12L32 22"
        fill="#fbbf24"
      />
      {/* Palma */}
      <path
        d="M8 28L8 36C8 40 12 44 18 44L26 44C30 44 34 40 34 36L34 22L8 22L8 28Z"
        fill="#fbbf24"
      />
      {/* Seringa de adrenalina sendo roubada */}
      <rect x="32" y="8" width="6" height="18" rx="2" fill="#ef4444" />
      <rect x="33" y="10" width="4" height="8" rx="1" fill="#fca5a5" />
      <rect x="34" y="4" width="2" height="6" fill="#6b7280" />
      <path d="M35 26L35 30" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
      {/* Linhas de movimento */}
      <path d="M38 14L44 12" stroke="#d97706" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
      <path d="M40 20L46 20" stroke="#d97706" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
      <path d="M38 26L44 28" stroke="#d97706" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
      {/* Sombra na mao */}
      <path
        d="M12 28L12 36C12 38 14 40 18 40L26 40C28 40 30 38 30 36L30 28L12 28Z"
        fill="#d97706"
        opacity="0.3"
      />
    </svg>
  );
}
