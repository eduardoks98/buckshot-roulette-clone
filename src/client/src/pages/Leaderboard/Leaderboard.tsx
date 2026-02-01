// ==========================================
// LEADERBOARD PAGE
// ==========================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getLevelInfo } from '@shared/utils/xpCalculator';
import { getTitleById } from '@shared/constants/achievements';
import { PageLayout, InlineAd } from '../../components/layout/PageLayout';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { getRankIcon } from '../../utils/helpers';
import { AdBanner } from '../../components/common/AdBanner';
import { MultiProviderLogin } from '../../components/auth/MultiProviderLogin';
import './Leaderboard.css';

// AdSense config
const ADSENSE_PUBLISHER_ID = import.meta.env.VITE_ADSENSE_PUBLISHER_ID || '';
const ADSENSE_SLOT_LEADERBOARD = import.meta.env.VITE_ADSENSE_SLOT_LEADERBOARD || '';
const ADSENSE_TEST_MODE = import.meta.env.VITE_ADSENSE_TEST_MODE === 'true';

type LeaderboardPeriod = 'daily' | 'weekly' | 'monthly' | 'all_time';

interface LeaderboardEntry {
  rank: number;
  user_id: string;
  username: string;
  display_name: string;
  avatar_url?: string;
  games_played: number;
  games_won: number;
  win_rate: number;
  elo_rating: number;
  elo_gain?: number;
  total_xp?: number;
  active_title_id?: string | null;
  // Novo sistema de ranking
  tier?: string;
  division?: number | null;
  lp?: number;
  displayRank?: string;
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
          user_id: '1',
          username: 'player1',
          display_name: 'Jogador Pro',
          games_played: 150,
          games_won: 120,
          win_rate: 80,
          elo_rating: 1850,
          elo_gain: 150,
          total_xp: 0,
        },
        {
          rank: 2,
          user_id: '2',
          username: 'player2',
          display_name: 'Mestre do Tiro',
          games_played: 200,
          games_won: 140,
          win_rate: 70,
          elo_rating: 1720,
          elo_gain: 80,
          total_xp: 0,
        },
        {
          rank: 3,
          user_id: '3',
          username: 'player3',
          display_name: 'Lucky Shot',
          games_played: 100,
          games_won: 65,
          win_rate: 65,
          elo_rating: 1650,
          elo_gain: 50,
          total_xp: 0,
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

  return (
    <PageLayout title="Ranking">
      <div className="leaderboard-content">

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

        {/* Inline Ad - visible on smaller screens */}
        <InlineAd position="inline-top" />

        {/* Leaderboard */}
        {loading ? (
          <LoadingState message="Carregando ranking..." />
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : entries.length === 0 ? (
          <EmptyState
            icon="🏆"
            title="Nenhum jogador no ranking"
            description="Jogue partidas ranqueadas para aparecer!"
            action={{ label: 'Jogar Agora', onClick: () => navigate('/multiplayer') }}
          />
        ) : (
          <div className="leaderboard-list">
            {entries.map(entry => (
              <div
                key={entry.user_id}
                className={`leaderboard-entry ${getRankClass(entry.rank)} ${entry.user_id === user?.id ? 'is-me' : ''}`}
              >
                <div className="entry-rank">{getRankIcon(entry.rank)}</div>

                <div className="entry-avatar">
                  {entry.avatar_url ? (
                    <img src={entry.avatar_url} alt={entry.display_name} />
                  ) : (
                    entry.display_name.charAt(0).toUpperCase()
                  )}
                </div>

                <div className="entry-info">
                  <span className="entry-name">
                    {entry.display_name}
                    {entry.total_xp !== undefined && (
                      <span className="entry-level">Nv.{getLevelInfo(entry.total_xp).displayLevel}</span>
                    )}
                    {entry.active_title_id && (() => {
                      const titleDef = getTitleById(entry.active_title_id!);
                      return titleDef ? (
                        <span className="entry-title">{titleDef.icon} {titleDef.name}</span>
                      ) : null;
                    })()}
                  </span>
                  <span className="entry-stats">
                    {entry.games_won}V / {entry.games_played - entry.games_won}D ({entry.win_rate.toFixed(0)}%)
                  </span>
                </div>

                <div className="entry-elo">
                  {entry.displayRank ? (
                    <>
                      <span className="elo-value">{entry.displayRank}</span>
                      {entry.lp !== undefined && (
                        <span className="elo-lp">{entry.lp} LP</span>
                      )}
                    </>
                  ) : (
                    <>
                      <span className="elo-value">{entry.elo_rating}</span>
                      {entry.elo_gain !== undefined && entry.elo_gain > 0 && (
                        <span className="elo-gain">+{entry.elo_gain}</span>
                      )}
                    </>
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
            <MultiProviderLogin compact />
          </div>
        )}

        {/* Ad Banner - Leaderboard */}
        {ADSENSE_PUBLISHER_ID && ADSENSE_SLOT_LEADERBOARD && (
          <div className="leaderboard-ad">
            <AdBanner
              publisherId={ADSENSE_PUBLISHER_ID}
              slotId={ADSENSE_SLOT_LEADERBOARD}
              format="leaderboard"
              className="ad-leaderboard"
              testMode={ADSENSE_TEST_MODE}
            />
          </div>
        )}

        {/* Inline Ad - bottom */}
        <InlineAd position="inline-bottom" />
      </div>
    </PageLayout>
  );
}
