// Achievement: Acumulador - Use 100 itens no total
import { IconProps, getIconSize } from '../Icon';

export function ItemHoarderIcon({ size = 'md', className, style, title }: IconProps) {
  const s = getIconSize(size);

  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      style={style}
      aria-label={title || 'Acumulador'}
    >
      {/* Pilha de caixas - camada inferior */}
      <rect x="4" y="32" width="14" height="12" rx="2" fill="#78350f" />
      <rect x="6" y="34" width="10" height="8" rx="1" fill="#92400e" />
      <rect x="20" y="32" width="14" height="12" rx="2" fill="#78350f" />
      <rect x="22" y="34" width="10" height="8" rx="1" fill="#92400e" />
      <rect x="36" y="36" width="10" height="8" rx="2" fill="#78350f" />
      {/* Camada do meio */}
      <rect x="8" y="20" width="14" height="12" rx="2" fill="#b45309" />
      <rect x="10" y="22" width="10" height="8" rx="1" fill="#d97706" />
      <rect x="24" y="22" width="12" height="10" rx="2" fill="#b45309" />
      <rect x="26" y="24" width="8" height="6" rx="1" fill="#d97706" />
      {/* Camada superior */}
      <rect x="12" y="8" width="12" height="12" rx="2" fill="#f59e0b" />
      <rect x="14" y="10" width="8" height="8" rx="1" fill="#fbbf24" />
      {/* Itens variados saindo */}
      <circle cx="18" cy="14" r="2" fill="#ef4444" />
      <rect x="28" y="16" width="4" height="6" rx="1" fill="#22c55e" />
      <circle cx="40" cy="28" r="3" fill="#3b82f6" />
      {/* Numero 100 */}
      <text x="18" y="42" textAnchor="middle" fill="#fef3c7" fontSize="6" fontWeight="bold">100</text>
    </svg>
  );
}
