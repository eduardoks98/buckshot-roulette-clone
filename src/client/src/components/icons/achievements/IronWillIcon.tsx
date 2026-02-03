// Achievement: Vontade de Ferro - Sobreviva a 100 rodadas
import { IconProps, getIconSize } from '../Icon';

export function IronWillIcon({ size = 'md', className, style, title }: IconProps) {
  const s = getIconSize(size);

  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      style={style}
      aria-label={title || 'Vontade de Ferro'}
    >
      {/* Braco de ferro */}
      <path
        d="M8 36L16 28L20 32L14 42L8 36Z"
        fill="#6b7280"
      />
      {/* Antebraco */}
      <path
        d="M16 28L28 20L32 24L20 32L16 28Z"
        fill="#9ca3af"
      />
      {/* Biceps flexionado */}
      <path
        d="M28 8C28 8 36 8 40 14C44 20 42 28 36 30C30 32 28 28 28 24L28 8Z"
        fill="#9ca3af"
      />
      <path
        d="M30 12C30 12 36 12 38 16C40 20 38 26 34 27C30 28 30 25 30 22L30 12Z"
        fill="#d1d5db"
      />
      {/* Punho cerrado */}
      <path
        d="M28 20L34 16L40 20L36 26L28 24L28 20Z"
        fill="#9ca3af"
      />
      {/* Detalhes mecanicos */}
      <circle cx="12" cy="38" r="2" fill="#4b5563" />
      <circle cx="18" cy="30" r="2" fill="#4b5563" />
      <circle cx="30" cy="22" r="2" fill="#4b5563" />
      {/* Brilho metalico */}
      <path
        d="M32 10L34 12"
        stroke="#e5e7eb"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.8"
      />
      {/* Parafusos */}
      <circle cx="36" cy="18" r="1.5" fill="#374151" />
      <circle cx="24" cy="26" r="1.5" fill="#374151" />
    </svg>
  );
}
