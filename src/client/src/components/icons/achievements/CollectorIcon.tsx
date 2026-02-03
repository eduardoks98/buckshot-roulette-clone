// Achievement: Colecionador - Use todos os 10 itens diferentes
import { IconProps, getIconSize } from '../Icon';

export function CollectorIcon({ size = 'md', className, style, title }: IconProps) {
  const s = getIconSize(size);

  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      style={style}
      aria-label={title || 'Colecionador'}
    >
      {/* Mochila */}
      <path
        d="M12 18L12 40C12 42 14 44 16 44L32 44C34 44 36 42 36 40L36 18"
        fill="#92400e"
      />
      <path
        d="M14 20L14 42L34 42L34 20"
        fill="#b45309"
      />
      {/* Topo da mochila */}
      <path
        d="M10 18C10 14 14 12 18 12L30 12C34 12 38 14 38 18L10 18Z"
        fill="#92400e"
      />
      {/* Bolso frontal */}
      <rect x="18" y="28" width="12" height="10" rx="2" fill="#78350f" />
      <rect x="20" y="30" width="8" height="6" rx="1" fill="#92400e" />
      {/* Alcas */}
      <path d="M16 12L16 6C16 4 18 4 20 4L28 4C30 4 32 4 32 6L32 12" stroke="#78350f" strokeWidth="3" fill="none" />
      {/* Itens saindo */}
      <circle cx="8" cy="24" r="3" fill="#ef4444" /> {/* Cigarro/item */}
      <rect x="4" y="32" width="6" height="8" rx="1" fill="#22c55e" /> {/* Remedio */}
      <circle cx="40" cy="26" r="4" fill="#fbbf24" /> {/* Lupa */}
      <rect x="38" y="34" width="6" height="4" rx="1" fill="#6b7280" /> {/* Algema */}
      {/* Brilho de novo item */}
      <path d="M24 8L24 4" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />
      <path d="M20 6L28 6" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
