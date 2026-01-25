// ==========================================
// MINI LEADERBOARD - Top 10 jogadores
// ==========================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRankColor } from '../../../utils/helpers';
import './MiniLeaderboard.css';

interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  avatarUrl?: string;
  eloRating: number;
  userRank: string;
  gamesWon: number;
}

export function MiniLeaderboard() {
  const navigate = useNavigate();
  const [players, setPlayers] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await fetch('/api/leaderboard?period=all_time&limit=10');
        if (response.ok) {
          const data = await response.json();
          setPlayers(data.entries || []);
        }
      } catch (err) {
        console.error('Erro ao carregar leaderboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  const getRankIcon = (position: number) => {
    if (position === 1) return '🥇';
    if (position === 2) return '🥈';
    if (position === 3) return '🥉';
    return `#${position}`;
  };

  return (
    <div className="mini-leaderboard">
      <h2 className="mini-leaderboard__title">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="20" x2="18" y2="10"/>
          <line x1="12" y1="20" x2="12" y2="4"/>
          <line x1="6" y1="20" x2="6" y2="14"/>
        </svg>
        TOP JOGADORES
      </h2>

      <div className="mini-leaderboard__content">
        {loading && (
          <p className="mini-leaderboard__loading">Carregando...</p>
        )}

        {!loading && players.length === 0 && (
          <p className="mini-leaderboard__empty">Nenhum jogador no ranking ainda</p>
        )}

        {!loading && players.length > 0 && (
          <div className="mini-leaderboard__list">
            {players.map((player, index) => (
              <div
                key={player.userId}
                className={`leaderboard-entry ${index < 3 ? `leaderboard-entry--top${index + 1}` : ''}`}
              >
                <span className="leaderboard-entry__rank">{getRankIcon(index + 1)}</span>
                <div className="leaderboard-entry__avatar">
                  {player.avatarUrl ? (
                    <img src={player.avatarUrl} alt={player.displayName} />
                  ) : (
                    <span>{player.displayName.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <span className="leaderboard-entry__name">{player.displayName}</span>
                <span
                  className="leaderboard-entry__elo"
                  style={{ color: getRankColor(player.userRank || 'Bronze') }}
                >
                  {player.eloRating}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        className="mini-leaderboard__view-all"
        onClick={() => navigate('/leaderboard')}
      >
        Ver Ranking Completo
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </button>
    </div>
  );
}

export default MiniLeaderboard;
