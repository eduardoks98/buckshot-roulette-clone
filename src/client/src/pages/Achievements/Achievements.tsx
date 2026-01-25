// ==========================================
// ACHIEVEMENTS PAGE
// ==========================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { MILESTONES } from '@shared/constants/achievements';
import { PageLayout } from '../../components/layout/PageLayout';
import { LoadingState } from '../../components/common/LoadingState';
import './Achievements.css';

// ==========================================
// TYPES
// ==========================================

interface UnlockedMilestone {
  achievementId: string;
  unlockedAt: string;
  gameId?: string;
}

interface AchievementsResponse {
  milestones: UnlockedMilestone[];
  totalUnlocked: number;
  totalAvailable: number;
  activeTitle: {
    titleId: string;
    name: string;
    icon: string;
    period: string;
  } | null;
  recentBadges: {
    badgeId: string;
    gameId: string;
    awardedAt: string;
  }[];
}

// ==========================================
// CONSTANTS
// ==========================================

type CategoryKey = 'combat' | 'survival' | 'items' | 'games' | 'social';

const CATEGORY_TABS: { key: CategoryKey; label: string }[] = [
  { key: 'combat', label: 'Combate' },
  { key: 'survival', label: 'Sobrevivencia' },
  { key: 'items', label: 'Itens' },
  { key: 'games', label: 'Jogos' },
  { key: 'social', label: 'Social' },
];

// ==========================================
// COMPONENT
// ==========================================

export default function Achievements() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: authLoading, token } = useAuth();

  const [activeTab, setActiveTab] = useState<CategoryKey>('combat');
  const [unlockedIds, setUnlockedIds] = useState<Set<string>>(new Set());
  const [totalUnlocked, setTotalUnlocked] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/');
    }
  }, [authLoading, isAuthenticated, navigate]);

  // Fetch achievements
  useEffect(() => {
    if (!isAuthenticated || !token) return;

    const fetchAchievements = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/achievements', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Erro ao buscar conquistas');
        }

        const data: AchievementsResponse = await response.json();
        const ids = new Set(data.milestones.map(m => m.achievementId));
        setUnlockedIds(ids);
        setTotalUnlocked(data.totalUnlocked);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    };

    fetchAchievements();
  }, [isAuthenticated, token]);

  // Filter milestones by active tab
  const filteredMilestones = MILESTONES.filter(m => m.category === activeTab);

  // Progress percentage
  const totalAvailable = MILESTONES.length;
  const progressPercent = totalAvailable > 0
    ? (totalUnlocked / totalAvailable) * 100
    : 0;

  // Loading state
  if (authLoading) {
    return (
      <PageLayout>
        <LoadingState message="Carregando..." />
      </PageLayout>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <div className="achievements-container--login">
        <button className="back-btn" onClick={() => navigate('/')}>
          Voltar
        </button>
        <h1 className="page-title">CONQUISTAS</h1>
        <div className="login-required">
          <p>Faca login para ver suas conquistas</p>
          <button className="action-btn primary" onClick={() => navigate('/profile')}>
            Fazer Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <PageLayout>
      <div className="achievements-content">
        <h1 className="page-title">CONQUISTAS</h1>

        {/* Progress Bar */}
        <div className="achievements-progress">
          <div className="progress-header">
            <span className="progress-text">
              {totalUnlocked}/{totalAvailable} Conquistas Desbloqueadas
            </span>
            <span className="progress-percent">{progressPercent.toFixed(0)}%</span>
          </div>
          <div className="progress-bar-track">
            <div
              className="progress-bar-fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

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
          <LoadingState message="Carregando conquistas..." />
        )}

        {/* Achievement Grid */}
        {!loading && (
          <div className="achievement-grid">
            {filteredMilestones.map(milestone => {
              const isUnlocked = unlockedIds.has(milestone.id);

              return (
                <div
                  key={milestone.id}
                  className={`achievement-card ${isUnlocked ? 'unlocked' : 'locked'}`}
                >
                  <div className="achievement-icon-wrapper">
                    <span className="achievement-icon">{milestone.icon}</span>
                    {!isUnlocked && (
                      <span className="lock-overlay">&#x1F512;</span>
                    )}
                  </div>
                  <div className="achievement-info">
                    <span className="achievement-name">{milestone.name}</span>
                    <span className="achievement-description">{milestone.description}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </PageLayout>
  );
}
