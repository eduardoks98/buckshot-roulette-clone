// ==========================================
// OAUTH CALLBACK PAGE
// ==========================================

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { exchangeCodeForTokens } from '../../services/oauth.service';
import './Callback.css';

const TOKEN_KEY = 'bangshot_auth_token';

export default function Callback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');

  useEffect(() => {
    const handleCallback = async () => {
      // Check for error in URL
      const errorParam = searchParams.get('error');
      if (errorParam) {
        const errorDesc = searchParams.get('error_description') || errorParam;
        setError(errorDesc);
        setStatus('error');
        return;
      }

      // Get code and state from URL
      const code = searchParams.get('code');
      const state = searchParams.get('state');

      if (!code) {
        setError('Authorization code not received');
        setStatus('error');
        return;
      }

      if (!state) {
        setError('State parameter missing');
        setStatus('error');
        return;
      }

      console.log('[OAuth Callback] Exchanging code for tokens');

      // Exchange code for tokens
      const result = await exchangeCodeForTokens(code, state);

      if (!result.success || !result.token) {
        setError(result.error || 'Authentication failed');
        setStatus('error');
        return;
      }

      // Store token
      localStorage.setItem(TOKEN_KEY, result.token);

      console.log('[OAuth Callback] Authentication successful');
      setStatus('success');

      // Redirect to multiplayer lobby
      setTimeout(() => {
        navigate('/multiplayer', { replace: true });
      }, 500);
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <div className="callback-container">
      <div className="callback-content">
        {status === 'processing' && (
          <>
            <div className="callback-spinner" />
            <h2>Autenticando...</h2>
            <p>Aguarde enquanto verificamos suas credenciais.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="callback-success">✓</div>
            <h2>Login realizado!</h2>
            <p>Redirecionando para o jogo...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="callback-error">✕</div>
            <h2>Erro na autenticação</h2>
            <p>{error}</p>
            <button className="callback-btn" onClick={() => navigate('/')}>
              Voltar ao início
            </button>
          </>
        )}
      </div>
    </div>
  );
}
