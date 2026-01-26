// ==========================================
// PROFILE PAGE
// ==========================================

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getTitleById } from '@shared/constants/achievements';
import { PageLayout } from '../../components/layout/PageLayout';
import XpBar from '../../components/common/XpBar/XpBar';
import LevelBadge from '../../components/common/LevelBadge/LevelBadge';
import { LoadingState } from '../../components/common/LoadingState';
import { getRankColor, calculateWinRate, calculateKD } from '../../utils/helpers';
import './Profile.css';

interface UserTitleEntry {
  titleId: string;
  name: string;
  description: string;
  icon: string;
  period: string;
  awardedAt: string;
  expiresAt: string | null;
  isSelected: boolean;
}

export default function Profile() {
  const navigate = useNavigate();
  const { user, isLoading, login, token } = useAuth();
  const [titles, setTitles] = useState<UserTitleEntry[]>([]);
  const [showTitleSelector, setShowTitleSelector] = useState(false);
  const [titleLoading, setTitleLoading] = useState(false);

  const handleGoogleLogin = () => {
    login();
  };

  const fetchTitles = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/achievements/titles', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTitles(data.titles || []);
      }
    } catch {
      // silently fail
    }
  }, [token]);

  useEffect(() => {
    if (user) fetchTitles();
  }, [user, fetchTitles]);

  const handleSelectTitle = async (titleId: string | null) => {
    if (!token) return;
    setTitleLoading(true);
    try {
      const res = await fetch('/api/achievements/title', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ titleId }),
      });
      if (res.ok) {
        await fetchTitles();
        setShowTitleSelector(false);
      }
    } catch {
      // silently fail
    } finally {
      setTitleLoading(false);
    }
  };

  const getActiveTitleInfo = () => {
    if (!user?.active_title_id) return null;
    return getTitleById(user.active_title_id) || null;
  };

  // Loading state
  if (isLoading) {
    return (
      <PageLayout>
        <LoadingState message="Carregando perfil..." />
      </PageLayout>
    );
  }

  // Not logged in - show login page without PageLayout header/footer
  if (!user) {
    return (
      <div className="profile-container profile-container--login">
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
        </div>
      </div>
    );
  }

  // Logged in
  const winRate = calculateWinRate(user.games_won, user.games_played).toFixed(1);
  const kd = calculateKD(user.total_kills, user.total_deaths);

  return (
    <PageLayout>
      <div className="profile-content">
        <h1 className="page-title">PERFIL</h1>

        {/* User Card */}
        <div className="user-card">
          <div className="user-avatar">
            {user.avatar_url ? (
              <img src={user.avatar_url} alt={user.display_name || ''} />
            ) : (
              user.display_name?.charAt(0)?.toUpperCase() || '?'
            )}
          </div>
          <div className="user-info">
            <h2 className="user-name">{user.display_name}</h2>
            <span className="user-username">@{user.username}</span>
            {(() => {
              const titleInfo = getActiveTitleInfo();
              return titleInfo ? (
                <span className="user-active-title" onClick={() => setShowTitleSelector(true)}>
                  {titleInfo.icon} {titleInfo.name}
                </span>
              ) : titles.length > 0 ? (
                <button className="user-set-title" onClick={() => setShowTitleSelector(true)}>
                  Selecionar titulo
                </button>
              ) : null;
            })()}
          </div>
          <div
            className="user-rank"
            style={{ borderColor: getRankColor(user.rank) }}
          >
            <span className="rank-label">Rank</span>
            <span className="rank-value" style={{ color: getRankColor(user.rank) }}>
              {user.rank}
            </span>
            <span className="elo-value">{user.elo_rating} ELO</span>
          </div>
        </div>

        {/* XP / Level Section */}
        <div className="xp-section">
          <div className="xp-section-header">
            <LevelBadge totalXp={user.total_xp} size="lg" />
            <div className="xp-section-info">
              <span className="xp-total">{user.total_xp.toLocaleString()} XP Total</span>
            </div>
          </div>
          <XpBar totalXp={user.total_xp} size="lg" showLevel={false} />
        </div>

        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-value">{user.games_played}</span>
            <span className="stat-label">Partidas</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{user.games_won}</span>
            <span className="stat-label">Vitorias</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{winRate}%</span>
            <span className="stat-label">Win Rate</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{user.rounds_won}</span>
            <span className="stat-label">Rodadas</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{user.total_kills}</span>
            <span className="stat-label">Kills</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{kd}</span>
            <span className="stat-label">K/D</span>
          </div>
        </div>

        {/* Title Selector Modal */}
        {showTitleSelector && (
          <div className="title-selector-overlay" onClick={() => setShowTitleSelector(false)}>
            <div className="title-selector-modal" onClick={e => e.stopPropagation()}>
              <h3 className="title-selector-header">Selecionar Titulo</h3>
              <div className="title-selector-list">
                <button
                  className={`title-selector-item ${!user.active_title_id ? 'selected' : ''}`}
                  onClick={() => handleSelectTitle(null)}
                  disabled={titleLoading}
                >
                  <span className="title-selector-item__icon">-</span>
                  <div className="title-selector-item__info">
                    <span className="title-selector-item__name">Sem titulo</span>
                    <span className="title-selector-item__desc">Remover titulo ativo</span>
                  </div>
                </button>
                {titles.map(t => (
                  <button
                    key={t.titleId}
                    className={`title-selector-item ${t.isSelected ? 'selected' : ''}`}
                    onClick={() => handleSelectTitle(t.titleId)}
                    disabled={titleLoading}
                  >
                    <span className="title-selector-item__icon">{t.icon}</span>
                    <div className="title-selector-item__info">
                      <span className="title-selector-item__name">{t.name}</span>
                      <span className="title-selector-item__desc">{t.description}</span>
                    </div>
                    <span className="title-selector-item__period">
                      {t.period === 'WEEKLY' ? 'Semanal' : t.period === 'MONTHLY' ? 'Mensal' : 'Geral'}
                    </span>
                  </button>
                ))}
              </div>
              {titles.length === 0 && (
                <p className="title-selector-empty">
                  Voce ainda nao conquistou nenhum titulo. Continue jogando!
                </p>
              )}
              <button className="title-selector-close" onClick={() => setShowTitleSelector(false)}>
                Fechar
              </button>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
