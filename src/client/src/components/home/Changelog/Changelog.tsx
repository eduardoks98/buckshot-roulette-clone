// ==========================================
// CHANGELOG - Ultimas atualizacoes (dinamico)
// ==========================================

import { useState, useEffect } from 'react';
import './Changelog.css';

interface ChangelogEntry {
  version: string;
  date: string;
  title: string;
  changes: string[];
}

const GAME_CODE = import.meta.env.VITE_GAME_CODE || 'BANGSHOT';
const ADMIN_API_URL = import.meta.env.VITE_ADMIN_API_URL || '';

export function Changelog() {
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
      const response = await fetch(`${ADMIN_API_URL}/api/games/${GAME_CODE}/changelog?limit=3`);
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

  // Loading state
  if (loading) {
    return (
      <div className="changelog">
        <h2 className="changelog__title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10 9 9 9 8 9"/>
          </svg>
          ATUALIZACOES
        </h2>
        <div className="changelog__loading">Carregando...</div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="changelog">
        <h2 className="changelog__title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10 9 9 9 8 9"/>
          </svg>
          ATUALIZACOES
        </h2>
        <div className="changelog__error">
          <p>{error}</p>
          <button onClick={() => { setLoading(true); setError(null); fetchChangelog(); }}>
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="changelog">
      <h2 className="changelog__title">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
          <polyline points="10 9 9 9 8 9"/>
        </svg>
        ATUALIZACOES
      </h2>

      <div className="changelog__list">
        {entries.slice(0, 2).map(entry => (
          <div key={entry.version} className="changelog-entry">
            <div className="changelog-entry__header">
              <span className="changelog-entry__version">v{entry.version}</span>
              <span className="changelog-entry__date">{entry.date}</span>
            </div>
            <h4 className="changelog-entry__title">{entry.title}</h4>
            <ul className="changelog-entry__changes">
              {entry.changes.slice(0, 3).map((change, i) => (
                <li key={i}>{change}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Changelog;
