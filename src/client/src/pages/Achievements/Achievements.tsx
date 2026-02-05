// ==========================================
// ACHIEVEMENTS PAGE - Sistema de Progressao
// ==========================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { PageLayout, InlineAd } from '../../components/layout/PageLayout';
import { LoadingState } from '../../components/common/LoadingState';
import { StatProgressCard } from '../../components/stats';
import {
  UserStatsResponse,
  StatCategory,
} from '@shared/types/stats.types';
import { getStatsByCategory } from '@shared/constants/stats';
import './Achievements.css';

// ==========================================
// TYPES
// ==========================================

type CategoryKey = StatCategory;

const CATEGORY_TABS: { key: CategoryKey; label: string }[] = [
  { key: 'combat', label: 'Combate' },
  { key: 'matches', label: 'Partidas' },
  { key: 'items', label: 'Itens' },
];

// ==========================================
// COMPONENT
// ==========================================

export default function Achievements() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<CategoryKey>('combat');
  const [statsData, setStatsData] = useState<UserStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/lobby');
    }
  }, [authLoading, isAuthenticated, navigate]);

  // Fetch stats
  useEffect(() => {
    if (!isAuthenticated || !user?.game_user_id) return;

    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/stats/od/${user.game_user_id}`, {
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Erro ao buscar estatisticas');
        }

        const data: UserStatsResponse = await response.json();
        setStatsData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [isAuthenticated, user?.game_user_id]);

  // Get stat progress by key
  const getStatProgress = (statKey: string) => {
    return statsData?.progress.find((p) => p.key === statKey);
  };

  // Get stats for current category
  const currentCategoryStats = getStatsByCategory(activeTab);

  // Calculate total milestones
  const getTotalMilestones = () => {
    if (!statsData) return { completed: 0, total: 0 };

    let completed = 0;
    let total = 0;

    for (const progress of statsData.progress) {
      completed += progress.completedMilestones.length;
      const definition = getStatsByCategory('combat')
        .concat(getStatsByCategory('matches'))
        .concat(getStatsByCategory('items'))
        .find((d) => d.key === progress.key);
      if (definition) {
        total += definition.milestones.length;
      }
    }

    return { completed, total };
  };

  const milestones = getTotalMilestones();
  const progressPercent = milestones.total > 0
    ? (milestones.completed / milestones.total) * 100
    : 0;

  // Loading state
  if (authLoading) {
    return (
      <PageLayout title="Estatisticas">
        <LoadingState message="Carregando..." />
      </PageLayout>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <div className="achievements-container--login">
        <button className="back-btn" onClick={() => navigate('/lobby')}>
          Voltar
        </button>
        <h1 className="page-title">ESTATISTICAS</h1>
        <div className="login-required">
          <p>Faca login para ver suas estatisticas</p>
          <button className="action-btn primary" onClick={() => navigate('/profile')}>
            Fazer Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <PageLayout title="Estatisticas">
      <div className="achievements-content">

        {/* Progress Header */}
        <div className="achievements-progress">
          <div className="progress-header">
            <span className="progress-text">
              {milestones.completed}/{milestones.total} Milestones Completados
            </span>
            <span className="progress-percent">
              {statsData ? `${statsData.totalXpEarned.toLocaleString()} XP` : '0 XP'}
            </span>
          </div>
          <div className="progress-bar-track">
            <div
              className="progress-bar-fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Inline Ad */}
        <InlineAd position="inline-top" />

        {/* Category Tabs */}
        <div className="category-tabs">
          {CATEGORY_TABS.map(tab => (
            <button
              key={tab.key}
              className={`category-tab ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Error State */}
        {error && (
          <div className="error-message">{error}</div>
        )}

        {/* Loading State */}
        {loading && (
          <LoadingState message="Carregando estatisticas..." />
        )}

        {/* Stats List */}
        {!loading && statsData && (
          <div className="stats-list">
            {currentCategoryStats.map(definition => {
              const progress = getStatProgress(definition.key);
              if (!progress) return null;

              return (
                <StatProgressCard
                  key={definition.key}
                  stat={progress}
                  definition={definition}
                />
              );
            })}
          </div>
        )}

        {/* Inline Ad - bottom */}
        <InlineAd position="inline-bottom" />
      </div>
    </PageLayout>
  );
}
