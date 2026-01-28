import { Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home/Home';
import SinglePlayer from './pages/SinglePlayer/SinglePlayer';
import WaitingRoom from './pages/Multiplayer/WaitingRoom/WaitingRoom';
import MultiplayerGame from './pages/Multiplayer/Game/MultiplayerGame';
import Leaderboard from './pages/Leaderboard/Leaderboard';
import Profile from './pages/Profile/Profile';
import History from './pages/History/History';
import Achievements from './pages/Achievements/Achievements';
import PrivacyPolicy from './pages/PrivacyPolicy/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService/TermsOfService';
import CookiePolicy from './pages/CookiePolicy/CookiePolicy';
import ChangelogPage from './pages/ChangelogPage/ChangelogPage';
import AudioTest from './pages/AudioTest/AudioTest';

function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/singleplayer" element={<SinglePlayer />} />
        {/* /multiplayer agora redireciona para Home - criacao de sala eh feita la */}
        <Route path="/multiplayer" element={<Navigate to="/" replace />} />
        <Route path="/multiplayer/room" element={<WaitingRoom />} />
        <Route path="/multiplayer/game" element={<MultiplayerGame />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/history" element={<History />} />
        <Route path="/achievements" element={<Achievements />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/cookies" element={<CookiePolicy />} />
        <Route path="/changelog" element={<ChangelogPage />} />
        {/* AudioTest só disponível em desenvolvimento */}
        {import.meta.env.DEV && (
          <Route path="/audio-test" element={<AudioTest />} />
        )}
      </Routes>
    </div>
  );
}

export default App;
