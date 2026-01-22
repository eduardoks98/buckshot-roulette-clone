// ==========================================
// LEADERBOARD PAGE
// ==========================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Leaderboard.css';

type LeaderboardPeriod = 'daily' | 'weekly' | 'monthly' | 'all_time';

interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  gamesPlayed: number;
  gamesWon: number;
  winRate: number;
  eloRating: number;
  eloGain?: number;
}

export default function Leaderboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [period, setPeriod] = useState<LeaderboardPeriod>('weekly');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [myRank, setMyRank] = useState<number | null>(null);

  useEffect(() => {
    fetchLeaderboard();
  }, [period]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/leaderboard?period=${period}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao carregar leaderboard');
      }

      setEntries(data.entries);
      setMyRank(data.myRank);
    } catch (err) {
      console.error('Erro ao carregar leaderboard:', err);
      setError('Erro ao carregar leaderboard');

      // Mock data for development
      setEntries([
        {
          rank: 1,
          userId: '1',
          username: 'player1',
          displayName: 'Jogador Pro',
          gamesPlayed: 150,
          gamesWon: 120,
          winRate: 80,
          eloRating: 1850,
          eloGain: 150,
        },
        {
          rank: 2,
          userId: '2',
          username: 'player2',
          displayName: 'Mestre do Tiro',
          gamesPlayed: 200,
          gamesWon: 140,
          winRate: 70,
          eloRating: 1720,
          eloGain: 80,
        },
        {
          rank: 3,
          userId: '3',
          username: 'player3',
          displayName: 'Lucky Shot',
          gamesPlayed: 100,
          gamesWon: 65,
          winRate: 65,
          eloRating: 1650,
          eloGain: 50,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getPeriodLabel = (p: LeaderboardPeriod) => {
    const labels: Record<LeaderboardPeriod, string> = {
      daily: 'Hoje',
      weekly: 'Semana',
      monthly: 'Mes',
      all_time: 'Geral',
    };
    return labels[p];
  };

  const getRankClass = (rank: number) => {
    if (rank === 1) return 'gold';
    if (rank === 2) return 'silver';
    if (rank === 3) return 'bronze';
    return '';
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  return (
    <div className="leaderboard-container">
      <button className="back-btn" onClick={() => navigate('/')}>
        Voltar
      </button>

      <h1 className="page-title">LEADERBOARD</h1>

      {/* Period Tabs */}
      <div className="period-tabs">
        {(['daily', 'weekly', 'monthly', 'all_time'] as LeaderboardPeriod[]).map(p => (
          <button
            key={p}
            className={`period-tab ${period === p ? 'active' : ''}`}
            onClick={() => setPeriod(p)}
          >
            {getPeriodLabel(p)}
          </button>
        ))}
      </div>

      {/* My Rank */}
      {user && myRank && (
        <div className="my-rank-card">
          <span className="my-rank-label">Sua posicao</span>
          <span className="my-rank-value">#{myRank}</span>
        </div>
      )}

      {/* Leaderboard */}
      {loading ? (
        <div className="loading-message">Carregando...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : entries.length === 0 ? (
        <div className="empty-message">
          Nenhum jogador no ranking ainda.
          <br />
          Jogue partidas ranqueadas para aparecer!
        </div>
      ) : (
        <div className="leaderboard-list">
          {entries.map(entry => (
            <div
              key={entry.userId}
              className={`leaderboard-entry ${getRankClass(entry.rank)} ${entry.userId === user?.id ? 'is-me' : ''}`}
            >
              <div className="entry-rank">{getRankIcon(entry.rank)}</div>

              <div className="entry-avatar">
                {entry.avatarUrl ? (
                  <img src={entry.avatarUrl} alt={entry.displayName} />
                ) : (
                  entry.displayName.charAt(0).toUpperCase()
                )}
              </div>

              <div className="entry-info">
                <span className="entry-name">{entry.displayName}</span>
                <span className="entry-stats">
                  {entry.gamesWon}V / {entry.gamesPlayed - entry.gamesWon}D ({entry.winRate.toFixed(0)}%)
                </span>
              </div>

              <div className="entry-elo">
                <span className="elo-value">{entry.eloRating}</span>
                {entry.eloGain !== undefined && entry.eloGain > 0 && (
                  <span className="elo-gain">+{entry.eloGain}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Not logged in message */}
      {!user && (
        <div className="login-prompt">
          <p>Faca login para aparecer no ranking!</p>
          <button className="login-btn" onClick={() => navigate('/profile')}>
            Entrar com Google
          </button>
        </div>
      )}
    </div>
  );
}
