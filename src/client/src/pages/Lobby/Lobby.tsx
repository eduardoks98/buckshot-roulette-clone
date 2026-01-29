// ==========================================
// LOBBY PAGE - LoL-Style Room Selection
// ==========================================

import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Header } from '../../components/layout/Header';
import { Footer } from '../../components/layout/Footer';
import { ActiveRooms } from '../../components/home/ActiveRooms';
import { MiniLeaderboard } from '../../components/home/MiniLeaderboard';
import { Changelog } from '../../components/home/Changelog';
import { AdBanner } from '../../components/common/AdBanner';
import { ADSENSE_PUBLISHER_ID, AD_SLOTS, ADSENSE_TEST_MODE } from '../../config';
import { useSounds } from '../../audio/useSounds';
import '../Home/Home.css';

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
