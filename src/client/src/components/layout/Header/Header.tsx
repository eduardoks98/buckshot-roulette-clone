// ==========================================
// HEADER - Componente de header reutilizável
// ==========================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useOnlineCount } from '../../../hooks';
import LevelBadge from '../../common/LevelBadge/LevelBadge';
import BugReportModal from '../../common/BugReportModal/BugReportModal';
import { getRankColor } from '../../../utils/helpers';
import './Header.css';

interface HeaderProps {
  variant?: 'full' | 'simple';
}

export function Header({ variant = 'full' }: HeaderProps) {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const onlineCount = useOnlineCount();
  const [showBugReport, setShowBugReport] = useState(false);

  // Header simples para páginas legais (não logado)
  if (variant === 'simple') {
    return (
      <header className="app-header app-header--simple">
        <button className="app-header__back" onClick={() => navigate(-1)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          <span>Voltar</span>
        </button>
        <span className="app-header__logo" onClick={() => navigate('/')}>
          BANG SHOT
        </span>
        {isAuthenticated ? (
          <button className="app-header__action-btn" onClick={() => navigate('/')}>
            Lobby
          </button>
        ) : (
          <button className="app-header__action-btn" onClick={() => navigate('/')}>
            Entrar
          </button>
        )}
      </header>
    );
  }

  // Header completo para usuários logados
  return (
    <>
      <header className="app-header">
        <div className="app-header__left">
          <span className="app-header__logo" onClick={() => navigate('/')}>BANG SHOT</span>
        </div>

        <nav className="app-header__nav">
          <button className="app-nav-item" onClick={() => navigate('/profile')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            <span>Perfil</span>
          </button>
          <button className="app-nav-item" onClick={() => navigate('/history')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            <span>Historico</span>
          </button>
          <button className="app-nav-item" onClick={() => navigate('/achievements')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="8" r="7"/>
              <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>
            </svg>
            <span>Conquistas</span>
          </button>
          <button className="app-nav-item" onClick={() => navigate('/leaderboard')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="20" x2="18" y2="10"/>
              <line x1="12" y1="20" x2="12" y2="4"/>
              <line x1="6" y1="20" x2="6" y2="14"/>
            </svg>
            <span>Ranking</span>
          </button>
          {user?.is_admin && (
            <button className="app-nav-item app-nav-item--admin" onClick={() => navigate('/admin')}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
              <span>Admin</span>
            </button>
          )}
        </nav>

        <div className="app-header__right">
          <div className="app-header__online">
            <span className="online-dot" />
            <span>{onlineCount} online</span>
          </div>
          <button
            className="app-header__bug-btn"
            onClick={() => setShowBugReport(true)}
            title="Reportar Bug"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M8 2l1.88 1.88M14.12 3.88L16 2M9 7.13v-1a3 3 0 0 1 6 0v1"/>
              <path d="M12 20c-3.3 0-6-2.7-6-6v-3a6 6 0 0 1 12 0v3c0 3.3-2.7 6-6 6z"/>
              <path d="M12 20v2M6 13H2M22 13h-4M6 17l-2 2M18 17l2 2"/>
            </svg>
          </button>
          <div className="app-header__user" onClick={() => navigate('/profile')}>
            <div className="app-header__avatar-wrapper">
              {user?.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.display_name}
                  className="app-header__avatar"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const placeholder = e.currentTarget.nextElementSibling as HTMLElement;
                    if (placeholder) placeholder.style.display = 'flex';
                  }}
                />
              ) : null}
              <div
                className="app-header__avatar app-header__avatar--placeholder"
                style={{ display: user?.avatar_url ? 'none' : 'flex' }}
              >
                {user?.display_name?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <div className="app-header__level-badge">
                <LevelBadge totalXp={user?.total_xp || 0} size="sm" />
              </div>
            </div>
            <div className="app-header__user-info">
              <span className="app-header__username">{user?.display_name}</span>
              <span className="app-header__rank" style={{ color: getRankColor(user?.rank || '') }}>
                {user?.rank}
              </span>
            </div>
          </div>
        </div>
      </header>

      <BugReportModal
        isOpen={showBugReport}
        onClose={() => setShowBugReport(false)}
      />
    </>
  );
}

export default Header;
