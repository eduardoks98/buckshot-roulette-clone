// ==========================================
// BUG REPORT MODAL COMPONENT
// ==========================================

import { useState, useRef } from 'react';
import './BugReportModal.css';

export interface GameStateForReport {
  roomCode?: string;
  round?: number;
  players?: { id: string; name: string; hp: number; alive: boolean }[];
  currentPlayerId?: string;
  shells?: { total: number; live: number; blank: number };
  myItems?: { id: string; name: string }[];
  recentEvents?: string[];
}

interface BugReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameState?: GameStateForReport;
}

type BugCategory = 'GAMEPLAY' | 'UI' | 'CONNECTION' | 'PERFORMANCE' | 'OTHER';
type BugPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

const CATEGORY_OPTIONS: { value: BugCategory; label: string; emoji: string }[] = [
  { value: 'GAMEPLAY', label: 'Gameplay', emoji: '🎮' },
  { value: 'UI', label: 'Interface', emoji: '🖥️' },
  { value: 'CONNECTION', label: 'Conexao', emoji: '🌐' },
  { value: 'PERFORMANCE', label: 'Performance', emoji: '⚡' },
  { value: 'OTHER', label: 'Outro', emoji: '📌' },
];

const PRIORITY_OPTIONS: { value: BugPriority; label: string; color: string }[] = [
  { value: 'LOW', label: 'Baixa', color: '#4caf50' },
  { value: 'MEDIUM', label: 'Media', color: '#ff9800' },
  { value: 'HIGH', label: 'Alta', color: '#f44336' },
  { value: 'CRITICAL', label: 'Critica', color: '#9c27b0' },
];

export default function BugReportModal({ isOpen, onClose, gameState }: BugReportModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<BugCategory>('GAMEPLAY');
  const [priority, setPriority] = useState<BugPriority>('MEDIUM');
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage('Screenshot muito grande (max 5MB)');
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        setScreenshot(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setErrorMessage('Titulo e obrigatorio');
      return;
    }

    if (!description.trim()) {
      setErrorMessage('Descricao e obrigatoria');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const token = localStorage.getItem('buckshot_auth_token');

      const payload = {
        title: title.trim(),
        description: description.trim(),
        category,
        priority,
        screenshot,
        gameRoomCode: gameState?.roomCode,
        gameRound: gameState?.round,
        gameState: gameState ? JSON.stringify(gameState) : undefined,
      };

      const response = await fetch('/api/bugs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao enviar report');
      }

      setSubmitStatus('success');

      // Reset form after delay
      setTimeout(() => {
        setTitle('');
        setDescription('');
        setCategory('GAMEPLAY');
        setPriority('MEDIUM');
        setScreenshot(null);
        setSubmitStatus('idle');
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Erro ao enviar bug report:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Erro desconhecido');
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setSubmitStatus('idle');
    setErrorMessage('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="bug-report-overlay" onClick={handleClose}>
      <div className="bug-report-modal" onClick={(e) => e.stopPropagation()}>
        <div className="bug-report-header">
          <h3>🐛 Reportar Bug</h3>
          <button className="bug-report-close" onClick={handleClose} disabled={isSubmitting}>
            &times;
          </button>
        </div>

        {submitStatus === 'success' ? (
          <div className="bug-report-success">
            <span className="success-icon">✅</span>
            <p>Bug reportado com sucesso!</p>
            <p className="success-subtitle">Obrigado por ajudar a melhorar o jogo!</p>
          </div>
        ) : (
          <form className="bug-report-form" onSubmit={handleSubmit}>
            {errorMessage && (
              <div className="bug-report-error">{errorMessage}</div>
            )}

            {/* Title */}
            <div className="form-group">
              <label htmlFor="bug-title">Titulo *</label>
              <input
                id="bug-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Resumo do problema..."
                maxLength={100}
                disabled={isSubmitting}
              />
            </div>

            {/* Category */}
            <div className="form-group">
              <label>Categoria</label>
              <div className="category-options">
                {CATEGORY_OPTIONS.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    className={`category-btn ${category === cat.value ? 'selected' : ''}`}
                    onClick={() => setCategory(cat.value)}
                    disabled={isSubmitting}
                  >
                    <span>{cat.emoji}</span>
                    <span>{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Priority */}
            <div className="form-group">
              <label>Prioridade</label>
              <div className="priority-options">
                {PRIORITY_OPTIONS.map((pri) => (
                  <button
                    key={pri.value}
                    type="button"
                    className={`priority-btn ${priority === pri.value ? 'selected' : ''}`}
                    style={{ '--priority-color': pri.color } as React.CSSProperties}
                    onClick={() => setPriority(pri.value)}
                    disabled={isSubmitting}
                  >
                    {pri.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="form-group">
              <label htmlFor="bug-description">Descricao *</label>
              <textarea
                id="bug-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descreva o bug detalhadamente. O que voce estava fazendo? O que deveria acontecer? O que aconteceu?"
                rows={4}
                maxLength={2000}
                disabled={isSubmitting}
              />
              <span className="char-count">{description.length}/2000</span>
            </div>

            {/* Screenshot */}
            <div className="form-group">
              <label>Screenshot (opcional)</label>
              <div className="screenshot-area">
                {screenshot ? (
                  <div className="screenshot-preview">
                    <img src={screenshot} alt="Screenshot preview" />
                    <button
                      type="button"
                      className="remove-screenshot"
                      onClick={() => {
                        setScreenshot(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      disabled={isSubmitting}
                    >
                      Remover
                    </button>
                  </div>
                ) : (
                  <label className="screenshot-upload">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleScreenshotChange}
                      disabled={isSubmitting}
                    />
                    <span className="upload-icon">📷</span>
                    <span>Clique para adicionar screenshot</span>
                  </label>
                )}
              </div>
            </div>

            {/* Game State Info */}
            {gameState && (
              <div className="game-state-info">
                <span className="info-icon">📊</span>
                <span>Estado do jogo sera capturado automaticamente</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              className="submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Enviando...' : 'Enviar Report'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
