// Achievement: Imbativel - Venca 10 partidas seguidas
import { IconProps, getIconSize } from '../Icon';

export function UnbeatableIcon({ size = 'md', className, style, title }: IconProps) {
  const s = getIconSize(size);

  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      style={style}
      aria-label={title || 'Imbativel'}
    >
      {/* Chamas em sequencia */}
      {/* Chama 1 */}
      <path
        d="M8 44C8 44 4 36 6 30C8 24 12 26 12 30C12 30 14 24 16 28C18 32 14 44 8 44Z"
        fill="#f97316"
      />
      <path
        d="M9 42C9 42 6 36 7 32C8 28 10 29 10 32C10 32 11 28 12 30C13 32 11 42 9 42Z"
        fill="#fbbf24"
      />
      {/* Chama 2 */}
      <path
        d="M18 42C18 42 14 32 16 24C18 16 24 20 24 26C24 26 26 18 30 24C34 30 28 42 18 42Z"
        fill="#ef4444"
      />
      <path
        d="M20 40C20 40 16 32 18 26C20 20 24 22 24 28C24 28 26 22 28 26C30 30 26 40 20 40Z"
        fill="#f97316"
      />
      <path
        d="M22 38C22 38 20 32 21 28C22 24 24 26 24 30C24 30 26 26 27 28C28 30 26 38 22 38Z"
        fill="#fbbf24"
      />
      {/* Chama 3 */}
      <path
        d="M32 44C32 44 28 36 30 30C32 24 36 26 36 30C36 30 38 24 40 28C42 32 38 44 32 44Z"
        fill="#f97316"
      />
      <path
        d="M33 42C33 42 30 36 31 32C32 28 34 29 34 32C34 32 35 28 36 30C37 32 35 42 33 42Z"
        fill="#fbbf24"
      />
      {/* Numero 10 */}
      <text x="24" y="14" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="bold">10</text>
      {/* Estrelas ao redor */}
      <path d="M6 12L7 14L9 14L7.5 15.5L8 18L6 16.5L4 18L4.5 15.5L3 14L5 14L6 12Z" fill="#fbbf24" opacity="0.8" />
      <path d="M42 12L43 14L45 14L43.5 15.5L44 18L42 16.5L40 18L40.5 15.5L39 14L41 14L42 12Z" fill="#fbbf24" opacity="0.8" />
      <path d="M24 4L25 6L27 6L25.5 7.5L26 10L24 8.5L22 10L22.5 7.5L21 6L23 6L24 4Z" fill="#fbbf24" />
    </svg>
  );
}
