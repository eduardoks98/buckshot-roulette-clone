import { IconProps, getIconSize } from '../Icon';

// Cores fixas do emoji de seringa 💉
const SYRINGE_SILVER = '#C0C0C0';
const SYRINGE_DARK = '#909090';
const LIQUID_GREEN = '#4CAF50';
const LIQUID_DARK_GREEN = '#388E3C';
const NEEDLE_GRAY = '#757575';

export function AdrenalineIcon({ size, className, style, title }: IconProps) {
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
      <rect x="6" y="5" width="12" height="14" rx="2" fill="#1a1a1a" opacity="0.2" />

      {/* Corpo da seringa - prata */}
      <rect x="6" y="4" width="12" height="14" rx="2" fill={SYRINGE_SILVER} />

      {/* Interior escuro (vidro) */}
      <rect x="8" y="6" width="8" height="10" rx="1" fill="#1a1a1a" opacity="0.7" />

      {/* Líquido verde dentro */}
      <rect x="8" y="10" width="8" height="6" rx="1" fill={LIQUID_GREEN} />
      <rect x="8" y="12" width="8" height="4" rx="1" fill={LIQUID_DARK_GREEN} opacity="0.4" />

      {/* Marcações de dosagem */}
      <line x1="8" y1="8" x2="10" y2="8" stroke={SYRINGE_SILVER} strokeWidth="0.8" />
      <line x1="8" y1="10" x2="11" y2="10" stroke={SYRINGE_SILVER} strokeWidth="0.8" />
      <line x1="8" y1="12" x2="10" y2="12" stroke="white" strokeWidth="0.8" opacity="0.5" />
      <line x1="8" y1="14" x2="11" y2="14" stroke="white" strokeWidth="0.8" opacity="0.5" />

      {/* Êmbolo superior - prata */}
      <rect x="10" y="1" width="4" height="4" rx="1" fill={SYRINGE_SILVER} />
      <rect x="10.5" y="1.5" width="3" height="3" rx="0.5" fill={SYRINGE_DARK} opacity="0.4" />

      {/* Agulha - cinza */}
      <path
        d="M11 18L11 22L13 22L13 18"
        fill={NEEDLE_GRAY}
      />
      <path
        d="M11.5 20L12.5 20L12.5 22L12 23L11.5 22L11.5 20Z"
        fill={NEEDLE_GRAY}
      />

      {/* Detalhe da agulha */}
      <line x1="12" y1="18" x2="12" y2="22" stroke="#1a1a1a" strokeWidth="0.5" opacity="0.5" />

      {/* Brilho no vidro */}
      <ellipse cx="9" cy="8" rx="0.8" ry="2" fill="white" opacity="0.4" />

      {/* Detalhes do êmbolo */}
      <rect x="11" y="4" width="2" height="1" fill={SYRINGE_DARK} />

      {/* Brilho no líquido */}
      <ellipse cx="10" cy="13" rx="0.5" ry="1" fill="white" opacity="0.3" />
    </svg>
  );
}
