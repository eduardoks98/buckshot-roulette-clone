// Achievement: Borboleta Social - Jogue com 10 jogadores diferentes
import { IconProps, getIconSize } from '../Icon';

export function SocialButterflyIcon({ size = 'md', className, style, title }: IconProps) {
  const s = getIconSize(size);

  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      style={style}
      aria-label={title || 'Borboleta Social'}
    >
      {/* Pessoas conectadas em circulo */}
      {/* Pessoa central */}
      <circle cx="24" cy="24" r="5" fill="#3b82f6" />
      <circle cx="24" cy="21" r="2" fill="#93c5fd" />
      {/* Pessoas ao redor */}
      {[0, 60, 120, 180, 240, 300].map((angle, i) => {
        const rad = (angle * Math.PI) / 180;
        const x = 24 + 14 * Math.cos(rad);
        const y = 24 + 14 * Math.sin(rad);
        const colors = ['#ef4444', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6'];
        return (
          <g key={i}>
            <circle cx={x} cy={y} r="4" fill={colors[i]} />
            <circle cx={x} cy={y - 2} r="1.5" fill="#ffffff" opacity="0.5" />
          </g>
        );
      })}
      {/* Linhas de conexao */}
      {[0, 60, 120, 180, 240, 300].map((angle, i) => {
        const rad = (angle * Math.PI) / 180;
        const x = 24 + 14 * Math.cos(rad);
        const y = 24 + 14 * Math.sin(rad);
        return (
          <line
            key={`line-${i}`}
            x1="24"
            y1="24"
            x2={x}
            y2={y}
            stroke="#60a5fa"
            strokeWidth="1.5"
            strokeDasharray="2 2"
            opacity="0.6"
          />
        );
      })}
      {/* Conexoes entre pessoas externas */}
      <circle cx="24" cy="24" r="14" stroke="#60a5fa" strokeWidth="1" fill="none" opacity="0.3" strokeDasharray="4 4" />
      {/* Numero 10 */}
      <text x="24" y="43" textAnchor="middle" fill="#60a5fa" fontSize="6" fontWeight="bold">10+</text>
    </svg>
  );
}
