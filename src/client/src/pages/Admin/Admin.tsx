// ==========================================
// ADMIN PAGE - BUG REPORTS
// ==========================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Admin.css';

// ==========================================
// TYPES
// ==========================================

interface BugReport {
  id: string;
  title: string;
  description: string;
  category: 'GAMEPLAY' | 'UI' | 'CONNECTION' | 'PERFORMANCE' | 'OTHER';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'WONT_FIX' | 'DUPLICATE';
  gameRoomCode: string | null;
  gameRound: number | null;
  gameState: string | null;
  screenshot: string | null;
  adminNotes: string | null;
  resolvedBy: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    displayName: string;
    email: string;
  } | null;
}

interface PaginatedResult {
  data: BugReport[];
  total: number;
  page: number;
  pages: number;
}

type FilterStatus = 'all' | 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'WONT_FIX' | 'DUPLICATE';
type FilterCategory = 'all' | 'GAMEPLAY' | 'UI' | 'CONNECTION' | 'PERFORMANCE' | 'OTHER';
type FilterPriority = 'all' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

// ==========================================
// CONSTANTS
// ==========================================

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  OPEN: { label: 'Aberto', color: '#2196f3' },
  IN_PROGRESS: { label: 'Em Progresso', color: '#ff9800' },
  RESOLVED: { label: 'Resolvido', color: '#4caf50' },
  WONT_FIX: { label: 'Nao Corrigir', color: '#9e9e9e' },
  DUPLICATE: { label: 'Duplicado', color: '#9c27b0' },
};

const PRIORITY_LABELS: Record<string, { label: string; color: string }> = {
  LOW: { label: 'Baixa', color: '#4caf50' },
  MEDIUM: { label: 'Media', color: '#ff9800' },
  HIGH: { label: 'Alta', color: '#f44336' },
  CRITICAL: { label: 'Critica', color: '#9c27b0' },
};

const CATEGORY_LABELS: Record<string, { label: string; emoji: string }> = {
  GAMEPLAY: { label: 'Gameplay', emoji: '🎮' },
  UI: { label: 'Interface', emoji: '🖥️' },
  CONNECTION: { label: 'Conexao', emoji: '🌐' },
  PERFORMANCE: { label: 'Performance', emoji: '⚡' },
  OTHER: { label: 'Outro', emoji: '📌' },
};

// ==========================================
// COMPONENT
// ==========================================

