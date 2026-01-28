// ==========================================
// ERROR ALERT - Componente de alerta de erro
// ==========================================

import './ErrorAlert.css';

export interface ErrorAlertProps {
  /** Mensagem de erro a exibir */
  message: string;
  /** Callback ao clicar em tentar novamente */
  onRetry?: () => void;
  /** Texto do botão de retry (default: 'Tentar novamente') */
  retryText?: string;
  /** Classe CSS adicional */
  className?: string;
}

/**
 * Componente reutilizável para exibir mensagens de erro
 *
 * @example
 * <ErrorAlert message="Erro ao carregar dados" onRetry={fetchData} />
 *
 * @example
 * <ErrorAlert message={error} />
 */
export function ErrorAlert({
  message,
  onRetry,
  retryText = 'Tentar novamente',
  className = '',
}: ErrorAlertProps) {
  if (!message) return null;

  return (
    <div className={`error-alert ${className}`}>
      <p className="error-alert__message">{message}</p>
      {onRetry && (
        <button className="error-alert__retry" onClick={onRetry}>
          {retryText}
        </button>
      )}
    </div>
  );
}

export default ErrorAlert;
