// ==========================================
// PROFILE PAGE
// ==========================================

import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Profile.css';

export default function Profile() {
  const navigate = useNavigate();
  const { user, isLoading, login, logout } = useAuth();

  const handleGoogleLogin = () => {
    login();
  };

  const handleLogout = () => {
    logout();
  };

  const getRankColor = (rank: string) => {
    const colors: Record<string, string> = {
      Bronze: '#cd7f32',
      Silver: '#c0c0c0',
      Gold: '#ffd700',
      Platinum: '#e5e4e2',
      Diamond: '#b9f2ff',
      Master: '#ff6b6b',
      Grandmaster: '#ff4757',
    };
    return colors[rank] || '#c0c0c0';
  };

  if (isLoading) {
    return (
      <div className="profile-container">
        <div className="loading-message">Carregando...</div>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <div className="profile-container">
        <button className="back-btn" onClick={() => navigate('/')}>
          Voltar
        </button>

        <h1 className="page-title">PERFIL</h1>

        <div className="login-section">
          <div className="login-icon">🎯</div>
          <h2>Entre para jogar ranqueado!</h2>
          <p>
            Faca login com sua conta Google para:
          </p>
          <ul className="benefits-list">
            <li>Salvar seu progresso</li>
            <li>Aparecer no leaderboard</li>
            <li>Jogar partidas ranqueadas</li>
            <li>Acompanhar suas estatisticas</li>
          </ul>

          <button className="google-login-btn" onClick={handleGoogleLogin}>
            <svg viewBox="0 0 24 24" className="google-icon">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Entrar com Google
          </button>

          <p className="guest-note">
            Ou continue como convidado para jogar sem conta
          </p>
        </div>
      </div>
    );
  }

  // Logged in
  const winRate = user.gamesPlayed > 0
    ? ((user.gamesWon / user.gamesPlayed) * 100).toFixed(1)
    : '0';

  const kd = user.totalDeaths > 0
    ? (user.totalKills / user.totalDeaths).toFixed(2)
    : user.totalKills.toString();

  return (
    <div className="profile-container">
      <button className="back-btn" onClick={() => navigate('/')}>
        Voltar
      </button>

      <h1 className="page-title">PERFIL</h1>

      {/* User Card */}
      <div className="user-card">
        <div className="user-avatar">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.displayName} />
          ) : (
            user.displayName.charAt(0).toUpperCase()
          )}
        </div>
        <div className="user-info">
          <h2 className="user-name">{user.displayName}</h2>
          <span className="user-username">@{user.username}</span>
        </div>
        <div
          className="user-rank"
          style={{ borderColor: getRankColor(user.rank) }}
        >
          <span className="rank-label">Rank</span>
          <span className="rank-value" style={{ color: getRankColor(user.rank) }}>
            {user.rank}
          </span>
          <span className="elo-value">{user.eloRating} ELO</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-value">{user.gamesPlayed}</span>
          <span className="stat-label">Partidas</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{user.gamesWon}</span>
          <span className="stat-label">Vitorias</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{winRate}%</span>
          <span className="stat-label">Win Rate</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{user.roundsWon}</span>
          <span className="stat-label">Rodadas</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{user.totalKills}</span>
          <span className="stat-label">Kills</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{kd}</span>
          <span className="stat-label">K/D</span>
        </div>
      </div>

      {/* Actions */}
      <div className="profile-actions">
        <button className="action-btn leaderboard" onClick={() => navigate('/leaderboard')}>
          Ver Leaderboard
        </button>
        <button className="action-btn logout" onClick={handleLogout}>
          Sair da Conta
        </button>
      </div>
    </div>
  );
}
