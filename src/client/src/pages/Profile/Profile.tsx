// ==========================================
// PROFILE PAGE
// ==========================================

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getTitleById } from '@shared/constants/achievements';
import { PageLayout, InlineAd } from '../../components/layout/PageLayout';
import XpBar from '../../components/common/XpBar/XpBar';
import LevelBadge from '../../components/common/LevelBadge/LevelBadge';
import { LoadingState } from '../../components/common/LoadingState';
import { getRankColor, calculateWinRate, calculateKD } from '../../utils/helpers';
import './Profile.css';

// SVG icons
const LogoutIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

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
  const { user, isLoading, login: _login, logout, token } = useAuth();
  const [titles, setTitles] = useState<UserTitleEntry[]>([]);
  const [showTitleSelector, setShowTitleSelector] = useState(false);
  const [titleLoading, setTitleLoading] = useState(false);

  // Google login is handled directly via login() from useAuth
  // const handleGoogleLogin = () => { login(); };

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
      <PageLayout title="Perfil">
        <LoadingState message="Carregando perfil..." />
      </PageLayout>
    );
  }

  // Not logged in - redirect to home
  if (!user) {
    navigate('/');
    return null;
  }

  // Logged in
  const winRate = calculateWinRate(user.games_won, user.games_played).toFixed(1);
  const kd = calculateKD(user.total_kills, user.total_deaths);

  return (
    <PageLayout title="Perfil">
      <div className="profile-content">

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

        {/* Inline Ad - visible on smaller screens */}
        <InlineAd position="inline-top" />

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

        {/* Inline Ad - bottom */}
        <InlineAd position="inline-bottom" />

        {/* Logout Button */}
        <button className="action-btn logout" onClick={logout}>
          <LogoutIcon />
          Sair da Conta
        </button>

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
