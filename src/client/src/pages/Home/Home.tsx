// ==========================================
// HOME PAGE - Landing Page
// ==========================================

import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTabSync } from '../../context/TabSyncContext';
import { Footer } from '../../components/layout/Footer';
import { AdBanner } from '../../components/common/AdBanner';
import { PlayersIcon, StarIcon, AchievementIcon, GridIcon } from '../../components/icons';
import { ADSENSE_PUBLISHER_ID, AD_SLOTS, ADSENSE_TEST_MODE, PORTAL_URL } from '../../config';
import { useSounds } from '../../audio/useSounds';
import './Home.css';

// TabSyncProvider no main.tsx já gerencia overlay e sincronização automaticamente

export default function Home() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, authError, clearAuthError, user, logout, login } = useAuth();
  const { playMusic } = useSounds();
  const { isFocused } = useTabSync();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setDropdownOpen(false);
    await logout();
    navigate('/');
  };

  // Tocar musica ambiente do menu (só quando focado)
  useEffect(() => {
    if (!isLoading && isFocused) {
      playMusic('ambient-menu');
    }
  }, [isLoading, isFocused, playMusic]);

  // ==========================================
  // LOADING STATE
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
  // LANDING PAGE (Always shown)
  // ==========================================
  // Overlay é gerenciado automaticamente pelo TabSyncProvider
  return (
    <div className="landing">
      {/* Header igual ao portal */}
      <header className="landing__header">
        <div className="landing__header-content">
          <div className="landing__header-left">
            <a href={PORTAL_URL} className="landing__logo">
              <div className="landing__logo-icon">M</div>
              <span>MySys Games</span>
            </a>
          </div>
          <div className="landing__header-right">
            {isAuthenticated && user ? (
              <div
                ref={dropdownRef}
                className={`user-profile ${dropdownOpen ? 'open' : ''}`}
              >
                <div
                  className="user-profile-trigger"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                >
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt="Avatar" className="user-avatar" />
                  ) : (
                    <div className="user-avatar user-avatar--placeholder">
                      {(user.nickname || user.display_name || 'U')[0].toUpperCase()}
                    </div>
                  )}
                  <span className="user-name">{user.nickname || user.display_name}</span>
                  <svg className="dropdown-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 9l6 6 6-6"/>
                  </svg>
                </div>
                {dropdownOpen && (
                  <div className="user-dropdown">
                    <div className="dropdown-header">
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt="Avatar" className="user-avatar-large" />
                      ) : (
                        <div className="user-avatar-large user-avatar--placeholder">
                          {(user.nickname || user.display_name || 'U')[0].toUpperCase()}
                        </div>
                      )}
                      <div className="dropdown-header-info">
                        <div className="user-name-large">{user.nickname || user.display_name}</div>
                        <div className="user-email">{user.email}</div>
                      </div>
                    </div>
                    <div className="dropdown-menu">
                      <button className="dropdown-item logout" onClick={handleLogout}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
                          <polyline points="16,17 21,12 16,7"/>
                          <line x1="21" y1="12" x2="9" y2="12"/>
                        </svg>
                        Sair
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button onClick={login} className="btn-login btn-primary-outline">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: 18, height: 18 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"></path>
                </svg>
                <span>Entrar</span>
              </button>
            )}
          </div>
        </div>
      </header>

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
            {isAuthenticated ? (
              <button className="landing__btn landing__btn--primary" onClick={() => navigate('/lobby')}>
                Multiplayer
              </button>
            ) : (
              <button onClick={login} className="landing__btn landing__btn--gold">
                Entrar / Criar Conta
              </button>
            )}
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
                <PlayersIcon size={32} />
              </div>
              <h3>Multiplayer Online</h3>
              <p>Jogue com ate 4 jogadores em tempo real. Crie salas privadas ou entre em partidas publicas.</p>
            </div>

            <div className="landing__feature">
              <div className="landing__feature-icon">
                <StarIcon size={32} />
              </div>
              <h3>Sistema de Ranking</h3>
              <p>Suba no ranking com vitorias. Sistema de ELO competitivo com ligas e recompensas.</p>
            </div>

            <div className="landing__feature">
              <div className="landing__feature-icon">
                <AchievementIcon size={32} />
              </div>
              <h3>Conquistas</h3>
              <p>Desbloqueie conquistas unicas e mostre suas habilidades com titulos exclusivos.</p>
            </div>

            <div className="landing__feature">
              <div className="landing__feature-icon">
                <GridIcon size={32} />
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
              <p>Faca login e crie uma sala ou entre em uma partida existente.</p>
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
        <Footer />
      </div>
    );
}
