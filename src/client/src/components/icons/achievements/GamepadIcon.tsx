import { IconProps, getIconSize } from '../Icon';

// Cores fixas do emoji de controle 🎮
const GAMEPAD_DARK = '#333333';
const GAMEPAD_GRAY = '#555555';
const BUTTON_RED = '#E53935';
const BUTTON_GREEN = '#43A047';
const BUTTON_BLUE = '#1E88E5';
const BUTTON_YELLOW = '#FDD835';
const DPAD_GRAY = '#444444';

export function GamepadIcon({ size, className, style, title }: IconProps) {
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
        d="M4 8H20C21.5 8 23 9.5 23 11V17C23 18.5 21.5 20 20 20H4C2.5 20 1 18.5 1 17V11C1 9.5 2.5 8 4 8Z"
        fill="#1a1a1a"
        opacity="0.3"
      />

      {/* Corpo do controle - cinza escuro */}
      <path
        d="M4 7H20C21.5 7 23 8.5 23 10V16C23 17.5 21.5 19 20 19H4C2.5 19 1 17.5 1 16V10C1 8.5 2.5 7 4 7Z"
        fill={GAMEPAD_DARK}
      />

      {/* Interior mais escuro */}
      <path
        d="M5 9H19C20 9 21 10 21 11V15C21 16 20 17 19 17H5C4 17 3 16 3 15V11C3 10 4 9 5 9Z"
        fill="#1a1a1a"
        opacity="0.4"
      />

      {/* D-pad - cruz direcional */}
      <rect x="5" y="11" width="6" height="4" rx="0.5" fill={DPAD_GRAY} />
      <rect x="6.5" y="9.5" width="3" height="7" rx="0.5" fill={DPAD_GRAY} />

      {/* D-pad - centro escuro */}
      <rect x="7" y="12" width="2" height="2" fill="#222222" />

      {/* Botões de ação - coloridos como Xbox/PlayStation */}
      {/* Botão verde (cima) */}
      <circle cx="16" cy="11" r="1.5" fill={BUTTON_GREEN} />
      <circle cx="15.7" cy="10.7" r="0.4" fill="white" opacity="0.4" />

      {/* Botão azul (direita) */}
      <circle cx="19" cy="13" r="1.5" fill={BUTTON_BLUE} />
      <circle cx="18.7" cy="12.7" r="0.4" fill="white" opacity="0.4" />

      {/* Botão vermelho (baixo) */}
      <circle cx="16" cy="15" r="1.5" fill={BUTTON_RED} />
      <circle cx="15.7" cy="14.7" r="0.4" fill="white" opacity="0.4" />

      {/* Botão amarelo (esquerda) */}
      <circle cx="13" cy="13" r="1.5" fill={BUTTON_YELLOW} />
      <circle cx="12.7" cy="12.7" r="0.4" fill="white" opacity="0.4" />

      {/* Analógico */}
      <circle cx="8" cy="13" r="1.2" fill={GAMEPAD_GRAY} />
      <circle cx="8" cy="13" r="0.6" fill="#222222" />

      {/* Botões superiores - gatilhos */}
      <rect x="4" y="5" width="4" height="2" rx="1" fill={GAMEPAD_GRAY} />
      <rect x="16" y="5" width="4" height="2" rx="1" fill={GAMEPAD_GRAY} />

      {/* Brilho no corpo */}
      <path
        d="M5 8C7 7.5 10 7 12 7"
        stroke="white"
        strokeWidth="0.8"
        strokeLinecap="round"
        opacity="0.2"
      />

      {/* LED indicador - verde */}
      <circle cx="12" cy="17.5" r="0.8" fill={BUTTON_GREEN} />
      <circle cx="12" cy="17.5" r="0.4" fill="white" opacity="0.6" />
    </svg>
  );
}
