// ==========================================
// HOME PAGE - Landing + LoL-Style Lobby
// ==========================================

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import LevelBadge from '../../components/common/LevelBadge/LevelBadge';
import BugReportModal from '../../components/common/BugReportModal/BugReportModal';
import { getRankColor } from '../../utils/helpers';
import { ActiveRooms } from '../../components/home/ActiveRooms';
import { MiniLeaderboard } from '../../components/home/MiniLeaderboard';
import { Changelog } from '../../components/home/Changelog';
import { AdBanner } from '../../components/common/AdBanner';
import './Home.css';

// AdSense config - usar variáveis de ambiente do .env
const ADSENSE_PUBLISHER_ID = import.meta.env.VITE_ADSENSE_PUBLISHER_ID || '';
const AD_SLOTS = {
  landing: import.meta.env.VITE_ADSENSE_SLOT_LANDING || '',
  lobby: import.meta.env.VITE_ADSENSE_SLOT_LOBBY || '',
};
const ADSENSE_TEST_MODE = import.meta.env.VITE_ADSENSE_TEST_MODE === 'true';

export default function Home() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading, login, logout, authError, clearAuthError } = useAuth();
  const { socket, isConnected } = useSocket();
  const [onlineCount, setOnlineCount] = useState(0);
  const [showBugReport, setShowBugReport] = useState(false);

  // Fetch online count via REST (no socket needed)
  const fetchOnlineCount = useCallback(async () => {
    try {
      const res = await fetch('/api/online');
      if (res.ok) {
        const data = await res.json();
        setOnlineCount(data.total);
      }
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchOnlineCount();
      const interval = setInterval(fetchOnlineCount, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, fetchOnlineCount]);

  // Also listen for socket broadcasts if connected
  useEffect(() => {
    if (!socket || !isConnected) return;
    const handler = (data: { total: number; inQueue: number }) => {
      setOnlineCount(data.total);
    };
    socket.on('onlineCount', handler);
    return () => { socket.off('onlineCount', handler); };
  }, [socket, isConnected]);

  // ==========================================
  // LOADING STATE - Evita flash durante verificacao de auth
  // ==========================================
  if (isLoading) {
    return (
      <div className="loading-splash">
        <div className="loading-splash__content">
          <h1 className="loading-splash__title">BANG SHOT</h1>
          <div className="loading-splash__spinner" />
        </div>
      </div>
    );
  }

  // ==========================================
  // LANDING PAGE (Non-Authenticated)
  // ==========================================
  if (!isAuthenticated) {
    return (
      <div className="landing">
        {authError && (
          <div className="auth-error-banner">
            <span>{authError}</span>
            <button className="auth-error-close" onClick={clearAuthError}>X</button>
          </div>
        )}

        {/* Hero Section */}
        <section className="landing__hero">
          <div className="landing__hero-content">
            <h1 className="landing__title">
              BANG<span className="landing__title-accent">SHOT</span>
            </h1>
            <p className="landing__tagline">Roleta Russa Multiplayer Online</p>
            <p className="landing__description">
              Teste sua sorte e estrategia neste jogo de tensao onde cada tiro pode ser o ultimo.
              Jogue contra amigos ou desafie jogadores do mundo todo.
            </p>

            <div className="landing__cta">
              <button className="landing__btn landing__btn--primary" onClick={login}>
                <svg viewBox="0 0 24 24" width="20" height="20">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Entrar com Google
              </button>
              <button className="landing__btn landing__btn--secondary" onClick={() => navigate('/singleplayer')}>
                Jogar Solo (Treino)
              </button>
            </div>
          </div>

          <div className="landing__hero-visual">
            <div className="landing__gun-icon">
              <svg viewBox="0 0 100 100" width="200" height="200">
                <circle cx="50" cy="50" r="45" fill="none" stroke="var(--gold-accent)" strokeWidth="2" opacity="0.3"/>
                <circle cx="50" cy="50" r="35" fill="none" stroke="var(--gold-accent)" strokeWidth="1" opacity="0.2"/>
                <circle cx="50" cy="30" r="8" fill="var(--gold-accent)" opacity="0.8"/>
                <circle cx="67" cy="40" r="8" fill="none" stroke="var(--gold-accent)" strokeWidth="2" opacity="0.5"/>
                <circle cx="67" cy="60" r="8" fill="none" stroke="var(--gold-accent)" strokeWidth="2" opacity="0.5"/>
                <circle cx="50" cy="70" r="8" fill="none" stroke="var(--gold-accent)" strokeWidth="2" opacity="0.5"/>
                <circle cx="33" cy="60" r="8" fill="none" stroke="var(--gold-accent)" strokeWidth="2" opacity="0.5"/>
                <circle cx="33" cy="40" r="8" fill="none" stroke="var(--gold-accent)" strokeWidth="2" opacity="0.5"/>
              </svg>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="landing__features">
          <h2 className="landing__section-title">Por que jogar Bang Shot?</h2>
          <div className="landing__features-grid">
            <div className="landing__feature">
              <div className="landing__feature-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </div>
              <h3>Multiplayer Online</h3>
              <p>Jogue com ate 4 jogadores em tempo real. Crie salas privadas ou entre em partidas publicas.</p>
            </div>

            <div className="landing__feature">
              <div className="landing__feature-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
              </div>
              <h3>Sistema de Ranking</h3>
              <p>Suba no ranking com vitorias. Sistema de ELO competitivo com ligas e recompensas.</p>
            </div>

            <div className="landing__feature">
              <div className="landing__feature-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="8" r="7"/>
                  <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>
                </svg>
              </div>
              <h3>Conquistas</h3>
              <p>Desbloqueie conquistas unicas e mostre suas habilidades com titulos exclusivos.</p>
            </div>

            <div className="landing__feature">
              <div className="landing__feature-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <line x1="9" y1="3" x2="9" y2="21"/>
                  <line x1="15" y1="3" x2="15" y2="21"/>
                  <line x1="3" y1="9" x2="21" y2="9"/>
                  <line x1="3" y1="15" x2="21" y2="15"/>
                </svg>
              </div>
              <h3>Itens Estrategicos</h3>
              <p>Use itens como serras, lupas e algemas para virar o jogo a seu favor.</p>
            </div>
          </div>
        </section>

        {/* How to Play Section */}
        <section className="landing__howto">
          <h2 className="landing__section-title">Como Jogar</h2>
          <div className="landing__steps">
            <div className="landing__step">
              <div className="landing__step-number">1</div>
              <h3>Crie ou Entre</h3>
              <p>Faca login com Google e crie uma sala ou entre em uma partida existente.</p>
            </div>
            <div className="landing__step">
              <div className="landing__step-number">2</div>
              <h3>Carregue a Arma</h3>
              <p>A cada rodada, a arma e carregada com balas reais e de festim aleatoriamente.</p>
            </div>
            <div className="landing__step">
              <div className="landing__step-number">3</div>
              <h3>Atire ou Sobreviva</h3>
              <p>Escolha atirar em voce ou no oponente. Use itens para obter vantagem.</p>
            </div>
            <div className="landing__step">
              <div className="landing__step-number">4</div>
              <h3>Venca e Suba</h3>
              <p>O ultimo sobrevivente vence a rodada. Ganhe ELO e suba no ranking!</p>
            </div>
          </div>
        </section>

        {/* Ad Banner */}
        {ADSENSE_PUBLISHER_ID && AD_SLOTS.landing && (
          <div className="landing__ad">
            <AdBanner
              publisherId={ADSENSE_PUBLISHER_ID}
              slotId={AD_SLOTS.landing}
              format="responsive"
              className="ad-landing"
              testMode={ADSENSE_TEST_MODE}
            />
          </div>
        )}

        {/* Footer */}
        <footer className="landing__footer">
          <div className="landing__footer-content">
            <div className="landing__footer-brand">
              <span className="landing__footer-logo">BANGSHOT</span>
              <p>Um jogo de estrategia e sorte.</p>
            </div>
            <div className="landing__footer-links">
              <button onClick={() => navigate('/privacy')}>Privacidade</button>
              <button onClick={() => navigate('/terms')}>Termos de Uso</button>
              <button onClick={() => navigate('/cookies')}>Cookies</button>
            </div>
          </div>
          <div className="landing__footer-bottom">
            <p>© 2024 Bang Shot. Todos os direitos reservados.</p>
          </div>
        </footer>
      </div>
    );
  }

  // ==========================================
  // LOBBY PAGE (Authenticated) - LoL Style
  // ==========================================

  return (
    <div className="lobby-container">
      {/* ===== HEADER ===== */}
      <header className="lobby-header">
        <div className="lobby-header__left">
          <span className="lobby-header__logo">BANG SHOT</span>
        </div>

        <nav className="lobby-header__nav">
          <button className="lobby-nav-item" onClick={() => navigate('/profile')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            <span>Perfil</span>
          </button>
          <button className="lobby-nav-item" onClick={() => navigate('/history')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            <span>Historico</span>
          </button>
          <button className="lobby-nav-item" onClick={() => navigate('/achievements')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="8" r="7"/>
              <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>
            </svg>
            <span>Conquistas</span>
          </button>
          <button className="lobby-nav-item" onClick={() => navigate('/leaderboard')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="20" x2="18" y2="10"/>
              <line x1="12" y1="20" x2="12" y2="4"/>
              <line x1="6" y1="20" x2="6" y2="14"/>
            </svg>
            <span>Ranking</span>
          </button>
          {user?.is_admin && (
            <button className="lobby-nav-item lobby-nav-item--admin" onClick={() => navigate('/admin')}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
              <span>Admin</span>
            </button>
          )}
        </nav>

        <div className="lobby-header__right">
          <div className="lobby-online-count">
            <span className="online-dot" />
            <span>{onlineCount} online</span>
          </div>
          <button
            className="lobby-bug-btn"
            onClick={() => setShowBugReport(true)}
            title="Reportar Bug"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M8 2l1.88 1.88M14.12 3.88L16 2M9 7.13v-1a3 3 0 0 1 6 0v1"/>
              <path d="M12 20c-3.3 0-6-2.7-6-6v-3a6 6 0 0 1 12 0v3c0 3.3-2.7 6-6 6z"/>
              <path d="M12 20v2M6 13H2M22 13h-4M6 17l-2 2M18 17l2 2"/>
            </svg>
          </button>
          <div className="lobby-header__user" onClick={() => navigate('/profile')}>
            <div className="lobby-header__avatar-wrapper">
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt={user.display_name} className="lobby-header__avatar" />
              ) : (
                <div className="lobby-header__avatar lobby-header__avatar--placeholder">
                  {user?.display_name?.charAt(0)?.toUpperCase() || '?'}
                </div>
              )}
              <div className="lobby-header__level-badge">
                <LevelBadge totalXp={user?.total_xp || 0} size="sm" />
              </div>
            </div>
            <div className="lobby-header__user-info">
              <span className="lobby-header__username">{user?.display_name}</span>
              <span className="lobby-header__rank" style={{ color: getRankColor(user?.rank || '') }}>
                {user?.rank}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* ===== MAIN BODY ===== */}
      <main className="lobby-body">
        {/* Left Column - Active Rooms */}
        <section className="lobby-body__left">
          <ActiveRooms />
        </section>

        {/* Right Column - Leaderboard + Changelog + Ad */}
        <section className="lobby-body__right">
          <MiniLeaderboard />
          <Changelog />
          {/* Ad Banner - Lobby */}
          {ADSENSE_PUBLISHER_ID && AD_SLOTS.lobby && (
            <div className="lobby-ad">
              <AdBanner
                publisherId={ADSENSE_PUBLISHER_ID}
                slotId={AD_SLOTS.lobby}
                format="rectangle"
                className="ad-lobby"
                testMode={ADSENSE_TEST_MODE}
              />
            </div>
          )}
        </section>
      </main>

      {/* ===== FOOTER ===== */}
      <footer className="lobby-footer">
        <span className="lobby-footer__version">Bang Shot v1.0</span>
        <div className="lobby-footer__links">
          <button onClick={() => navigate('/privacy')} className="lobby-footer__link">Privacidade</button>
          <button onClick={() => navigate('/terms')} className="lobby-footer__link">Termos</button>
          <button onClick={() => navigate('/cookies')} className="lobby-footer__link">Cookies</button>
        </div>
        <button className="lobby-footer__logout" onClick={logout}>
          Sair
        </button>
      </footer>

      {/* Bug Report Modal */}
      <BugReportModal
        isOpen={showBugReport}
        onClose={() => setShowBugReport(false)}
      />
    </div>
  );
}
