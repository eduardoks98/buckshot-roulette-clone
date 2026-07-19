// ==========================================
// BUG REPORT MODAL COMPONENT
// Integração com games-admin SDK
// ==========================================

import { useState, useRef, useEffect, ReactNode } from 'react';
import {
  BugIcon,
  GamepadIcon,
  MonitorIcon,
  GlobeIcon,
  PerformanceIcon,
  PinIcon,
  CameraIcon,
  ChartIcon,
  CheckIcon,
} from '../../icons';
import { ADMIN_API_URL, GAME_API_KEY, GAME_CODE } from '../../../config';
import { useAuth } from '../../../context/AuthContext';
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

// Categorias compatíveis com games-admin API
type BugCategory = 'BUG' | 'UI' | 'GAMEPLAY' | 'NETWORK' | 'PERFORMANCE' | 'OTHER';
type BugPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

const CATEGORY_OPTIONS: { value: BugCategory; label: string; icon: ReactNode }[] = [
  { value: 'GAMEPLAY', label: 'Gameplay', icon: <GamepadIcon size={16} /> },
  { value: 'UI', label: 'Interface', icon: <MonitorIcon size={16} /> },
  { value: 'NETWORK', label: 'Conexao', icon: <GlobeIcon size={16} /> },
  { value: 'PERFORMANCE', label: 'Performance', icon: <PerformanceIcon size={16} /> },
  { value: 'BUG', label: 'Bug Geral', icon: <BugIcon size={16} /> },
  { value: 'OTHER', label: 'Outro', icon: <PinIcon size={16} /> },
];

// Cores do design da landing page (vermelho neon)
const PRIORITY_OPTIONS: { value: BugPriority; label: string; color: string }[] = [
  { value: 'LOW', label: 'Baixa', color: '#22c55e' },
  { value: 'MEDIUM', label: 'Media', color: '#eab308' },
  { value: 'HIGH', label: 'Alta', color: '#ff0040' },  // Vermelho neon
  { value: 'CRITICAL', label: 'Critica', color: '#8b5cf6' },
];

export default function BugReportModal({ isOpen, onClose, gameState }: BugReportModalProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<BugCategory>('GAMEPLAY');
  const [priority, setPriority] = useState<BugPriority>('MEDIUM');
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Bloquear scroll do body quando modal estiver aberto
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setErrorMessage('Screenshot muito grande (max 2MB)');
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

    // Verificar se API está configurada
    if (!ADMIN_API_URL || !GAME_API_KEY) {
      setErrorMessage('API de bug report nao configurada');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      // Payload compatível com games-admin API
      const payload = {
        title: title.trim(),
        description: description.trim(),
        category,
        priority,
        user_id: user?.game_user_id || null,
        game_room_code: gameState?.roomCode || null,
        game_round: gameState?.round || null,
        game_state: gameState ? JSON.stringify(gameState) : null,
        screenshot: screenshot || null,
      };

      // Usar API do games-admin
      const response = await fetch(`${ADMIN_API_URL}/api/games/${GAME_CODE}/bug-reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': GAME_API_KEY,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        // Tratar erro de payload muito grande
        if (response.status === 413) {
          throw new Error('Imagem muito grande. Tente uma imagem menor (max 2MB).');
        }

        // Tratar erro de API Key inválida
        if (response.status === 401) {
          throw new Error('API Key invalida. Contate o suporte.');
        }

        // Tratar jogo não encontrado
        if (response.status === 404) {
          throw new Error('Jogo nao encontrado no servidor.');
        }

        // Tentar ler mensagem de erro do servidor
        try {
          const data = await response.json();
          throw new Error(data.error || data.message || 'Erro ao enviar report');
        } catch {
          throw new Error(`Erro ao enviar report (${response.status})`);
        }
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
    <div className="bug-report-overlay">
      <div className="bug-report-modal" onClick={(e) => e.stopPropagation()}>
        <div className="bug-report-header">
          <h3><BugIcon size={20} color="#ff0040" /> Reportar Bug</h3>
          <button className="bug-report-close" onClick={handleClose} disabled={isSubmitting}>
            &times;
          </button>
        </div>

        {submitStatus === 'success' ? (
          <div className="bug-report-success">
            <CheckIcon size={48} color="#22c55e" />
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
                    {cat.icon}
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
                    <span className="upload-icon"><CameraIcon size={24} /></span>
                    <span>Clique para adicionar screenshot</span>
                  </label>
                )}
              </div>
            </div>

            {/* Game State Info */}
            {gameState && (
              <div className="game-state-info">
                <span className="info-icon"><ChartIcon size={16} /></span>
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
