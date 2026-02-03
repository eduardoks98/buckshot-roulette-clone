// Achievement: Sobrevivente - Sobreviva a 10 rodadas
import { IconProps, getIconSize } from '../Icon';

export function SurvivorIcon({ size = 'md', className, style, title }: IconProps) {
  const s = getIconSize(size);

  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      style={style}
      aria-label={title || 'Sobrevivente'}
    >
      {/* Escudo */}
      <path
        d="M24 4L8 12L8 24C8 36 24 44 24 44C24 44 40 36 40 24L40 12L24 4Z"
        fill="#3b82f6"
      />
      <path
        d="M24 8L12 14L12 24C12 32 24 40 24 40C24 40 36 32 36 24L36 14L24 8Z"
        fill="#60a5fa"
      />
      {/* Coracao no centro */}
      <path
        d="M24 18C24 18 20 14 16 18C12 22 16 28 24 34C32 28 36 22 32 18C28 14 24 18 24 18Z"
        fill="#ef4444"
      />
      <path
        d="M24 20C24 20 22 18 19 20C16 22 19 26 24 30C29 26 32 22 29 20C26 18 24 20 24 20Z"
        fill="#fca5a5"
        opacity="0.5"
      />
      {/* Brilho do escudo */}
      <path
        d="M14 16L14 20"
        stroke="#93c5fd"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.6"
      />
    </svg>
  );
}
