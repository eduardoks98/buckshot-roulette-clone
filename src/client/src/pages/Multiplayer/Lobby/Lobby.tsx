import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../../../context/SocketContext';
import { useAuth } from '../../../context/AuthContext';
import { PageLayout } from '../../../components/layout/PageLayout';
import type { RoomInfo } from '../../../../../shared/types/socket-events.types';
import './Lobby.css';

// Interface simplificada - servidor é a fonte da verdade
interface ActiveGameData {
  roomCode: string;
  gameStarted: boolean;
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
  const [activeGame, setActiveGame] = useState<ActiveGameData | null>(null);
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

  // Servidor vai notificar se usuário já está em um jogo via evento 'alreadyInGame'
  // Não precisamos mais verificar localStorage

  // Registrar eventos do socket
  useEffect(() => {
    if (!socket) return;

    socket.on('roomCreated', (data) => {
      console.log('Sala criada:', data.code);
      // Servidor gerencia o estado - não precisa salvar no localStorage
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
      // Servidor gerencia o estado - não precisa salvar no localStorage
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
      setError(data.message);
      setTimeout(() => setError(''), 3000);
    });

    // Evento quando o jogador abandona o jogo com sucesso
    socket.on('gameAbandoned', () => {
      console.log('Jogo abandonado com sucesso');
      setActiveGame(null);
    });

    // Evento: usuário já está em um jogo
    // NÃO navegar automaticamente - mostrar banner com opções
    socket.on('alreadyInGame', (data) => {
      console.log('Usuário já está em um jogo:', data.roomCode, 'gameStarted:', data.gameStarted);
      // Mostrar banner de reconexão ao invés de navegar automaticamente
      setActiveGame({
        roomCode: data.roomCode,
        gameStarted: data.gameStarted,
      });
    });

    return () => {
      socket.off('roomCreated');
      socket.off('roomJoined');
      socket.off('roomList');
      socket.off('roomListUpdated');
      socket.off('joinError');
      socket.off('reconnected');
      socket.off('reconnectError');
      socket.off('gameAbandoned');
      socket.off('alreadyInGame');
    };
  }, [socket, navigate]);

  const handleCreateRoom = () => {
    if (!user) {
      setError('Voce precisa estar logado');
      return;
    }

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
    // Servidor sabe quem somos pelo odUserId - não precisa de token
    socket.emit('rejoinGame', { roomCode: activeGame.roomCode });
  };

  const handleAbandonGame = () => {
    if (!activeGame || !socket) return;
    // Notificar servidor para remover jogador da sala
    socket.emit('abandonGame', { roomCode: activeGame.roomCode });
    // O estado será limpo quando receber 'gameAbandoned'
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
                <strong>{activeGame.gameStarted ? 'Partida em andamento!' : 'Você está em uma sala!'}</strong>
                <p>Sala: {activeGame.roomCode}</p>
              </div>
            </div>
            <div className="active-game-actions">
              <button
                className="reconnect-btn"
                onClick={handleReconnect}
                disabled={isReconnecting || !isConnected}
              >
                {isReconnecting ? 'Reconectando...' : 'VOLTAR'}
              </button>
              <button
                className="abandon-btn"
                onClick={handleAbandonGame}
                disabled={isReconnecting}
              >
                SAIR DA SALA
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
