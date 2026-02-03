// Achievement: Primeiro Sangue - Consiga sua primeira eliminacao
import { IconProps, getIconSize } from '../Icon';

export function FirstBloodIcon({ size = 'md', className, style, title }: IconProps) {
  const s = getIconSize(size);

  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      style={style}
      aria-label={title || 'Primeiro Sangue'}
    >
      {/* Espada */}
      <path
        d="M32 6L42 16L26 32L22 28L32 6Z"
        fill="#9ca3af"
      />
      <path
        d="M22 28L26 32L20 38L16 34L22 28Z"
        fill="#6b7280"
      />
      <path
        d="M16 34L20 38L14 44L10 40L16 34Z"
        fill="#4b5563"
      />
      {/* Gota de sangue */}
      <path
        d="M14 8C14 8 8 18 8 24C8 30 11 34 17 34C23 34 26 30 26 24C26 18 20 8 20 8C20 8 17 14 17 14C17 14 14 8 14 8Z"
        fill="#ef4444"
      />
      <path
        d="M12 22C12 22 10 26 10 28C10 30 11 31 13 31C15 31 16 30 16 28C16 26 14 22 14 22L12 22Z"
        fill="#fca5a5"
        opacity="0.6"
      />
    </svg>
  );
}
