// ==========================================
// PROFILE PAGE - Redesigned
// ==========================================

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getTitleById } from '@shared/constants/achievements';
import { getDisplayRank } from '@shared/utils/rankingCalculator';
import { PageLayout, InlineAd } from '../../components/layout/PageLayout';
import XpBar from '../../components/common/XpBar/XpBar';
import LevelBadge from '../../components/common/LevelBadge/LevelBadge';
import { LoadingState } from '../../components/common/LoadingState';
import { LogoutIcon } from '../../components/icons';
import { getRankColor, calculateWinRate, calculateKD, formatDate } from '../../utils/helpers';
import './Profile.css';

// Types
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

interface RecentGame {
  id: string;
  roomCode: string;
  createdAt: string;
  position: number | null;
  kills: number;
  damageDealt: number;
  roundsWon: number;
  eloChange: number | null;
  xpEarned: number | null;
  opponents: { displayName: string }[];
}

interface GameParticipant {
  userId: string | null;
  displayName: string;
  position: number | null;
  roundsWon: number;
  kills: number;
  deaths: number;
  damageDealt: number;
  damageTaken: number;
  selfDamage: number;
  shotsFired: number;
  itemsUsed: number;
  eloChange: number | null;
  xpEarned: number | null;
  eloRating: number | null;
}

interface GameDetails {
  id: string;
  roomCode: string;
  createdAt: string;
  endedAt: string | null;
  totalRounds: number;
  winner: { id: string; displayName: string } | null;
  participants: GameParticipant[];
}

interface RecentStats {
  recentForm: ('W' | 'L')[];
  currentStreak: number;
  bestStreak: number;
  averageKills: number;
  averageDamageDealt: number;
}

