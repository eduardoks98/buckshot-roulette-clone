// ==========================================
// SESSION INVALIDATED MODAL / SYNCING OVERLAY
// Exibido quando a aba é invalidada por outra aba ou está sincronizando
// ==========================================

import './SessionInvalidatedModal.css';

interface SyncingOverlayProps {
  isVisible: boolean;
  message?: string;
}

interface SessionInvalidatedModalProps {
  isVisible: boolean;
  reason?: string | null;
  onReload?: () => void;
}

/**
 * Modal exibido quando a sessão é invalidada (ex: outra aba aberta)
 */
export function SessionInvalidatedModal({
  isVisible,
  reason = 'Você abriu o jogo em outra aba',
  onReload,
}: SessionInvalidatedModalProps) {
  if (!isVisible) return null;

  const handleReload = () => {
    if (onReload) {
      onReload();
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="session-invalidated-modal">
      <div className="session-invalidated-content">
        <div className="session-invalidated-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="session-invalidated-title">Sessao Encerrada</h2>
        <p className="session-invalidated-message">{reason}</p>
        <button className="session-invalidated-button" onClick={handleReload}>
          Recarregar Pagina
        </button>
      </div>
    </div>
  );
}

/**
 * Overlay simples de sincronização (sem botão)
 */
export default function SyncingOverlay({ isVisible, message = 'Sincronizando...' }: SyncingOverlayProps) {
  if (!isVisible) return null;

  return (
    <div className="syncing-overlay">
      <div className="syncing-content">
        <div className="syncing-spinner">
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
        </div>
        <p className="syncing-message">{message}</p>
      </div>
    </div>
  );
}

// Aliases para compatibilidade
export { SyncingOverlay };
