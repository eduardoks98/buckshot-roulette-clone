import { Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home/Home';
import Lobby from './pages/Lobby/Lobby';
import WaitingRoom from './pages/Multiplayer/WaitingRoom/WaitingRoom';
import MultiplayerGame from './pages/Multiplayer/Game/MultiplayerGame';
import Leaderboard from './pages/Leaderboard/Leaderboard';
import Profile from './pages/Profile/Profile';
import Achievements from './pages/Achievements/Achievements';
import PrivacyPolicy from './pages/PrivacyPolicy/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService/TermsOfService';
import CookiePolicy from './pages/CookiePolicy/CookiePolicy';
import ChangelogPage from './pages/ChangelogPage/ChangelogPage';
import Debug from './pages/Debug/Debug';
// Preview movido para main.tsx (fora dos providers)
import { useSocket } from './context/SocketContext';
import { SessionInvalidatedModal } from './components/common/SessionInvalidatedModal';
import { ActiveGameModal } from './components/common/ActiveGameModal';

// TabSyncProvider no main.tsx já gerencia overlay e sincronização automaticamente

function App() {
  const { isSessionInvalidated, sessionInvalidatedReason } = useSocket();

  return (
    <div className="app">
      {/* Modal de sessao invalidada (limite de 1 aba) */}
      <SessionInvalidatedModal
        isVisible={isSessionInvalidated}
        reason={sessionInvalidatedReason}
      />

      {/* Modal de jogo ativo - aparece em qualquer pagina */}
      <ActiveGameModal />

      <Routes>
        {/* Preview movido para main.tsx (fora dos providers) */}
        <Route path="/" element={<Home />} />
        <Route path="/lobby" element={<Lobby />} />
        {/* /multiplayer redireciona para /lobby */}
        <Route path="/multiplayer" element={<Navigate to="/lobby" replace />} />
        <Route path="/multiplayer/room" element={<WaitingRoom />} />
        <Route path="/multiplayer/game" element={<MultiplayerGame />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/achievements" element={<Achievements />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/cookies" element={<CookiePolicy />} />
        <Route path="/changelog" element={<ChangelogPage />} />
        {/* Debug page - protected by isAdmin check inside component */}
        <Route path="/debug" element={<Debug />} />
      </Routes>
    </div>
  );
}

export default App;
