// ==========================================
// RECENT FORM - Exibe forma recente (W/L)
// ==========================================

import './RecentForm.css';

export interface RecentFormProps {
  /** Array de resultados ('W' ou 'L') */
  results: ('W' | 'L')[];
  /** Quantidade máxima de resultados a exibir (default: 10) */
  maxDisplay?: number;
  /** Label a exibir (default: 'Forma Recente') */
  label?: string;
  /** Esconder label */
  hideLabel?: boolean;
  /** Tamanho dos ícones: 'sm' | 'md' | 'lg' */
  size?: 'sm' | 'md' | 'lg';
  /** Classe CSS adicional */
  className?: string;
}

/**
 * Componente reutilizável para exibir forma recente (vitórias/derrotas)
 *
 * @example
 * <RecentForm results={['W', 'L', 'W', 'W', 'L']} />
 *
 * @example
 * <RecentForm results={recentForm} maxDisplay={5} size="sm" hideLabel />
 */
export function RecentForm({
  results,
  maxDisplay = 10,
  label = 'Forma Recente',
  hideLabel = false,
  size = 'md',
  className = '',
}: RecentFormProps) {
  if (!results || results.length === 0) return null;

  const displayResults = results.slice(0, maxDisplay);

  return (
    <div className={`recent-form recent-form--${size} ${className}`}>
      {!hideLabel && (
        <span className="recent-form__label">{label}</span>
      )}
      <div className="recent-form__icons">
        {displayResults.map((result, i) => (
          <span
            key={i}
            className={`recent-form__icon ${result === 'W' ? 'recent-form__icon--win' : 'recent-form__icon--loss'}`}
          >
            {result}
          </span>
        ))}
      </div>
    </div>
  );
}

export default RecentForm;
