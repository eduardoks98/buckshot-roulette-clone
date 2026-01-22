import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../../../context/SocketContext';
import { useAuth } from '../../../context/AuthContext';
import type { RoomInfo } from '../../../../../shared/types/socket-events.types';
import './Lobby.css';

interface ReconnectData {
  roomCode: string;
  playerName: string;
  reconnectToken: string;
  timestamp: number;
}

export default function Lobby() {
  const navigate = useNavigate();
  const { socket, isConnected, connect } = useSocket();
  const { user } = useAuth();

  // Usar nome do usuário logado se disponível
  const [playerName, setPlayerName] = useState(user?.displayName || '');

  // Atualizar nome quando usuário logar
  useEffect(() => {
    if (user?.displayName && !playerName) {
      setPlayerName(user.displayName);
    }
  }, [user, playerName]);
  const [roomCode, setRoomCode] = useState('');
  const [roomPassword, setRoomPassword] = useState('');
  const [joinPassword, setJoinPassword] = useState('');
  const [rooms, setRooms] = useState<RoomInfo[]>([]);
  const [error, setError] = useState('');
  const [activeGame, setActiveGame] = useState<ReconnectData | null>(null);
  const [isReconnecting, setIsReconnecting] = useState(false);

  // Conectar ao servidor ao montar
  useEffect(() => {
    if (!isConnected) {
      connect();
    }
  }, []);

  // Verificar se há jogo ativo para reconexão
  useEffect(() => {
    const saved = localStorage.getItem('buckshotReconnect');
    if (saved) {
      try {
        const data: ReconnectData = JSON.parse(saved);
        // Verificar se não expirou (60 segundos)
        const elapsed = Date.now() - data.timestamp;
        if (elapsed < 60000) {
          setActiveGame(data);
        } else {
          // Expirado - limpar
          localStorage.removeItem('buckshotReconnect');
        }
      } catch {
        localStorage.removeItem('buckshotReconnect');
      }
    }
  }, []);

  // Registrar eventos do socket
  useEffect(() => {
    if (!socket) return;

    socket.on('roomCreated', (data) => {
      console.log('Sala criada:', data.code);
      // Salvar dados da sessão no localStorage
      localStorage.setItem('buckshotSession', JSON.stringify({
        roomCode: data.code,
        playerName: playerName.trim(),
        isHost: data.isHost,
        timestamp: Date.now(),
      }));
      navigate('/multiplayer/room', {
        state: {
          roomCode: data.code,
          isHost: data.isHost,
          players: data.players,
        },
      });
    });

    socket.on('roomJoined', (data) => {
      console.log('Entrou na sala:', data.code);
      // Salvar dados da sessão no localStorage
      localStorage.setItem('buckshotSession', JSON.stringify({
        roomCode: data.code,
        playerName: playerName.trim(),
        isHost: data.isHost,
        timestamp: Date.now(),
      }));
      navigate('/multiplayer/room', {
        state: {
          roomCode: data.code,
          isHost: data.isHost,
          players: data.players,
        },
      });
    });

    socket.on('roomList', (roomList) => {
      setRooms(roomList);
    });

    socket.on('joinError', (message) => {
      setError(message);
      setTimeout(() => setError(''), 3000);
    });

    // Eventos de reconexão
    socket.on('reconnected', (data) => {
      console.log('Reconectado ao jogo:', data.roomCode);
      setIsReconnecting(false);
      navigate('/multiplayer/game', {
        state: {
          roomCode: data.roomCode,
          reconnected: true,
          gameState: data,
        },
      });
    });

    socket.on('reconnectError', (data) => {
      console.log('Erro ao reconectar:', data.message);
      setIsReconnecting(false);
      setActiveGame(null);
      localStorage.removeItem('buckshotReconnect');
      setError(data.message);
      setTimeout(() => setError(''), 3000);
    });

    return () => {
      socket.off('roomCreated');
      socket.off('roomJoined');
      socket.off('roomList');
      socket.off('joinError');
      socket.off('reconnected');
      socket.off('reconnectError');
    };
  }, [socket, navigate]);

  const handleCreateRoom = () => {
    if (!playerName.trim()) {
      setError('Digite seu nome');
      return;
    }

    socket?.emit('createRoom', {
      playerName: playerName.trim(),
      password: roomPassword || undefined,
    });
  };

  const handleJoinRoom = () => {
    if (!playerName.trim()) {
      setError('Digite seu nome');
      return;
    }
    if (!roomCode.trim()) {
      setError('Digite o código da sala');
      return;
    }

    socket?.emit('joinRoom', {
      code: roomCode.toUpperCase(),
      playerName: playerName.trim(),
      password: joinPassword || undefined,
    });
  };

  const handleRefreshRooms = () => {
    socket?.emit('listRooms');
  };

  const handleJoinFromList = (code: string, hasPassword: boolean) => {
    if (!playerName.trim()) {
      setError('Digite seu nome primeiro');
      return;
    }

    if (hasPassword) {
      // TODO: Abrir modal de senha
      setRoomCode(code);
      return;
    }

    socket?.emit('joinRoom', {
      code,
      playerName: playerName.trim(),
    });
  };

  const handleReconnect = () => {
    if (!activeGame || !socket) return;

    setIsReconnecting(true);
    socket.emit('reconnectToGame', {
      roomCode: activeGame.roomCode,
      playerName: activeGame.playerName,
      reconnectToken: activeGame.reconnectToken,
    });
  };

  const handleAbandonGame = () => {
    localStorage.removeItem('buckshotReconnect');
    setActiveGame(null);
  };

  return (
    <div className="lobby-container">
      <button className="back-btn" onClick={() => navigate('/')}>
        ← Voltar
      </button>

      <h1 className="game-title">MULTIPLAYER</h1>
      <p className="subtitle">2-4 Jogadores Online</p>

      {error && <div className="error-message">{error}</div>}

      {/* Banner de jogo ativo */}
      {activeGame && (
        <div className="active-game-banner">
          <div className="active-game-info">
            <span className="active-game-icon">⚠️</span>
            <div className="active-game-text">
              <strong>Partida em andamento!</strong>
              <p>Sala: {activeGame.roomCode} • {activeGame.playerName}</p>
            </div>
          </div>
          <div className="active-game-actions">
            <button
              className="reconnect-btn"
              onClick={handleReconnect}
              disabled={isReconnecting || !isConnected}
            >
              {isReconnecting ? 'Reconectando...' : 'VOLTAR AO JOGO'}
            </button>
            <button
              className="abandon-btn"
              onClick={handleAbandonGame}
              disabled={isReconnecting}
            >
              DESISTIR
            </button>
          </div>
        </div>
      )}

      {!isConnected && (
        <div className="connecting-message">
          Conectando ao servidor...
        </div>
      )}

      <div className="lobby-form">
        <input
          type="text"
          placeholder="Seu nome"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          maxLength={15}
          className="lobby-input"
        />

        {/* Criar Sala */}
        <div className="create-section">
          <h3>Criar Sala</h3>
          <input
            type="password"
            placeholder="Senha (opcional)"
            value={roomPassword}
            onChange={(e) => setRoomPassword(e.target.value)}
            maxLength={20}
            className="lobby-input"
          />
          <button
            className="main-btn"
            onClick={handleCreateRoom}
            disabled={!isConnected}
          >
            CRIAR SALA
          </button>
        </div>

        {/* Entrar com Código */}
        <div className="join-section">
          <h3>Entrar com Código</h3>
          <input
            type="text"
            placeholder="CÓDIGO"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            maxLength={6}
            className="lobby-input code-input"
          />
          <input
            type="password"
            placeholder="Senha (se tiver)"
            value={joinPassword}
            onChange={(e) => setJoinPassword(e.target.value)}
            maxLength={20}
            className="lobby-input"
          />
          <button
            className="main-btn secondary"
            onClick={handleJoinRoom}
            disabled={!isConnected}
          >
            ENTRAR
          </button>
        </div>

        {/* Lista de Salas */}
        <div className="rooms-section">
          <div className="rooms-header">
            <h3>SALAS DISPONÍVEIS</h3>
            <button
              className="refresh-btn"
              onClick={handleRefreshRooms}
              disabled={!isConnected}
            >
              🔄
            </button>
          </div>
          <div className="room-list">
            {rooms.length === 0 ? (
              <p className="no-rooms">Clique em 🔄 para atualizar</p>
            ) : (
              rooms.map((room) => (
                <div key={room.code} className="room-item">
                  <span className="room-host">{room.hostName}</span>
                  <span className="room-code">{room.code}</span>
                  <span className="room-players">
                    {room.playerCount}/{room.maxPlayers}
                  </span>
                  {room.hasPassword && <span className="room-lock">🔒</span>}
                  <button
                    className="join-btn"
                    onClick={() => handleJoinFromList(room.code, room.hasPassword)}
                  >
                    ENTRAR
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
