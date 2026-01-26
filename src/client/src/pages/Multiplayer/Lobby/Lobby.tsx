import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../../../context/SocketContext';
import { useAuth } from '../../../context/AuthContext';
import { PageLayout } from '../../../components/layout/PageLayout';
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
  const { user, isAuthenticated, isLoading } = useAuth();

  // Redirecionar para login se não autenticado
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Usuário não logado - não pode acessar multiplayer
      navigate('/');
    }
  }, [isLoading, isAuthenticated, navigate]);

  // Nome do usuário logado (obrigatório agora)
  const playerName = user?.display_name || '';
  const [roomCode, setRoomCode] = useState('');
  const [roomPassword, setRoomPassword] = useState('');
  const [joinPassword, setJoinPassword] = useState('');
  const [rooms, setRooms] = useState<RoomInfo[]>([]);
  const [error, setError] = useState('');
  const [activeGame, setActiveGame] = useState<ReconnectData | null>(null);
  const [isReconnecting, setIsReconnecting] = useState(false);

  // Conectar ao servidor ao montar (apenas se autenticado)
  useEffect(() => {
    if (!isConnected && isAuthenticated) {
      connect();
    }
  }, [isAuthenticated]);

  // Carregar lista de salas quando conectar
  useEffect(() => {
    if (socket && isConnected) {
      socket.emit('listRooms');
    }
  }, [socket, isConnected]);

  // Verificar se há jogo ativo para reconexão
  useEffect(() => {
    const saved = localStorage.getItem('bangshotReconnect');
    if (saved) {
      try {
        const data: ReconnectData = JSON.parse(saved);
        // Verificar se não expirou (10 minutos - tempo máximo razoável de um jogo)
        // O servidor é quem controla o grace period real de 60s após disconnect
        const elapsed = Date.now() - data.timestamp;
        if (elapsed < 10 * 60 * 1000) {
          setActiveGame(data);
        } else {
          // Expirado - limpar
          localStorage.removeItem('bangshotReconnect');
        }
      } catch {
        localStorage.removeItem('bangshotReconnect');
      }
    }
  }, []);

  // Registrar eventos do socket
  useEffect(() => {
    if (!socket) return;

    socket.on('roomCreated', (data) => {
      console.log('Sala criada:', data.code);
      // Salvar dados da sessão no localStorage
      localStorage.setItem('bangshotSession', JSON.stringify({
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
      localStorage.setItem('bangshotSession', JSON.stringify({
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

    // Quando a lista de salas é atualizada (jogador entrou/saiu de uma sala)
    socket.on('roomListUpdated', () => {
      socket.emit('listRooms');
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
      localStorage.removeItem('bangshotReconnect');
      setError(data.message);
      setTimeout(() => setError(''), 3000);
    });

    // Evento: usuário já está em um jogo (abriu outra aba)
    socket.on('alreadyInGame', (data) => {
      console.log('Usuário já está em um jogo:', data.roomCode, 'gameStarted:', data.gameStarted);
      if (data.gameStarted) {
        // Jogo em andamento - tentar reconectar
        const reconnectData = localStorage.getItem('bangshotReconnect');
        if (reconnectData) {
          try {
            const parsed = JSON.parse(reconnectData);
            if (parsed.roomCode === data.roomCode) {
              // Temos token de reconexão - usar
              socket.emit('reconnectToGame', {
                roomCode: parsed.roomCode,
                playerName: parsed.playerName,
                reconnectToken: parsed.reconnectToken,
              });
              return;
            }
          } catch {
            // Ignora erro de parse
          }
        }
        // Sem token - redirecionar para game e deixar reconectar via socket
        navigate('/multiplayer/game', {
          state: {
            roomCode: data.roomCode,
            needsReconnect: true,
          },
        });
      } else {
        // Ainda na waiting room - redirecionar
        navigate('/multiplayer/room', {
          state: {
            roomCode: data.roomCode,
            fromAlreadyInGame: true,
          },
        });
      }
    });

    return () => {
      socket.off('roomCreated');
      socket.off('roomJoined');
      socket.off('roomList');
      socket.off('roomListUpdated');
      socket.off('joinError');
      socket.off('reconnected');
      socket.off('reconnectError');
      socket.off('alreadyInGame');
    };
  }, [socket, navigate]);

  const handleCreateRoom = () => {
    if (!user) {
      setError('Voce precisa estar logado');
      return;
    }

    // Limpar sessão antiga antes de criar nova sala
    localStorage.removeItem('bangshotSession');

    socket?.emit('createRoom', {
      playerName: playerName,
      password: roomPassword || undefined,
    });
  };

  const handleJoinRoom = () => {
    if (!user) {
      setError('Voce precisa estar logado');
      return;
    }
    if (!roomCode.trim()) {
      setError('Digite o codigo da sala');
      return;
    }

    socket?.emit('joinRoom', {
      code: roomCode.toUpperCase(),
      playerName: playerName,
      password: joinPassword || undefined,
    });
  };

  const handleRefreshRooms = () => {
    socket?.emit('listRooms');
  };

  const handleJoinFromList = (code: string, hasPassword: boolean) => {
    if (!user) {
      setError('Voce precisa estar logado');
      return;
    }

    if (hasPassword) {
      // TODO: Abrir modal de senha
      setRoomCode(code);
      return;
    }

    socket?.emit('joinRoom', {
      code,
      playerName: playerName,
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
    localStorage.removeItem('bangshotReconnect');
    setActiveGame(null);
  };

  // Loading state
  if (isLoading) {
    return (
      <PageLayout>
        <div className="mp-lobby-container">
          <div className="loading-message">Carregando...</div>
        </div>
      </PageLayout>
    );
  }

  // Se não autenticado, não renderizar (vai redirecionar)
  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <PageLayout>
      <div className="mp-lobby-container">
        <h1 className="game-title">CRIAR OU ENTRAR EM SALA</h1>
        <p className="subtitle">2-4 Jogadores Online</p>

        {error && <div className="error-message">{error}</div>}

        {/* Banner de jogo ativo */}
        {activeGame && (
          <div className="active-game-banner">
            <div className="active-game-info">
              <span className="active-game-icon">!</span>
              <div className="active-game-text">
                <strong>Partida em andamento!</strong>
                <p>Sala: {activeGame.roomCode} - {activeGame.playerName}</p>
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
                <p className="no-rooms">Nenhuma sala disponível</p>
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
    </PageLayout>
  );
}
