import { IconProps, getIconSize } from '../Icon';

// Cores fixas do emoji de pessoas 👥
const PERSON_BLUE = '#4285F4';
const PERSON_DARK_BLUE = '#1565C0';
const PERSON_LIGHT_BLUE = '#64B5F6';
const PERSON_BACK = '#90CAF9';

export function PlayersIcon({ size, className, style, title }: IconProps) {
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

      {/* Pessoa de trás - cabeça (mais clara) */}
      <circle cx="17" cy="6" r="3.5" fill={PERSON_BACK} />
      <circle cx="17" cy="6" r="2" fill={PERSON_DARK_BLUE} opacity="0.3" />

      {/* Pessoa de trás - olhos */}
      <circle cx="15.8" cy="5.5" r="0.5" fill="#1a1a1a" />
      <circle cx="18.2" cy="5.5" r="0.5" fill="#1a1a1a" />

      {/* Pessoa de trás - corpo */}
      <path
        d="M13 21V18C13 15.5 14.5 13 17 13C19.5 13 21 15.5 21 18V21H13Z"
        fill={PERSON_BACK}
      />
      <path
        d="M14.5 21V18C14.5 16 15.5 14 17 14C18.5 14 19.5 16 19.5 18V21H14.5Z"
        fill={PERSON_DARK_BLUE}
        opacity="0.2"
      />

      {/* Pessoa da frente - cabeça (mais escura/principal) */}
      <circle cx="8" cy="7" r="4" fill={PERSON_BLUE} />
      <circle cx="8" cy="7" r="2.5" fill={PERSON_DARK_BLUE} opacity="0.2" />

      {/* Pessoa da frente - olhos */}
      <circle cx="6.5" cy="6.5" r="0.8" fill="#1a1a1a" />
      <circle cx="9.5" cy="6.5" r="0.8" fill="#1a1a1a" />
      <circle cx="6.7" cy="6.3" r="0.25" fill="white" opacity="0.8" />
      <circle cx="9.7" cy="6.3" r="0.25" fill="white" opacity="0.8" />

      {/* Pessoa da frente - corpo */}
      <path
        d="M2 22V19C2 15.5 4.5 12 8 12C11.5 12 14 15.5 14 19V22H2Z"
        fill={PERSON_BLUE}
      />

      {/* Interior do corpo */}
      <path
        d="M4 22V19C4 16.5 5.5 14 8 14C10.5 14 12 16.5 12 19V22H4Z"
        fill={PERSON_DARK_BLUE}
        opacity="0.2"
      />

      {/* Brilho na cabeça */}
      <ellipse cx="6" cy="5" rx="1.5" ry="1" fill="white" opacity="0.4" />

      {/* Detalhes do corpo - gola */}
      <path
        d="M6 12.5C7 12 9 12 10 12.5"
        stroke={PERSON_LIGHT_BLUE}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