export default function Profile() {
  const navigate = useNavigate();
  const { user, isLoading, logout, token } = useAuth();
  const [titles, setTitles] = useState<UserTitleEntry[]>([]);
  const [showTitleSelector, setShowTitleSelector] = useState(false);
  const [titleLoading, setTitleLoading] = useState(false);
  const [recentGames, setRecentGames] = useState<RecentGame[]>([]);
  const [recentStats, setRecentStats] = useState<RecentStats | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedGame, setSelectedGame] = useState<GameDetails | null>(null);
  const [gameDetailsLoading, setGameDetailsLoading] = useState(false);

  // Fetch titles
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

  // Fetch recent games
  const fetchRecentGames = useCallback(async () => {
    if (!token) return;
    setHistoryLoading(true);
    try {
      const [historyRes, statsRes] = await Promise.all([
        fetch('/api/history?page=1&limit=5', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/history/stats', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (historyRes.ok) {
        const data = await historyRes.json();
        setRecentGames(data.data || []);
      }

      if (statsRes.ok) {
        const stats = await statsRes.json();
        setRecentStats(stats);
      }
    } catch {
      // silently fail
    } finally {
      setHistoryLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      fetchTitles();
      fetchRecentGames();
    }
  }, [user, fetchTitles, fetchRecentGames]);

  // Fetch game details
  const fetchGameDetails = async (gameId: string) => {
    if (!token) return;
    setGameDetailsLoading(true);
    try {
      const res = await fetch(`/api/history/${gameId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedGame(data);
      }
    } catch {
      // silently fail
    } finally {
      setGameDetailsLoading(false);
    }
  };

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

  // Calculated values
  const winRate = calculateWinRate(user.games_won, user.games_played).toFixed(1);
  const kd = calculateKD(user.total_kills, user.total_deaths);
  const displayRank = getDisplayRank(
    (user.tier || 'Bronze') as 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond' | 'Master' | 'Grandmaster' | 'Challenger',
    user.division as 1 | 2 | 3 | 4 | null
  );

  return (
    <PageLayout title="Perfil">
      <div className="profile-content">

        {/* User Header - Compact Horizontal Layout */}
        <div className="profile-header">
          <div className="profile-header__left">
            <div className="profile-avatar">
              {user.avatar_url ? (
                <img src={user.avatar_url} alt={user.display_name || ''} />
              ) : (
                user.display_name?.charAt(0)?.toUpperCase() || '?'
              )}
            </div>
            <div className="profile-info">
              <h2 className="profile-name">{user.display_name}</h2>
              <span className="profile-username">@{user.username}</span>
              {(() => {
                const titleInfo = getActiveTitleInfo();
                return titleInfo ? (
                  <span className="profile-title" onClick={() => setShowTitleSelector(true)}>
                    {titleInfo.icon} {titleInfo.name}
                  </span>
                ) : titles.length > 0 ? (
                  <button className="profile-set-title" onClick={() => setShowTitleSelector(true)}>
                    Selecionar titulo
                  </button>
                ) : null;
              })()}
            </div>
          </div>
          <div className="profile-header__right">
            <div className="profile-rank" style={{ borderColor: getRankColor(user.tier || user.rank) }}>
              <span className="profile-rank__value" style={{ color: getRankColor(user.tier || user.rank) }}>
                {displayRank}
              </span>
              <span className="profile-rank__lp">{user.lp || 0} LP</span>
            </div>
          </div>
        </div>

        {/* XP / Level Section - More Compact */}
        <div className="profile-xp">
          <div className="profile-xp__header">
            <LevelBadge totalXp={user.total_xp} size="md" />
            <span className="profile-xp__total">{user.total_xp.toLocaleString()} XP</span>
          </div>
          <XpBar totalXp={user.total_xp} size="md" showLevel={false} />
        </div>

        {/* Stats Grid - 6 columns on larger screens */}
        <div className="profile-stats">
          <div className="profile-stat">
            <span className="profile-stat__value">{user.games_played}</span>
            <span className="profile-stat__label">Partidas</span>
          </div>
          <div className="profile-stat">
            <span className="profile-stat__value">{user.games_won}</span>
            <span className="profile-stat__label">Vitorias</span>
          </div>
          <div className="profile-stat">
            <span className="profile-stat__value">{winRate}%</span>
            <span className="profile-stat__label">Win Rate</span>
          </div>
          <div className="profile-stat">
            <span className="profile-stat__value">{user.rounds_won}</span>
            <span className="profile-stat__label">Rodadas</span>
          </div>
          <div className="profile-stat">
            <span className="profile-stat__value">{user.total_kills}</span>
            <span className="profile-stat__label">Kills</span>
          </div>
          <div className="profile-stat">
            <span className="profile-stat__value">{kd}</span>
            <span className="profile-stat__label">K/D</span>
          </div>
        </div>

        {/* Inline Ad */}
        <InlineAd position="inline-top" />

        {/* Recent Form & Streak */}
        {recentStats && recentStats.recentForm.length > 0 && (
          <div className="profile-form">
            <div className="profile-form__recent">
              <span className="profile-form__label">Forma Recente</span>
              <div className="profile-form__icons">
                {recentStats.recentForm.slice(0, 10).map((result, i) => (
                  <span key={i} className={`profile-form__icon ${result === 'W' ? 'win' : 'loss'}`}>
                    {result}
                  </span>
                ))}
              </div>
            </div>
            <div className="profile-form__streaks">
              <div className="profile-form__streak">
                <span className="profile-form__streak-value">{recentStats.currentStreak}</span>
                <span className="profile-form__streak-label">Atual</span>
              </div>
              <div className="profile-form__streak">
                <span className="profile-form__streak-value">{recentStats.bestStreak}</span>
                <span className="profile-form__streak-label">Melhor</span>
              </div>
            </div>
          </div>
        )}

        {/* Recent Games */}
        <div className="profile-history">
          <div className="profile-history__header">
            <h3 className="profile-history__title">Partidas Recentes</h3>
            <button className="profile-history__see-all" onClick={() => navigate('/history')}>
              Ver todas
            </button>
          </div>

          {historyLoading ? (
            <div className="profile-history__loading">Carregando...</div>
          ) : recentGames.length === 0 ? (
            <div className="profile-history__empty">
              Nenhuma partida ainda. Jogue sua primeira!
            </div>
          ) : (
            <div className="profile-history__list">
              {recentGames.map(game => {
                const isWin = game.position === 1;
                const totalPlayers = (game.opponents?.length || 0) + 1;

                return (
                  <div
                    key={game.id}
                    className={`profile-game ${isWin ? 'win' : 'loss'}`}
                    onClick={() => fetchGameDetails(game.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className={`profile-game__position ${isWin ? 'winner' : ''}`}>
                      {game.position === 1 ? '🥇' : game.position === totalPlayers ? `#${game.position}` : `#${game.position}`}
                    </div>
                    <div className="profile-game__info">
                      <span className="profile-game__date">{formatDate(game.createdAt)}</span>
                      <span className="profile-game__opponents">
                        vs {game.opponents?.slice(0, 2).map(o => o.displayName).join(', ')}
                        {(game.opponents?.length || 0) > 2 && ` +${(game.opponents?.length || 0) - 2}`}
                      </span>
                    </div>
                    <div className="profile-game__stats">
                      <span className="profile-game__stat">💀{game.kills}</span>
                      <span className="profile-game__stat">💥{game.damageDealt}</span>
                    </div>
                    {game.eloChange !== null && (
                      <div className={`profile-game__elo ${game.eloChange >= 0 ? 'positive' : 'negative'}`}>
                        {game.eloChange >= 0 ? '+' : ''}{game.eloChange}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Logout Button */}
        <button className="profile-logout" onClick={logout}>
          <LogoutIcon size={16} />
          Sair
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

        {/* Game Details Modal */}
        {(selectedGame || gameDetailsLoading) && (
          <div className="game-details-overlay" onClick={() => setSelectedGame(null)}>
            <div className="game-details-modal" onClick={e => e.stopPropagation()}>
              {gameDetailsLoading ? (
                <div className="game-details-loading">Carregando detalhes...</div>
              ) : selectedGame && (
                <>
                  <div className="game-details-header">
                    <h3 className="game-details-title">Detalhes da Partida</h3>
                    <span className="game-details-date">{formatDate(selectedGame.createdAt)}</span>
                  </div>

                  {selectedGame.winner && (
                    <div className="game-details-winner">
                      🏆 Vencedor: <strong>{selectedGame.winner.displayName}</strong>
                    </div>
                  )}

                  <div className="game-details-participants">
                    <h4 className="game-details-subtitle">Participantes</h4>
                    <div className="participants-table">
                      <div className="participants-header">
                        <span className="p-col p-pos">#</span>
                        <span className="p-col p-name">Jogador</span>
                        <span className="p-col p-stat">K</span>
                        <span className="p-col p-stat">D</span>
                        <span className="p-col p-stat">Dano</span>
                        <span className="p-col p-stat">Tiros</span>
                        <span className="p-col p-elo">ELO</span>
                      </div>
                      {selectedGame.participants
                        .sort((a, b) => (a.position || 99) - (b.position || 99))
                        .map((p, i) => (
                          <div
                            key={i}
                            className={`participant-row ${p.position === 1 ? 'winner' : ''} ${p.userId === user?.id ? 'is-me' : ''}`}
                          >
                            <span className="p-col p-pos">
                              {p.position === 1 ? '🥇' : p.position ? `#${p.position}` : '-'}
                            </span>
                            <span className="p-col p-name">{p.displayName}</span>
                            <span className="p-col p-stat">{p.kills}</span>
                            <span className="p-col p-stat">{p.deaths}</span>
                            <span className="p-col p-stat">{p.damageDealt}</span>
                            <span className="p-col p-stat">{p.shotsFired}</span>
                            <span className="p-col p-elo">
                              {p.eloChange !== null && (
                                <span className={p.eloChange >= 0 ? 'positive' : 'negative'}>
                                  {p.eloChange >= 0 ? '+' : ''}{p.eloChange}
                                </span>
                              )}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>

                  <button className="game-details-close" onClick={() => setSelectedGame(null)}>
                    Fechar
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
