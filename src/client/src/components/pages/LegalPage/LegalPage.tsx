// ==========================================
// LEGAL PAGE - Componente unificado para páginas legais
// ==========================================

import { useState, useEffect, useMemo } from 'react';
import { marked } from 'marked';
import { Header } from '../../layout/Header';
import { Footer } from '../../layout/Footer';
import { GAME_CODE, ADMIN_API_URL } from '../../../config';
import './LegalPage.css';

interface LegalPageProps {
  endpoint: 'privacy' | 'terms' | 'cookies';
  defaultTitle: string;
  errorMessage: string;
}

export function LegalPage({ endpoint, defaultTitle, errorMessage }: LegalPageProps) {
  const [content, setContent] = useState<string | null>(null);
  const [title, setTitle] = useState<string>(defaultTitle);
  const [effectiveDate, setEffectiveDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchContent();
  }, [endpoint]);

  const fetchContent = async () => {
    if (!ADMIN_API_URL) {
      setError('API nao configurada');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${ADMIN_API_URL}/api/games/${GAME_CODE}/legal/${endpoint}`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || `Erro ao carregar ${defaultTitle.toLowerCase()}`);
        setLoading(false);
        return;
      }

      if (!data.content) {
        setError(errorMessage);
        setLoading(false);
        return;
      }

      setTitle(data.title || defaultTitle);
      setContent(data.content);
      setEffectiveDate(data.effective_date || data.updated_at);
    } catch (err) {
      console.error(`Error fetching ${endpoint}:`, err);
      setError('Erro ao conectar com o servidor');
    } finally {
      setLoading(false);
    }
  };

  // Converter Markdown para HTML
  const htmlContent = useMemo(() => {
    if (!content) return '';
    return marked(content) as string;
  }, [content]);

  return (
    <div className="legal-page-layout">
      <Header variant="simple" />

      <main className="legal-page-content">
        <div className="legal-content">
          <h1 className="legal-page-title">{title.toUpperCase()}</h1>

          {loading && (
            <p className="legal-loading">Carregando...</p>
          )}

          {!loading && (error || !content) && (
            <div className="legal-error">
              <p>{error || 'Conteudo nao disponivel'}</p>
              <button
                className="legal-retry-btn"
                onClick={() => { setLoading(true); setError(null); fetchContent(); }}
              >
                Tentar novamente
              </button>
            </div>
          )}

          {!loading && content && (
            <>
              {effectiveDate && (
                <p className="legal-date">Ultima atualizacao: {effectiveDate}</p>
              )}
              <div
                className="legal-markdown"
                dangerouslySetInnerHTML={{ __html: htmlContent }}
              />
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default LegalPage;
