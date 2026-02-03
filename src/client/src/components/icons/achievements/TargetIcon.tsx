import { IconProps, getIconSize } from '../Icon';

// Cores fixas do emoji de alvo 🎯
const TARGET_RED = '#E53935';
const TARGET_WHITE = '#FFFFFF';
const TARGET_DARK_RED = '#C62828';

export function TargetIcon({ size, className, style, title }: IconProps) {
  const s = getIconSize(size);
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      style={style}
      aria-hidden={!title}
      role={title ? 'img' : undefined}
    >
      {title && <title>{title}</title>}

      {/* Sombra de fundo */}
      <circle cx="12" cy="13" r="10" fill="#1a1a1a" opacity="0.2" />

      {/* Anel externo - vermelho */}
      <circle cx="12" cy="12" r="10" fill={TARGET_RED} />

      {/* Anel branco */}
      <circle cx="12" cy="12" r="8" fill={TARGET_WHITE} />

      {/* Anel vermelho médio */}
      <circle cx="12" cy="12" r="6" fill={TARGET_RED} />

      {/* Anel branco interno */}
      <circle cx="12" cy="12" r="4" fill={TARGET_WHITE} />

      {/* Centro - bullseye vermelho */}
      <circle cx="12" cy="12" r="2" fill={TARGET_RED} />

      {/* Centro escuro */}
      <circle cx="12" cy="12" r="0.8" fill={TARGET_DARK_RED} />

      {/* Brilho no centro */}
      <circle cx="11.5" cy="11.5" r="0.4" fill="white" opacity="0.6" />

      {/* Brilhos no alvo */}
      <ellipse cx="8" cy="8" rx="1.5" ry="1" fill="white" opacity="0.3" />
      <ellipse cx="15" cy="9" rx="1" ry="0.6" fill="white" opacity="0.2" />
    </svg>
  );
}
