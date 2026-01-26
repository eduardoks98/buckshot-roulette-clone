// ==========================================
// REVOLVER SIDE VIEW - SVG Component for lateral view animation
// ==========================================

import './RevolverSideView.css';

export interface RevolverSideViewProps {
  size?: 'sm' | 'md' | 'lg';
  cylinderOpen?: boolean;
  className?: string;
}

const SIZES = {
  sm: { width: 200, height: 112 },
  md: { width: 280, height: 158 },
  lg: { width: 360, height: 202 },
};

export function RevolverSideView({
  size = 'lg',
  cylinderOpen = false,
  className = '',
}: RevolverSideViewProps) {
  const { width, height } = SIZES[size];

  return (
    <svg
      viewBox="0 0 320 180"
      width={width}
      height={height}
      className={`revolver-side-view ${className}`}
      style={{ overflow: 'visible' }}
    >
      <defs>
        {/* Metal gradient for barrel and frame */}
        <linearGradient id="metalGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#5a5a5a" />
          <stop offset="30%" stopColor="#3d3d3d" />
          <stop offset="70%" stopColor="#2a2a2a" />
          <stop offset="100%" stopColor="#3a3a3a" />
        </linearGradient>

        {/* Cylinder gradient */}
        <linearGradient id="cylinderGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4a4a4a" />
          <stop offset="40%" stopColor="#353535" />
          <stop offset="100%" stopColor="#404040" />
        </linearGradient>

        {/* Wood gradient for grip */}
        <linearGradient id="woodGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8B5A2B" />
          <stop offset="30%" stopColor="#6B4423" />
          <stop offset="70%" stopColor="#5D3A1A" />
          <stop offset="100%" stopColor="#4A2F15" />
        </linearGradient>

        {/* Barrel hole gradient */}
        <radialGradient id="barrelHole" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#0a0a0a" />
          <stop offset="100%" stopColor="#1a1a1a" />
        </radialGradient>

        {/* Highlight for metallic shine */}
        <linearGradient id="metalHighlight" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.15)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
      </defs>

      {/* ===== BARREL (Cano) ===== */}
      <g className="revolver-barrel">
        {/* Main barrel body */}
        <rect
          x="85"
          y="58"
          width="175"
          height="28"
          rx="3"
          ry="3"
          fill="url(#metalGradient)"
        />
        {/* Barrel top highlight */}
        <rect
          x="85"
          y="58"
          width="175"
          height="8"
          rx="3"
          ry="3"
          fill="url(#metalHighlight)"
        />
        {/* Barrel front sight */}
        <rect x="255" y="52" width="6" height="6" rx="1" fill="#444" />
        {/* Barrel hole (muzzle) */}
        <circle cx="262" cy="72" r="8" fill="url(#barrelHole)" />
        {/* Barrel underside detail */}
        <rect x="85" y="82" width="170" height="4" fill="#252525" />
      </g>

      {/* ===== FRAME (Armacao) ===== */}
      <g className="revolver-frame">
        {/* Main frame body */}
        <path
          d="M130,72
             L230,72
             L235,78
             L235,95
             L225,110
             L200,115
             L180,115
             L165,105
             L130,105
             Z"
          fill="url(#metalGradient)"
        />
        {/* Frame top detail */}
        <path
          d="M130,72 L230,72 L235,78 L235,82 L130,82 Z"
          fill="url(#metalHighlight)"
        />
      </g>

      {/* ===== CYLINDER (Tambor) - Animated part ===== */}
      <g
        className={`revolver-cylinder-group ${cylinderOpen ? 'open' : ''}`}
        style={{ transformOrigin: '100px 88px' }}
      >
        {/* Cylinder crane (eixo que conecta ao frame) */}
        <rect x="125" y="78" width="15" height="20" rx="2" fill="#3a3a3a" />

        {/* Main cylinder body */}
        <ellipse
          cx="100"
          cy="88"
          rx="38"
          ry="34"
          fill="url(#cylinderGradient)"
          className="cylinder-body"
        />

        {/* Cylinder flutes (grooves) */}
        <ellipse cx="100" cy="88" rx="30" ry="26" fill="none" stroke="#2a2a2a" strokeWidth="2" />
        <ellipse cx="100" cy="88" rx="22" ry="18" fill="none" stroke="#333" strokeWidth="1" />

        {/* Chamber holes visible from side */}
        <ellipse cx="80" cy="72" rx="7" ry="9" fill="#1a1a1a" />
        <ellipse cx="100" cy="68" rx="7" ry="9" fill="#1a1a1a" />
        <ellipse cx="120" cy="72" rx="7" ry="9" fill="#1a1a1a" />
        <ellipse cx="80" cy="100" rx="7" ry="9" fill="#151515" />
        <ellipse cx="100" cy="106" rx="7" ry="9" fill="#151515" />
        <ellipse cx="120" cy="100" rx="7" ry="9" fill="#151515" />

        {/* Cylinder center pin */}
        <circle cx="100" cy="88" r="8" fill="#2a2a2a" />
        <circle cx="100" cy="88" r="4" fill="#1a1a1a" />

        {/* Cylinder edge highlight */}
        <ellipse
          cx="100"
          cy="88"
          rx="38"
          ry="34"
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="1"
        />
      </g>

      {/* ===== TRIGGER GUARD (Guarda do Gatilho) ===== */}
      <g className="revolver-trigger-guard">
        <path
          d="M185,108
             Q175,135 195,138
             Q215,138 210,115"
          fill="none"
          stroke="url(#metalGradient)"
          strokeWidth="5"
          strokeLinecap="round"
        />
      </g>

      {/* ===== TRIGGER (Gatilho) ===== */}
      <rect
        x="193"
        y="112"
        width="5"
        height="18"
        rx="1"
        fill="#333"
        className="revolver-trigger"
      />

      {/* ===== HAMMER (Cao) ===== */}
      <g className="revolver-hammer">
        <rect x="225" y="52" width="14" height="18" rx="3" fill="#444" />
        <rect x="227" y="48" width="10" height="8" rx="2" fill="#3a3a3a" />
        {/* Hammer serrations */}
        <rect x="228" y="49" width="8" height="1" fill="#555" />
        <rect x="228" y="51" width="8" height="1" fill="#555" />
        <rect x="228" y="53" width="8" height="1" fill="#555" />
      </g>

      {/* ===== GRIP (Cabo) ===== */}
      <g className="revolver-grip">
        {/* Main grip shape */}
        <path
          d="M215,100
             L240,100
             L248,108
             L252,160
             L245,168
             L220,168
             L212,160
             L212,115
             Z"
          fill="url(#woodGradient)"
        />
        {/* Grip panel lines */}
        <path
          d="M220,105 L220,163"
          stroke="rgba(0,0,0,0.3)"
          strokeWidth="1"
        />
        <path
          d="M230,105 L235,163"
          stroke="rgba(0,0,0,0.3)"
          strokeWidth="1"
        />
        <path
          d="M240,108 L243,163"
          stroke="rgba(0,0,0,0.2)"
          strokeWidth="1"
        />
        {/* Grip highlight */}
        <path
          d="M215,100 L225,100 L225,115 L215,115 Z"
          fill="rgba(255,255,255,0.08)"
        />
        {/* Grip medallion */}
        <circle cx="232" cy="135" r="8" fill="#5D3A1A" stroke="#4A2F15" strokeWidth="2" />
        <circle cx="232" cy="135" r="4" fill="#6B4423" />
      </g>

      {/* ===== AMBIENT GLOW (when cylinder is open) ===== */}
      {cylinderOpen && (
        <ellipse
          cx="100"
          cy="88"
          rx="50"
          ry="45"
          fill="none"
          stroke="rgba(212, 164, 24, 0.3)"
          strokeWidth="2"
          className="cylinder-glow"
        />
      )}
    </svg>
  );
}

export default RevolverSideView;
