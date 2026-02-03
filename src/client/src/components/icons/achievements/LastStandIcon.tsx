// Achievement: Ultima Chance - Venca com apenas 1 HP restante
import { IconProps, getIconSize } from '../Icon';

export function LastStandIcon({ size = 'md', className, style, title }: IconProps) {
  const s = getIconSize(size);

  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      style={style}
      aria-label={title || 'Ultima Chance'}
    >
      {/* Coracao em chamas */}
      <path
        d="M24 40C24 40 8 30 8 18C8 10 14 6 20 10C22 12 24 14 24 14C24 14 26 12 28 10C34 6 40 10 40 18C40 30 24 40 24 40Z"
        fill="#ef4444"
      />
      <path
        d="M24 36C24 36 12 28 12 18C12 12 16 10 20 12C22 14 24 16 24 16C24 16 26 14 28 12C32 10 36 12 36 18C36 28 24 36 24 36Z"
        fill="#fca5a5"
        opacity="0.5"
      />
      {/* Chamas */}
      <path
        d="M18 8C18 8 16 4 18 0C18 0 20 4 20 6C20 6 22 2 24 4C24 4 22 8 20 10C20 10 18 8 18 8Z"
        fill="#f97316"
      />
      <path
        d="M28 10C28 10 26 6 28 2C28 2 30 6 30 8C30 8 32 4 34 6C34 6 32 10 30 12C30 12 28 10 28 10Z"
        fill="#f97316"
      />
      <path
        d="M22 6C22 6 24 2 26 4C26 4 24 6 24 8L22 6Z"
        fill="#fbbf24"
      />
      {/* Numero 1 HP */}
      <text x="24" y="28" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="bold">1</text>
      {/* Rachadura */}
      <path
        d="M24 20L22 24L26 26L24 30"
        stroke="#7f1d1d"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.5"
      />
      {/* Brilho */}
      <path
        d="M32 14C32 14 34 16 34 18"
        stroke="#fecaca"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.6"
      />
    </svg>
  );
}
