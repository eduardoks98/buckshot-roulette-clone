import { useAuth } from '../../context/AuthContext';
import './MultiProviderLogin.css';

interface MultiProviderLoginProps {
  className?: string;
  compact?: boolean;
}

export function MultiProviderLogin({ className = '', compact = false }: MultiProviderLoginProps) {
  const { login, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className={`multi-provider-login ${className}`}>
        <div className="provider-loading">Carregando...</div>
      </div>
    );
  }

  return (
    <div className={`multi-provider-login ${className}`}>
      <button
        onClick={() => login()}
        className="provider-btn provider-btn-portal"
      >
        {!compact && <span>Entrar / Criar Conta</span>}
        {compact && <span>Entrar</span>}
      </button>
    </div>
  );
}

export default MultiProviderLogin;
