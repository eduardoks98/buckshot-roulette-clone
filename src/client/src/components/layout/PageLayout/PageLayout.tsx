// ==========================================
// PAGE LAYOUT - Componente de layout padronizado
// ==========================================

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useSocket } from '../../../context/SocketContext';
import LevelBadge from '../../common/LevelBadge/LevelBadge';
import BugReportModal from '../../common/BugReportModal/BugReportModal';
import { AdByPosition } from '../../common/AdBanner';
import { getRankColor } from '../../../utils/helpers';
import './PageLayout.css';

interface PageLayoutProps {
  children: React.ReactNode;
  showHeader?: boolean;
  showFooter?: boolean;
}

export function PageLayout({
  children,
  showHeader = true,
  showFooter = true,
}: PageLayoutProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { socket, isConnected } = useSocket();
  const [onlineCount, setOnlineCount] = useState(0);
  const [showBugReport, setShowBugReport] = useState(false);

  // Fetch online count via REST
  const fetchOnlineCount = useCallback(async () => {
    try {
      const res = await fetch('/api/online');
      if (res.ok) {
        const data = await res.json();
        setOnlineCount(data.total);
      }
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    fetchOnlineCount();
    const interval = setInterval(fetchOnlineCount, 30000);
    return () => clearInterval(interval);
  }, [fetchOnlineCount]);

  // Also listen for socket broadcasts if connected
  useEffect(() => {
    if (!socket || !isConnected) return;
    const handler = (data: { total: number; inQueue: number }) => {
      setOnlineCount(data.total);
    };
    socket.on('onlineCount', handler);
    return () => { socket.off('onlineCount', handler); };
  }, [socket, isConnected]);

  const handleMultiplayerClick = () => {
    navigate('/multiplayer');
  };

  return (
    <div className="page-layout">
      {/* ===== HEADER ===== */}
      {showHeader && (
        <header className="page-header">
          <div className="page-header__left">
            <span className="page-header__logo" onClick={() => navigate('/')}>BANG SHOT</span>
            <button className="page-header__play-btn" onClick={handleMultiplayerClick}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M8 5v14l11-7z" fill="currentColor"/>
              </svg>
              JOGAR
            </button>
          </div>

          <nav className="page-header__nav">
            <button className="page-nav-item" onClick={() => navigate('/profile')}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              <span>Perfil</span>
            </button>
            <button className="page-nav-item" onClick={() => navigate('/history')}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
              <span>Historico</span>
            </button>
            <button className="page-nav-item" onClick={() => navigate('/achievements')}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="8" r="7"/>
                <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>
              </svg>
              <span>Conquistas</span>
            </button>
            <button className="page-nav-item" onClick={() => navigate('/leaderboard')}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="20" x2="18" y2="10"/>
                <line x1="12" y1="20" x2="12" y2="4"/>
                <line x1="6" y1="20" x2="6" y2="14"/>
              </svg>
              <span>Ranking</span>
            </button>
            {user?.isAdmin && (
              <button className="page-nav-item page-nav-item--admin" onClick={() => navigate('/admin')}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                </svg>
                <span>Admin</span>
              </button>
            )}
          </nav>

          <div className="page-header__right">
            <div className="page-online-count">
              <span className="online-dot" />
              <span>{onlineCount} online</span>
            </div>
            <button
              className="page-bug-btn"
              onClick={() => setShowBugReport(true)}
              title="Reportar Bug"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M8 2l1.88 1.88M14.12 3.88L16 2M9 7.13v-1a3 3 0 0 1 6 0v1"/>
                <path d="M12 20c-3.3 0-6-2.7-6-6v-3a6 6 0 0 1 12 0v3c0 3.3-2.7 6-6 6z"/>
                <path d="M12 20v2M6 13H2M22 13h-4M6 17l-2 2M18 17l2 2"/>
              </svg>
            </button>
            <div className="page-header__user" onClick={() => navigate('/profile')}>
              <div className="page-header__avatar-wrapper">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.displayName} className="page-header__avatar" />
                ) : (
                  <div className="page-header__avatar page-header__avatar--placeholder">
                    {user?.displayName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="page-header__level-badge">
                  <LevelBadge totalXp={user?.totalXp || 0} size="sm" />
                </div>
              </div>
              <div className="page-header__user-info">
                <span className="page-header__username">{user?.displayName}</span>
                <span className="page-header__rank" style={{ color: getRankColor(user?.rank || '') }}>
                  {user?.rank}
                </span>
              </div>
            </div>
          </div>
        </header>
      )}

      {/* ===== AD BANNER (TOP) ===== */}
      <div className="ad-container-header">
        <AdByPosition position="header" gameId="bangshot" />
      </div>

      {/* ===== MAIN CONTENT ===== */}
      <main className="page-content">
        {children}
      </main>

      {/* ===== AD BANNER (BOTTOM) ===== */}
      <div className="ad-container-footer">
        <AdByPosition position="footer" gameId="bangshot" />
      </div>

      {/* ===== FOOTER ===== */}
      {showFooter && (
        <footer className="page-footer">
          <span className="page-footer__version">Bang Shot v1.0</span>
          <button className="page-footer__logout" onClick={logout}>
            Sair
          </button>
        </footer>
      )}

      {/* Bug Report Modal */}
      <BugReportModal
        isOpen={showBugReport}
        onClose={() => setShowBugReport(false)}
      />
    </div>
  );
}

export default PageLayout;
