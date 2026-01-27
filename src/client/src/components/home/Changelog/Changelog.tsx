// ==========================================
// CHANGELOG - Ultimas atualizacoes (dinamico)
// ==========================================

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { DocumentIcon, ChevronRightIcon } from '../../icons';
import './Changelog.css';

interface ChangelogEntry {
  version: string;
  date: string;
  title: string;
  content?: string;
  changes?: string[]; // Legacy
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
          <DocumentIcon size={20} />
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
          <DocumentIcon size={20} />
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
        <DocumentIcon size={20} />
        ATUALIZACOES
      </h2>

      <div className="changelog__list">
        {entries.slice(0, 2).map(entry => (
          <Link
            key={entry.version}
            to="/changelog"
            className="changelog-entry changelog-entry--clickable"
          >
            <div className="changelog-entry__header">
              <span className="changelog-entry__version">v{entry.version}</span>
              <span className="changelog-entry__date">{entry.date}</span>
            </div>
            <h4 className="changelog-entry__title">{entry.title}</h4>
          </Link>
        ))}
      </div>

      {entries.length > 0 && (
        <Link to="/changelog" className="changelog__view-all">
          Ver todas as atualizacoes
          <ChevronRightIcon size={16} />
        </Link>
      )}
    </div>
  );
}

export default Changelog;
