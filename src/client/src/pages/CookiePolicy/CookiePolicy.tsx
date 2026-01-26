// ==========================================
// COOKIE POLICY PAGE (dinamico)
// ==========================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../PrivacyPolicy/PrivacyPolicy.css';

const GAME_CODE = import.meta.env.VITE_GAME_CODE || 'BANGSHOT';
const ADMIN_API_URL = import.meta.env.VITE_ADMIN_API_URL || '';

export default function CookiePolicy() {
  const navigate = useNavigate();
  const [content, setContent] = useState<string | null>(null);
  const [title, setTitle] = useState<string>('Politica de Cookies');
  const [effectiveDate, setEffectiveDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCookiePolicy();
  }, []);

  const fetchCookiePolicy = async () => {
    if (!ADMIN_API_URL) {
      setError('API nao configurada');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${ADMIN_API_URL}/api/games/${GAME_CODE}/legal/cookies`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Erro ao carregar politica de cookies');
        setLoading(false);
        return;
      }

      if (!data.content) {
        setError('Politica de cookies nao encontrada');
        setLoading(false);
        return;
      }

      setTitle(data.title || 'Politica de Cookies');
      setContent(data.content);
      setEffectiveDate(data.effective_date || data.updated_at);
    } catch (err) {
      console.error('Error fetching cookie policy:', err);
      setError('Erro ao conectar com o servidor');
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="legal-page">
        <div className="legal-container">
          <button className="back-button" onClick={() => navigate(-1)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Voltar
          </button>
          <h1>Politica de Cookies</h1>
          <p className="loading-text">Carregando...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !content) {
    return (
      <div className="legal-page">
        <div className="legal-container">
          <button className="back-button" onClick={() => navigate(-1)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Voltar
          </button>
          <h1>Politica de Cookies</h1>
          <div className="legal-error">
            <p>{error || 'Conteudo nao disponivel'}</p>
            <button className="retry-button" onClick={() => { setLoading(true); setError(null); fetchCookiePolicy(); }}>
              Tentar novamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Success - show dynamic content
  return (
    <div className="legal-page">
      <div className="legal-container">
        <button className="back-button" onClick={() => navigate(-1)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Voltar
        </button>

        <h1>{title}</h1>
        {effectiveDate && (
          <p className="last-updated">Ultima atualizacao: {effectiveDate}</p>
        )}

        <div
          className="legal-dynamic-content"
          dangerouslySetInnerHTML={{ __html: content }}
        />

        <div className="legal-footer">
          <p>© {new Date().getFullYear()} Bang Shot. Todos os direitos reservados.</p>
        </div>
      </div>
    </div>
  );
}
