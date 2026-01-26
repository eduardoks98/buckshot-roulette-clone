// ==========================================
// CHANGELOG PAGE - Historico de atualizacoes
// ==========================================

import { useState, useEffect } from 'react';
import { marked } from 'marked';
import { Header } from '../../components/layout/Header';
import { Footer } from '../../components/layout/Footer';
import { GAME_CODE, ADMIN_API_URL } from '../../config';
import './ChangelogPage.css';

interface ChangelogEntry {
  version: string;
  date: string;
  title: string;
  content?: string;
  changes?: string[];
}

export default function ChangelogPage() {
  const [entries, setEntries] = useState<ChangelogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchChangelog();
  }, []);

  const fetchChangelog = async () => {
    if (!ADMIN_API_URL) {
      setError('API nao configurada');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${ADMIN_API_URL}/api/games/${GAME_CODE}/changelog?limit=20`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Erro ao carregar changelog');
        setLoading(false);
        return;
      }

      if (!data.entries || data.entries.length === 0) {
        setError('Nenhuma atualizacao disponivel');
        setLoading(false);
        return;
      }

      setEntries(data.entries);
    } catch (err) {
      console.error('Error fetching changelog:', err);
      setError('Erro ao conectar com o servidor');
    } finally {
      setLoading(false);
    }
  };

  // Converter Markdown para HTML
  const parseContent = (content: string) => {
    return marked(content) as string;
  };

  return (
    <div className="changelog-page-layout">
      <Header variant="simple" />

      <main className="changelog-page-content">
        <div className="changelog-page-container">
          <h1 className="changelog-page-title">ATUALIZACOES</h1>
          <p className="changelog-page-subtitle">Historico de versoes e mudancas do Bang Shot</p>

          {loading && (
            <p className="changelog-loading">Carregando...</p>
          )}

          {!loading && error && (
            <div className="changelog-error">
              <p>{error}</p>
              <button
                className="changelog-retry-btn"
                onClick={() => { setLoading(true); setError(null); fetchChangelog(); }}
              >
                Tentar novamente
              </button>
            </div>
          )}

          {!loading && !error && entries.length > 0 && (
            <div className="changelog-entries">
              {entries.map((entry, index) => (
                <article key={entry.version} className="changelog-entry-card">
                  <header className="changelog-entry-header">
                    <div className="changelog-entry-meta">
                      <span className="changelog-version">v{entry.version}</span>
                      <span className="changelog-date">{entry.date}</span>
                      {index === 0 && <span className="changelog-latest">Mais recente</span>}
                    </div>
                    <h2 className="changelog-entry-title">{entry.title}</h2>
                  </header>

                  <div className="changelog-entry-body">
                    {entry.content ? (
                      <div
                        className="changelog-markdown"
                        dangerouslySetInnerHTML={{ __html: parseContent(entry.content) }}
                      />
                    ) : entry.changes && entry.changes.length > 0 ? (
                      <ul className="changelog-changes-list">
                        {entry.changes.map((change, i) => (
                          <li key={i}>{change}</li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
