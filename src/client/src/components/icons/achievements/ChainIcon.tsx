import { IconProps, getIconSize } from '../Icon';

// Cores fixas do emoji de corrente ⛓️
const CHAIN_SILVER = '#A0A0A0';
const CHAIN_DARK = '#707070';
const CHAIN_LIGHT = '#C0C0C0';

export function ChainIcon({ size, className, style, title }: IconProps) {
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
      <path
        d="M2 10C2 8 3.5 6 6 6H8C10.5 6 12 8 12 10V16C12 18 10.5 20 8 20H6C3.5 20 2 18 2 16V10Z"
        fill="#1a1a1a"
        opacity="0.2"
      />

      {/* Elo esquerdo - externo */}
      <path
        d="M2 9C2 7 3.5 5 6 5H8C10.5 5 12 7 12 9V15C12 17 10.5 19 8 19H6C3.5 19 2 17 2 15V9Z"
        fill={CHAIN_SILVER}
      />

      {/* Elo esquerdo - interior escuro */}
      <path
        d="M4 9C4 8 5 7 6.5 7H7.5C9 7 10 8 10 9V15C10 16 9 17 7.5 17H6.5C5 17 4 16 4 15V9Z"
        fill="#1a1a1a"
      />

      {/* Elo direito - externo */}
      <path
        d="M12 9C12 7 13.5 5 16 5H18C20.5 5 22 7 22 9V15C22 17 20.5 19 18 19H16C13.5 19 12 17 12 15V9Z"
        fill={CHAIN_SILVER}
      />

      {/* Elo direito - interior escuro */}
      <path
        d="M14 9C14 8 15 7 16.5 7H17.5C19 7 20 8 20 9V15C20 16 19 17 17.5 17H16.5C15 17 14 16 14 15V9Z"
        fill="#1a1a1a"
      />

      {/* Conexão central - onde os elos se entrelaçam */}
      <rect x="10" y="10" width="4" height="4" fill={CHAIN_LIGHT} />
      <rect x="10.5" y="10.5" width="3" height="3" fill="#1a1a1a" opacity="0.5" />

      {/* Detalhes metálicos - rebites */}
      <circle cx="5" cy="8" r="1" fill={CHAIN_LIGHT} />
      <circle cx="5" cy="8" r="0.5" fill={CHAIN_DARK} />
      <circle cx="9" cy="8" r="1" fill={CHAIN_LIGHT} />
      <circle cx="9" cy="8" r="0.5" fill={CHAIN_DARK} />
      <circle cx="5" cy="16" r="1" fill={CHAIN_LIGHT} />
      <circle cx="5" cy="16" r="0.5" fill={CHAIN_DARK} />
      <circle cx="9" cy="16" r="1" fill={CHAIN_LIGHT} />
      <circle cx="9" cy="16" r="0.5" fill={CHAIN_DARK} />

      <circle cx="15" cy="8" r="1" fill={CHAIN_LIGHT} />
      <circle cx="15" cy="8" r="0.5" fill={CHAIN_DARK} />
      <circle cx="19" cy="8" r="1" fill={CHAIN_LIGHT} />
      <circle cx="19" cy="8" r="0.5" fill={CHAIN_DARK} />
      <circle cx="15" cy="16" r="1" fill={CHAIN_LIGHT} />
      <circle cx="15" cy="16" r="0.5" fill={CHAIN_DARK} />
      <circle cx="19" cy="16" r="1" fill={CHAIN_LIGHT} />
      <circle cx="19" cy="16" r="0.5" fill={CHAIN_DARK} />

      {/* Brilhos metálicos */}
      <path d="M3 10L4 11" stroke="white" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
      <path d="M13 10L14 11" stroke="white" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
    </svg>
  );
}
