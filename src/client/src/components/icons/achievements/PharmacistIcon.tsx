// Achievement: Farmaceutico - Sobreviva ao remedio vencido 10 vezes
import { IconProps, getIconSize } from '../Icon';

export function PharmacistIcon({ size = 'md', className, style, title }: IconProps) {
  const s = getIconSize(size);

  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      style={style}
      aria-label={title || 'Farmaceutico'}
    >
      {/* Frasco */}
      <rect x="14" y="16" width="20" height="28" rx="3" fill="#22c55e" />
      <rect x="16" y="18" width="16" height="24" rx="2" fill="#4ade80" />
      {/* Tampa */}
      <rect x="18" y="8" width="12" height="10" rx="2" fill="#6b7280" />
      <rect x="16" y="14" width="16" height="4" rx="1" fill="#9ca3af" />
      {/* Liquido venenoso */}
      <path
        d="M16 30L32 30L32 40C32 41 31 42 30 42L18 42C17 42 16 41 16 40L16 30Z"
        fill="#15803d"
        opacity="0.7"
      />
      {/* Caveira no frasco */}
      <circle cx="24" cy="32" r="5" fill="#fef3c7" />
      <circle cx="22" cy="31" r="1.5" fill="#1f2937" />
      <circle cx="26" cy="31" r="1.5" fill="#1f2937" />
      <path d="M22 35L24 34L26 35" stroke="#1f2937" strokeWidth="1" strokeLinecap="round" />
      {/* Borbulhas */}
      <circle cx="20" cy="26" r="1" fill="#86efac" opacity="0.8" />
      <circle cx="26" cy="24" r="1.5" fill="#86efac" opacity="0.6" />
      <circle cx="28" cy="28" r="1" fill="#86efac" opacity="0.7" />
      {/* Fumaca toxica */}
      <path
        d="M20 6C20 6 18 4 20 2"
        stroke="#a3e635"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.6"
      />
      <path
        d="M24 4C24 4 22 2 24 0"
        stroke="#a3e635"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.6"
      />
      <path
        d="M28 6C28 6 26 4 28 2"
        stroke="#a3e635"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.6"
      />
    </svg>
  );
}
