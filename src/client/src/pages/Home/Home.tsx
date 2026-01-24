import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
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
  const { user, isAuthenticated, login, logout } = useAuth();
  const [topPlayers, setTopPlayers] = useState<LeaderboardEntry[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(true);

  // Fetch top 5 players for landing page
  useEffect(() => {
    if (!isAuthenticated) {
      fetchTopPlayers();
    }
  }, [isAuthenticated]);

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
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const handleMultiplayerClick = () => {
    if (!isAuthenticated) {
      // Show login prompt or redirect to profile
      login();
    } else {
      navigate('/multiplayer');
    }
  };

  // Landing page for non-authenticated users
  if (!isAuthenticated) {
    return (
      <div className="landing-container">
        <div className="landing-hero">
          <h1 className="game-title">
            BUCKSHOT<br />ROULETTE
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
            <span className="feature-icon">🎯</span>
            <span className="feature-text">Partidas Ranqueadas</span>
          </div>
          <div className="feature">
            <span className="feature-icon">📊</span>
            <span className="feature-text">Sistema de ELO</span>
          </div>
          <div className="feature">
            <span className="feature-icon">🏆</span>
            <span className="feature-text">Leaderboards</span>
          </div>
        </div>
      </div>
    );
  }

  // Logged in user view
  return (
    <div className="home-container">
      <div className="home-content">
        <h1 className="game-title">
          BUCKSHOT<br />ROULETTE
        </h1>
        <p className="subtitle">Um jogo de vida ou morte</p>

        <div className="menu-buttons">
          <button
            className="main-btn"
            onClick={() => navigate('/singleplayer')}
          >
            JOGAR SOLO
          </button>

          <button
            className="main-btn"
            onClick={handleMultiplayerClick}
          >
            MULTIPLAYER
          </button>

          <button
            className="main-btn secondary"
            onClick={() => navigate('/leaderboard')}
          >
            RANKING
          </button>
        </div>

        <div className="auth-section">
          <div className="user-info">
            <img
              src={user?.avatarUrl || '/default-avatar.png'}
              alt={user?.displayName}
              className="user-avatar"
              onClick={() => navigate('/profile')}
              style={{ cursor: 'pointer' }}
            />
            <span className="user-name">{user?.displayName}</span>
            <span className="user-rank">{user?.rank} • {user?.eloRating} ELO</span>
            <button className="logout-btn" onClick={logout} title="Sair">
              Sair
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