export default function Admin() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading, token, isAdmin } = useAuth();

  const [bugs, setBugs] = useState<BugReport[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [categoryFilter, setCategoryFilter] = useState<FilterCategory>('all');
  const [priorityFilter, setPriorityFilter] = useState<FilterPriority>('all');

  // Selected bug for details
  const [selectedBug, setSelectedBug] = useState<BugReport | null>(null);
  const [updating, setUpdating] = useState(false);

  // Redirect non-admin users
  useEffect(() => {
    if (!authLoading && user && !isAdmin) {
      navigate('/');
    }
  }, [authLoading, user, isAdmin, navigate]);

  // Fetch bugs
  useEffect(() => {
    if (!token || !isAdmin) return;

    const fetchBugs = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams({
          page: page.toString(),
          limit: '20',
        });

        if (statusFilter !== 'all') params.append('status', statusFilter);
        if (categoryFilter !== 'all') params.append('category', categoryFilter);
        if (priorityFilter !== 'all') params.append('priority', priorityFilter);

        const response = await fetch(`/api/bugs?${params}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.status === 403) {
          setError('Acesso negado. Permissao de administrador necessaria.');
          setLoading(false);
          return;
        }

        if (!response.ok) {
          throw new Error('Erro ao buscar bug reports');
        }

        const data: PaginatedResult = await response.json();
        setBugs(data.data);
        setTotalPages(data.pages);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    };

    fetchBugs();
  }, [token, page, statusFilter, categoryFilter, priorityFilter]);

  // Update bug status
  const handleUpdateStatus = async (bugId: string, newStatus: string) => {
    if (!token) return;

    try {
      setUpdating(true);

      const response = await fetch(`/api/bugs/${bugId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Erro ao atualizar status');
      }

      const updatedBug = await response.json();

      setBugs(prev => prev.map(b => (b.id === bugId ? updatedBug : b)));
      if (selectedBug?.id === bugId) {
        setSelectedBug(updatedBug);
      }
    } catch (err) {
      console.error('Erro ao atualizar:', err);
    } finally {
      setUpdating(false);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Loading state
  if (authLoading) {
    return (
      <div className="admin-container">
        <div className="loading-message">Carregando...</div>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <div className="admin-container">
        <button className="back-btn" onClick={() => navigate('/')}>
          Voltar
        </button>
        <h1 className="page-title">ADMIN</h1>
        <div className="login-required">
          <p>Faca login para acessar a area administrativa</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <button className="back-btn" onClick={() => navigate('/')}>
        Voltar
      </button>

      <h1 className="page-title">BUG REPORTS</h1>

      {/* Error State */}
      {error && (
        <div className="error-message">{error}</div>
      )}

      {/* Filters */}
      <div className="filters-section">
        <div className="filter-group">
          <label>Status:</label>
          <select
            value={statusFilter}
            onChange={e => {
              setStatusFilter(e.target.value as FilterStatus);
              setPage(1);
            }}
          >
            <option value="all">Todos</option>
            {Object.entries(STATUS_LABELS).map(([key, { label }]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Categoria:</label>
          <select
            value={categoryFilter}
            onChange={e => {
              setCategoryFilter(e.target.value as FilterCategory);
              setPage(1);
            }}
          >
            <option value="all">Todas</option>
            {Object.entries(CATEGORY_LABELS).map(([key, { label, emoji }]) => (
              <option key={key} value={key}>{emoji} {label}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Prioridade:</label>
          <select
            value={priorityFilter}
            onChange={e => {
              setPriorityFilter(e.target.value as FilterPriority);
              setPage(1);
            }}
          >
            <option value="all">Todas</option>
            {Object.entries(PRIORITY_LABELS).map(([key, { label }]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="loading-message">Carregando bug reports...</div>
      )}

      {/* Empty State */}
      {!loading && !error && bugs.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">🐛</div>
          <p>Nenhum bug report encontrado</p>
        </div>
      )}

      {/* Bugs List */}
      {!loading && !error && bugs.length > 0 && (
        <div className="bugs-list">
          {bugs.map(bug => (
            <div
              key={bug.id}
              className={`bug-card ${selectedBug?.id === bug.id ? 'selected' : ''}`}
              onClick={() => setSelectedBug(bug)}
            >
              <div className="bug-card-header">
                <span
                  className="priority-badge"
                  style={{ backgroundColor: PRIORITY_LABELS[bug.priority].color }}
                >
                  {PRIORITY_LABELS[bug.priority].label}
                </span>
                <span
                  className="status-badge"
                  style={{ backgroundColor: STATUS_LABELS[bug.status].color }}
                >
                  {STATUS_LABELS[bug.status].label}
                </span>
              </div>

              <h3 className="bug-title">{bug.title}</h3>

              <div className="bug-meta">
                <span className="bug-category">
                  {CATEGORY_LABELS[bug.category].emoji} {CATEGORY_LABELS[bug.category].label}
                </span>
                <span className="bug-date">{formatDate(bug.createdAt)}</span>
              </div>

              {bug.user && (
                <div className="bug-reporter">
                  Por: {bug.user.displayName}
                </div>
              )}
            </div>
          ))}
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

      {/* Bug Detail Modal */}
      {selectedBug && (
        <div className="bug-modal-overlay" onClick={() => setSelectedBug(null)}>
          <div className="bug-modal" onClick={e => e.stopPropagation()}>
            <div className="bug-modal-header">
              <h2>{selectedBug.title}</h2>
              <button className="close-btn" onClick={() => setSelectedBug(null)}>
                &times;
              </button>
            </div>

            <div className="bug-modal-content">
              {/* Badges */}
              <div className="bug-badges">
                <span
                  className="priority-badge"
                  style={{ backgroundColor: PRIORITY_LABELS[selectedBug.priority].color }}
                >
                  {PRIORITY_LABELS[selectedBug.priority].label}
                </span>
                <span className="category-badge">
                  {CATEGORY_LABELS[selectedBug.category].emoji} {CATEGORY_LABELS[selectedBug.category].label}
                </span>
              </div>

              {/* Status Selector */}
              <div className="status-section">
                <label>Status:</label>
                <select
                  value={selectedBug.status}
                  onChange={e => handleUpdateStatus(selectedBug.id, e.target.value)}
                  disabled={updating}
                  style={{ borderColor: STATUS_LABELS[selectedBug.status].color }}
                >
                  {Object.entries(STATUS_LABELS).map(([key, { label }]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div className="detail-section">
                <h4>Descricao</h4>
                <p className="description-text">{selectedBug.description}</p>
              </div>

              {/* Reporter */}
              {selectedBug.user && (
                <div className="detail-section">
                  <h4>Reportado por</h4>
                  <p>{selectedBug.user.displayName} ({selectedBug.user.email})</p>
                </div>
              )}

              {/* Game Info */}
              {(selectedBug.gameRoomCode || selectedBug.gameRound) && (
                <div className="detail-section">
                  <h4>Informacoes do Jogo</h4>
                  {selectedBug.gameRoomCode && <p>Sala: {selectedBug.gameRoomCode}</p>}
                  {selectedBug.gameRound && <p>Rodada: {selectedBug.gameRound}</p>}
                </div>
              )}

              {/* Game State */}
              {selectedBug.gameState && (
                <div className="detail-section">
                  <h4>Estado do Jogo</h4>
                  <pre className="game-state-json">
                    {JSON.stringify(JSON.parse(selectedBug.gameState), null, 2)}
                  </pre>
                </div>
              )}

              {/* Screenshot */}
              {selectedBug.screenshot && (
                <div className="detail-section">
                  <h4>Screenshot</h4>
                  <img
                    src={selectedBug.screenshot}
                    alt="Bug screenshot"
                    className="bug-screenshot"
                  />
                </div>
              )}

              {/* Dates */}
              <div className="detail-section dates">
                <p>Criado em: {formatDate(selectedBug.createdAt)}</p>
                <p>Atualizado em: {formatDate(selectedBug.updatedAt)}</p>
                {selectedBug.resolvedAt && (
                  <p>Resolvido em: {formatDate(selectedBug.resolvedAt)}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
