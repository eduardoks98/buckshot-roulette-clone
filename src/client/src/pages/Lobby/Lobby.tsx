// ==========================================
// LOBBY PAGE - LoL-Style Room Selection
// ==========================================

import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { PageLayout } from '../../components/layout/PageLayout';
import { ActiveRooms } from '../../components/home/ActiveRooms';
import { MiniLeaderboard } from '../../components/home/MiniLeaderboard';
import { Changelog } from '../../components/home/Changelog';
import { BannerAd } from '../../components/advertising';
import { useSounds } from '../../audio/useSounds';
import '../Home/Home.css';

// Debug mode para visualizar placeholder quando não há ads reais
const AD_DEBUG = import.meta.env.DEV;

// Placeholder do ad do lobby (mesmo padrão do PageLayout)
function LobbyAdPlaceholder() {
  return (
    <div className="ad-placeholder ad-placeholder--lobby">
      AD: LOBBY
      <span className="ad-size">300x250</span>
    </div>
  );
}

export default function Lobby() {
  const { isAuthenticated, isLoading } = useAuth();
  const { playMusic } = useSounds();

  // Tocar musica ambiente do menu
  useEffect(() => {
    if (!isLoading) {
      playMusic('ambient-menu');
    }
  }, [isLoading, playMusic]);

  // Loading state
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

  // Redirect to home if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // ==========================================
  // LOBBY PAGE (Authenticated) - LoL Style
  // ==========================================
  return (
    <PageLayout showSideAds={true}>
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
          {/* Ad Banner - Lobby (usa BannerAd com mesmo padrão dos ads laterais) */}
          <div className="lobby-ad">
            <BannerAd
              position="lobby"
              className="lobby-banner-ad"
              fallback={AD_DEBUG ? <LobbyAdPlaceholder /> : null}
            />
          </div>
        </section>
      </main>
    </PageLayout>
  );
}
