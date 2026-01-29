import { useAuth, OAuthProvider, AvailableProvider } from '../../context/AuthContext';
import { GoogleIcon } from '../icons/ui/GoogleIcon';
import { FacebookIcon } from '../icons/ui/FacebookIcon';
import { DiscordIcon } from '../icons/ui/DiscordIcon';
import './MultiProviderLogin.css';

interface MultiProviderLoginProps {
  className?: string;
  compact?: boolean;
}

const providerIcons: Record<OAuthProvider, React.FC<{ size?: number | 'sm' | 'md' | 'lg' }>> = {
  google: GoogleIcon,
  facebook: FacebookIcon,
  discord: DiscordIcon,
};

const providerColors: Record<OAuthProvider, string> = {
  google: '#ffffff',
  facebook: '#1877F2',
  discord: '#5865F2',
};

export function MultiProviderLogin({ className = '', compact = false }: MultiProviderLoginProps) {
  const { login, availableProviders, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className={`multi-provider-login ${className}`}>
        <div className="provider-loading">Carregando...</div>
      </div>
    );
  }

  if (availableProviders.length === 0) {
    return (
      <div className={`multi-provider-login ${className}`}>
        <button
          onClick={() => login('google')}
          className="provider-btn provider-btn-google"
        >
          <GoogleIcon size="md" />
          {!compact && <span>Entrar com Google</span>}
        </button>
      </div>
    );
  }

  return (
    <div className={`multi-provider-login ${compact ? 'compact' : ''} ${className}`}>
      {availableProviders.map((provider: AvailableProvider) => {
        const Icon = providerIcons[provider.id];
        return (
          <button
            key={provider.id}
            onClick={() => login(provider.id)}
            className={`provider-btn provider-btn-${provider.id}`}
            style={{ '--provider-color': providerColors[provider.id] } as React.CSSProperties}
          >
            {Icon && <Icon size="md" />}
            {!compact && <span>Entrar com {provider.name}</span>}
          </button>
        );
      })}
    </div>
  );
}

export default MultiProviderLogin;
