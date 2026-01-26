// ==========================================
// HISTORY PAGE
// ==========================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { PageLayout, InlineAd } from '../../components/layout/PageLayout';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { formatDate } from '../../utils/helpers';
import './History.css';

// ==========================================
// TYPES
// ==========================================

interface GameHistoryEntry {
  id: string;
  roomCode: string;
  status: string;
  createdAt: string;
  endedAt: string | null;
  totalRounds: number;
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
  opponents: {
    displayName: string;
    position: number | null;
    eloRating: number;
  }[];
  winner: {
    id: string;
    displayName: string;
  } | null;
}

interface UserGameStats {
  recentForm: ('W' | 'L')[];
  averagePosition: number;
  averageDamageDealt: number;
  averageKills: number;
  bestStreak: number;
  currentStreak: number;
  totalGames: number;
}

interface PaginatedResult {
  data: GameHistoryEntry[];
  total: number;
  page: number;
  pages: number;
}

// ==========================================
// COMPONENT
// ==========================================

export default function History() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading, token } = useAuth();

  const [games, setGames] = useState<GameHistoryEntry[]>([]);
  const [stats, setStats] = useState<UserGameStats | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch history
  useEffect(() => {
    if (!token) return;

    const fetchHistory = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/history?page=${page}&limit=10`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Erro ao buscar historico');
        }

        const data: PaginatedResult = await response.json();
        setGames(data.data);
        setTotalPages(data.pages);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [token, page]);

  // Fetch stats
  useEffect(() => {
    if (!token) return;

    const fetchStats = async () => {
      try {
        const response = await fetch('/api/history/stats', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data: UserGameStats = await response.json();
          setStats(data);
        }
      } catch (err) {
        console.error('Erro ao buscar stats:', err);
      }
    };

    fetchStats();
  }, [token]);

  // Get position badge
  const getPositionBadge = (position: number | null, totalPlayers: number) => {
    if (position === null) return '?';
    if (position === 1) return '1';
    if (position === totalPlayers) return `${position}`;
    return `${position}`;
  };

  const getPositionClass = (position: number | null, totalPlayers: number) => {
    if (position === null) return '';
    if (position === 1) return 'winner';
    if (position === totalPlayers) return 'last';
    return 'middle';
  };

  // Loading state
  if (authLoading) {
    return (
      <PageLayout title="Historico">
        <LoadingState message="Carregando..." />
      </PageLayout>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <div className="history-container--login">
        <button className="back-btn" onClick={() => navigate('/')}>
          Voltar
        </button>
        <h1 className="page-title">HISTORICO</h1>
        <div className="login-required">
          <p>Faca login para ver seu historico de partidas</p>
          <button className="action-btn primary" onClick={() => navigate('/profile')}>
            Fazer Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <PageLayout title="Historico">
      <div className="history-content">

        {/* Stats Summary */}
        {stats && (
          <div className="stats-summary">
            <div className="form-display">
              <span className="form-label">Forma Recente:</span>
              <div className="form-icons">
                {stats.recentForm.slice(0, 10).map((result, i) => (
                  <span key={i} className={`form-icon ${result === 'W' ? 'win' : 'loss'}`}>
                    {result}
                  </span>
                ))}
              </div>
            </div>
            <div className="stats-row">
              <div className="mini-stat">
                <span className="mini-value">{stats.currentStreak}</span>
                <span className="mini-label">Streak Atual</span>
              </div>
              <div className="mini-stat">
                <span className="mini-value">{stats.bestStreak}</span>
                <span className="mini-label">Melhor Streak</span>
              </div>
              <div className="mini-stat">
                <span className="mini-value">{stats.averageKills.toFixed(1)}</span>
                <span className="mini-label">Media Kills</span>
              </div>
              <div className="mini-stat">
                <span className="mini-value">{stats.averageDamageDealt.toFixed(0)}</span>
                <span className="mini-label">Media Dano</span>
              </div>
            </div>
          </div>
        )}

        {/* Inline Ad - visible on smaller screens */}
        <InlineAd position="inline-top" />

        {/* Error State */}
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <LoadingState message="Carregando partidas..." />
        )}

        {/* Empty State */}
        {!loading && games.length === 0 && (
          <EmptyState
            icon="🎮"
            title="Nenhuma partida encontrada"
            description="Jogue sua primeira partida para ver o historico"
            action={{ label: 'Jogar Agora', onClick: () => navigate('/multiplayer') }}
          />
        )}

        {/* Games List */}
        {!loading && games.length > 0 && (
          <div className="games-list">
            {games.map(game => {
              const totalPlayers = game.opponents.length + 1;
              const isWin = game.position === 1;

              return (
                <div key={game.id} className={`game-card ${isWin ? 'win' : 'loss'}`}>
                  <div className="game-header">
                    <div className={`position-badge ${getPositionClass(game.position, totalPlayers)}`}>
                      {getPositionBadge(game.position, totalPlayers)}
                    </div>
                    <div className="game-info">
                      <span className="game-date">{formatDate(game.createdAt)}</span>
                      <span className="game-players">{totalPlayers} jogadores</span>
                    </div>
                    {game.eloChange !== null && (
                      <div className={`elo-change ${game.eloChange >= 0 ? 'positive' : 'negative'}`}>
                        {game.eloChange >= 0 ? '+' : ''}{game.eloChange}
                      </div>
                    )}
                    {game.xpEarned !== null && game.xpEarned > 0 && (
                      <div className="xp-change">
                        +{game.xpEarned} XP
                      </div>
                    )}
                  </div>

                  <div className="game-stats">
                    <div className="stat">
                      <span className="stat-icon">💀</span>
                      <span className="stat-num">{game.kills}</span>
                    </div>
                    <div className="stat">
                      <span className="stat-icon">💥</span>
                      <span className="stat-num">{game.damageDealt}</span>
                    </div>
                    <div className="stat">
                      <span className="stat-icon">🏆</span>
                      <span className="stat-num">{game.roundsWon}</span>
                    </div>
                    <div className="stat">
                      <span className="stat-icon">🎯</span>
                      <span className="stat-num">{game.shotsFired}</span>
                    </div>
                  </div>

                  <div className="game-opponents">
                    <span className="opponents-label">vs</span>
                    {game.opponents.slice(0, 3).map((opp, i) => (
                      <span key={i} className="opponent-name">{opp.displayName}</span>
                    ))}
                    {game.opponents.length > 3 && (
                      <span className="more-opponents">+{game.opponents.length - 3}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            <button
              className="page-btn"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Anterior
            </button>
            <span className="page-info">{page} / {totalPages}</span>
            <button
              className="page-btn"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Proxima
            </button>
          </div>
        )}

        {/* Inline Ad - bottom */}
        <InlineAd position="inline-bottom" />
      </div>
    </PageLayout>
  );
}
