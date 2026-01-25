// ==========================================
// HOME PAGE - Landing + LoL-Style Lobby
// ==========================================

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import LevelBadge from '../../components/common/LevelBadge/LevelBadge';
import BugReportModal from '../../components/common/BugReportModal/BugReportModal';
import { getRankColor } from '../../utils/helpers';
import { ActiveRooms } from '../../components/home/ActiveRooms';
import { MiniLeaderboard } from '../../components/home/MiniLeaderboard';
import { Changelog } from '../../components/home/Changelog';
import './Home.css';

interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  avatarUrl?: string;
  eloRating: number;
  gamesWon: number;
}

export default function Home() {
  const navigate = useNavigate();
  const { user, isAuthenticated, login, logout, authError, clearAuthError } = useAuth();
  const { socket, isConnected } = useSocket();
  const [topPlayers, setTopPlayers] = useState<LeaderboardEntry[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(true);
  const [onlineCount, setOnlineCount] = useState(0);
  const [showBugReport, setShowBugReport] = useState(false);

  // Fetch top 5 players for landing page
  useEffect(() => {
    if (!isAuthenticated) {
      fetchTopPlayers();
    }
  }, [isAuthenticated]);

  // Fetch online count via REST (no socket needed)
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
    if (isAuthenticated) {
      fetchOnlineCount();
      const interval = setInterval(fetchOnlineCount, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, fetchOnlineCount]);

  // Also listen for socket broadcasts if connected
  useEffect(() => {
    if (!socket || !isConnected) return;
    const handler = (data: { total: number; inQueue: number }) => {
      setOnlineCount(data.total);
    };
    socket.on('onlineCount', handler);
    return () => { socket.off('onlineCount', handler); };
  }, [socket, isConnected]);

  const fetchTopPlayers = async () => {
    try {
      const response = await fetch('/api/leaderboard?period=all_time&limit=5');
      const data = await response.json();
      if (response.ok && data.entries) {
        setTopPlayers(data.entries.slice(0, 5));
      }
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
    } finally {
      setLoadingLeaderboard(false);
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return '\u{1F947}';
    if (rank === 2) return '\u{1F948}';
    if (rank === 3) return '\u{1F949}';
    return `#${rank}`;
  };

  const handleMultiplayerClick = () => {
    if (!isAuthenticated) {
      login();
    } else {
      navigate('/multiplayer');
    }
  };

  // ==========================================
  // LANDING PAGE (Non-Authenticated)
  // ==========================================
  if (!isAuthenticated) {
    return (
      <div className="landing-container">
        {authError && (
          <div className="auth-error-banner">
            <span>{authError}</span>
            <button className="auth-error-close" onClick={clearAuthError}>X</button>
          </div>
        )}
        <div className="landing-hero">
          <h1 className="game-title">
            BANG<br />SHOT
          </h1>
          <p className="subtitle">Um jogo de vida ou morte</p>

          <div className="landing-buttons">
            <button className="main-btn" onClick={() => navigate('/singleplayer')}>
              JOGAR SOLO
            </button>
            <button className="main-btn primary" onClick={login}>
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              ENTRAR E JOGAR MULTIPLAYER
            </button>
          </div>
        </div>

        {/* Leaderboard Preview */}
        <div className="landing-leaderboard">
          <h2 className="leaderboard-title">TOP JOGADORES</h2>

          {loadingLeaderboard ? (
            <div className="loading-message">Carregando...</div>
          ) : topPlayers.length > 0 ? (
            <div className="leaderboard-preview">
              {topPlayers.map((player) => (
                <div key={player.userId} className={`preview-entry rank-${player.rank}`}>
                  <span className="preview-rank">{getRankIcon(player.rank)}</span>
                  <div className="preview-avatar">
                    {player.avatarUrl ? (
                      <img src={player.avatarUrl} alt={player.displayName} />
                    ) : (
                      player.displayName.charAt(0).toUpperCase()
                    )}
                  </div>
                  <span className="preview-name">{player.displayName}</span>
                  <span className="preview-elo">{player.eloRating} ELO</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-players">Seja o primeiro a entrar no ranking!</p>
          )}

          <button className="view-full-btn" onClick={() => navigate('/leaderboard')}>
            Ver Ranking Completo
          </button>
        </div>

        <div className="landing-features">
          <div className="feature">
            <span className="feature-icon">&#127919;</span>
            <span className="feature-text">Partidas Ranqueadas</span>
          </div>
          <div className="feature">
            <span className="feature-icon">&#128202;</span>
            <span className="feature-text">Sistema de ELO</span>
          </div>
          <div className="feature">
            <span className="feature-icon">&#127942;</span>
            <span className="feature-text">Leaderboards</span>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // LOBBY PAGE (Authenticated) - LoL Style
  // ==========================================

  return (
    <div className="lobby-container">
      {/* ===== HEADER ===== */}
      <header className="lobby-header">
        <div className="lobby-header__left">
          <span className="lobby-header__logo">BANG SHOT</span>
          <button className="lobby-header__play-btn" onClick={handleMultiplayerClick}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M8 5v14l11-7z" fill="currentColor"/>
            </svg>
            JOGAR
          </button>
        </div>

        <nav className="lobby-header__nav">
          <button className="lobby-nav-item" onClick={() => navigate('/profile')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            <span>Perfil</span>
          </button>
          <button className="lobby-nav-item" onClick={() => navigate('/history')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            <span>Historico</span>
          </button>
          <button className="lobby-nav-item" onClick={() => navigate('/achievements')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="8" r="7"/>
              <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>
            </svg>
            <span>Conquistas</span>
          </button>
          <button className="lobby-nav-item" onClick={() => navigate('/leaderboard')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="20" x2="18" y2="10"/>
              <line x1="12" y1="20" x2="12" y2="4"/>
              <line x1="6" y1="20" x2="6" y2="14"/>
            </svg>
            <span>Ranking</span>
          </button>
          {user?.isAdmin && (
            <button className="lobby-nav-item lobby-nav-item--admin" onClick={() => navigate('/admin')}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
              <span>Admin</span>
            </button>
          )}
        </nav>

        <div className="lobby-header__right">
          <div className="lobby-online-count">
            <span className="online-dot" />
            <span>{onlineCount} online</span>
          </div>
          <button
            className="lobby-bug-btn"
            onClick={() => setShowBugReport(true)}
            title="Reportar Bug"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M8 2l1.88 1.88M14.12 3.88L16 2M9 7.13v-1a3 3 0 0 1 6 0v1"/>
              <path d="M12 20c-3.3 0-6-2.7-6-6v-3a6 6 0 0 1 12 0v3c0 3.3-2.7 6-6 6z"/>
              <path d="M12 20v2M6 13H2M22 13h-4M6 17l-2 2M18 17l2 2"/>
            </svg>
          </button>
          <div className="lobby-header__user" onClick={() => navigate('/profile')}>
            <div className="lobby-header__avatar-wrapper">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.displayName} className="lobby-header__avatar" />
              ) : (
                <div className="lobby-header__avatar lobby-header__avatar--placeholder">
                  {user?.displayName.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="lobby-header__level-badge">
                <LevelBadge totalXp={user?.totalXp || 0} size="sm" />
              </div>
            </div>
            <div className="lobby-header__user-info">
              <span className="lobby-header__username">{user?.displayName}</span>
              <span className="lobby-header__rank" style={{ color: getRankColor(user?.rank || '') }}>
                {user?.rank}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* ===== MAIN BODY ===== */}
      <main className="lobby-body">
        {/* Left Column - Active Rooms */}
        <section className="lobby-body__left">
          <ActiveRooms />
        </section>

        {/* Right Column - Leaderboard + Changelog */}
        <section className="lobby-body__right">
          <MiniLeaderboard />
          <Changelog />
        </section>
      </main>

      {/* ===== FOOTER ===== */}
      <footer className="lobby-footer">
        <span className="lobby-footer__version">Bang Shot v1.0</span>
        <button className="lobby-footer__logout" onClick={logout}>
          Sair
        </button>
      </footer>

      {/* Bug Report Modal */}
      <BugReportModal
        isOpen={showBugReport}
        onClose={() => setShowBugReport(false)}
      />
    </div>
  );
}
