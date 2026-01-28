// ==========================================
// HEADER - Componente de header reutilizável
// ==========================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useOnlineCount } from '../../../hooks';
import LevelBadge from '../../common/LevelBadge/LevelBadge';
import BugReportModal from '../../common/BugReportModal/BugReportModal';
import { SoundControl } from '../../common/SoundControl';
import { getRankColor } from '../../../utils/helpers';
import {
  BackArrowIcon,
  ProfileIcon,
  HistoryIcon,
  AchievementIcon,
  LeaderboardIcon,
  SettingsIcon,
  BugIcon,
} from '../../icons';
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
          <BackArrowIcon size={20} />
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
            <ProfileIcon size={20} />
            <span>Perfil</span>
          </button>
          <button className="app-nav-item" onClick={() => navigate('/history')}>
            <HistoryIcon size={20} />
            <span>Historico</span>
          </button>
          <button className="app-nav-item" onClick={() => navigate('/achievements')}>
            <AchievementIcon size={20} />
            <span>Conquistas</span>
          </button>
          <button className="app-nav-item" onClick={() => navigate('/leaderboard')}>
            <LeaderboardIcon size={20} />
            <span>Ranking</span>
          </button>
          {user?.is_admin && (
            <button className="app-nav-item app-nav-item--admin" onClick={() => navigate('/admin')}>
              <SettingsIcon size={20} />
              <span>Admin</span>
            </button>
          )}
        </nav>

        <div className="app-header__right">
          <div className="app-header__online">
            <span className="online-dot" />
            <span className="online-count">{onlineCount}</span>
            <span className="online-label">online</span>
          </div>
          <SoundControl />
          <button
            className="app-header__bug-btn"
            onClick={() => setShowBugReport(true)}
            title="Reportar Bug"
          >
            <BugIcon size={18} />
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
