// ==========================================
// CHANGELOG - Ultimas atualizacoes
// ==========================================

import './Changelog.css';

interface ChangelogEntry {
  version: string;
  date: string;
  title: string;
  changes: string[];
}

const CHANGELOG: ChangelogEntry[] = [
  {
    version: '1.1.0',
    date: '25/01/2026',
    title: 'Sistema de Gamificacao',
    changes: [
      'Sistema de XP e niveis adicionado',
      'Conquistas e badges implementados',
      'Central de chamados com integracao GitHub',
    ],
  },
  {
    version: '1.0.0',
    date: '20/01/2026',
    title: 'Lancamento Oficial',
    changes: [
      'Lancamento oficial do Bang Shot!',
      'Sistema de ELO para ranqueadas',
      'Multiplayer ate 4 jogadores',
      'Modo solo contra IA',
    ],
  },
];

export function Changelog() {
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
        {CHANGELOG.slice(0, 2).map(entry => (
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
