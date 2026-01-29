// ==========================================
// HOME PAGE - Landing + LoL-Style Lobby
// ==========================================

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Header } from '../../components/layout/Header';
import { Footer } from '../../components/layout/Footer';
import { ActiveRooms } from '../../components/home/ActiveRooms';
import { MiniLeaderboard } from '../../components/home/MiniLeaderboard';
import { Changelog } from '../../components/home/Changelog';
import { AdBanner } from '../../components/common/AdBanner';
import { MultiProviderLogin } from '../../components/auth/MultiProviderLogin';
import { PlayersIcon, StarIcon, AchievementIcon, GridIcon } from '../../components/icons';
import { ADSENSE_PUBLISHER_ID, AD_SLOTS, ADSENSE_TEST_MODE } from '../../config';
import { useSounds } from '../../audio/useSounds';
import './Home.css';

export default function Home() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, login, authError, clearAuthError } = useAuth();
  const { playMusic } = useSounds();

  // Tocar musica ambiente do menu
  useEffect(() => {
    if (!isLoading) {
      playMusic('ambient-menu');
    }
  }, [isLoading, playMusic]);

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
              <MultiProviderLogin className="landing__providers" />
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

  // ==========================================
  // LOBBY PAGE (Authenticated) - LoL Style
  // ==========================================
  return (
    <div className="lobby-container">
      <Header />

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

      <Footer />
    </div>
  );
}
