// ==========================================
// LOADING STATE - Componente de carregamento
// ==========================================

import './LoadingState.css';

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = 'Carregando...' }: LoadingStateProps) {
  return (
    <div className="loading-state">
      <div className="loading-spinner" />
      <span className="loading-message">{message}</span>
    </div>
  );
}

export default LoadingState;
