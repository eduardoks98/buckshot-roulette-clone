import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home/Home';
import SinglePlayer from './pages/SinglePlayer/SinglePlayer';
import Lobby from './pages/Multiplayer/Lobby/Lobby';
import WaitingRoom from './pages/Multiplayer/WaitingRoom/WaitingRoom';
import MultiplayerGame from './pages/Multiplayer/Game/MultiplayerGame';
import Leaderboard from './pages/Leaderboard/Leaderboard';
import Profile from './pages/Profile/Profile';
import History from './pages/History/History';
import Admin from './pages/Admin/Admin';

function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/singleplayer" element={<SinglePlayer />} />
        <Route path="/multiplayer" element={<Lobby />} />
        <Route path="/multiplayer/room" element={<WaitingRoom />} />
        <Route path="/multiplayer/game" element={<MultiplayerGame />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/history" element={<History />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </div>
  );
}

export default App;
