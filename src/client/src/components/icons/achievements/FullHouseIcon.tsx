// Achievement: Casa Cheia - Jogue uma partida com 4 jogadores
import { IconProps, getIconSize } from '../Icon';

export function FullHouseIcon({ size = 'md', className, style, title }: IconProps) {
  const s = getIconSize(size);

  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      style={style}
      aria-label={title || 'Casa Cheia'}
    >
      {/* Mesa redonda */}
      <ellipse cx="24" cy="30" rx="18" ry="8" fill="#78350f" />
      <ellipse cx="24" cy="28" rx="16" ry="6" fill="#92400e" />
      {/* Jogador 1 - topo */}
      <circle cx="24" cy="12" r="5" fill="#3b82f6" />
      <circle cx="24" cy="10" r="2" fill="#93c5fd" />
      <rect x="22" y="17" width="4" height="6" rx="1" fill="#3b82f6" />
      {/* Jogador 2 - direita */}
      <circle cx="40" cy="26" r="5" fill="#22c55e" />
      <circle cx="40" cy="24" r="2" fill="#86efac" />
      <rect x="38" y="31" width="4" height="6" rx="1" fill="#22c55e" />
      {/* Jogador 3 - baixo */}
      <circle cx="24" cy="44" r="5" fill="#f59e0b" />
      <circle cx="24" cy="42" r="2" fill="#fcd34d" />
      {/* Jogador 4 - esquerda */}
      <circle cx="8" cy="26" r="5" fill="#ef4444" />
      <circle cx="8" cy="24" r="2" fill="#fca5a5" />
      <rect x="6" y="31" width="4" height="6" rx="1" fill="#ef4444" />
      {/* Cartas/itens na mesa */}
      <rect x="20" y="26" width="3" height="4" rx="0.5" fill="#fbbf24" transform="rotate(-15 20 26)" />
      <rect x="25" y="27" width="3" height="4" rx="0.5" fill="#fbbf24" transform="rotate(10 25 27)" />
      <rect x="22" y="28" width="3" height="4" rx="0.5" fill="#ef4444" transform="rotate(5 22 28)" />
      {/* Indicador 4/4 */}
      <text x="24" y="32" textAnchor="middle" fill="#fef3c7" fontSize="5" fontWeight="bold">4/4</text>
    </svg>
  );
}
