// ==========================================
// WAITING ROOM PAGE
// ==========================================

import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSocket } from '../../../context/SocketContext';
import { useAuth } from '../../../context/AuthContext';
import { PageLayout, InlineAd } from '../../../components/layout/PageLayout';
import { PlayerPublicState } from '../../../../../shared/types';
import { GAME_RULES } from '../../../../../shared/constants';
import './WaitingRoom.css';

interface LocationState {
  roomCode: string;
  isHost: boolean;
  players: PlayerPublicState[];
}

interface SavedSession {
  roomCode: string;
  playerName: string;
  isHost: boolean;
  timestamp: number;
}

export default function WaitingRoom() {
  const navigate = useNavigate();
  const location = useLocation();
  const { socket, isConnected, connect } = useSocket();
  const { isAuthenticated, isLoading } = useAuth();

  const state = location.state as LocationState | null;
  const reconnectAttempted = useRef(false);
  const gameStarted = useRef(false);

  // Redirecionar se não autenticado
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/');
    }
  }, [isLoading, isAuthenticated, navigate]);

  const [roomCode, setRoomCode] = useState(state?.roomCode || '');
  const [isHost, setIsHost] = useState(state?.isHost || false);
  const [players, setPlayers] = useState<PlayerPublicState[]>(state?.players || []);

  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);

  // Tentar reconectar se não tiver state (F5)
  useEffect(() => {
    if (state || reconnectAttempted.current) return;

    const savedSessionStr = localStorage.getItem('bangshotSession');
    if (!savedSessionStr) {
      navigate('/multiplayer');
      return;
    }

    try {
      const savedSession: SavedSession = JSON.parse(savedSessionStr);

      // Verificar se a sessão não expirou (30 minutos)
      if (Date.now() - savedSession.timestamp > 30 * 60 * 1000) {
        localStorage.removeItem('bangshotSession');
        navigate('/multiplayer');
        return;
      }

      reconnectAttempted.current = true;
      setReconnecting(true);
      setRoomCode(savedSession.roomCode);

      if (!isConnected) {
        connect();
      }
    } catch {
      localStorage.removeItem('bangshotSession');
      navigate('/multiplayer');
    }
  }, [state, isConnected, connect, navigate]);

  // Tentar reconectar quando socket conectar
  useEffect(() => {
    if (!reconnecting || !socket || !isConnected) return;

    const savedSessionStr = localStorage.getItem('bangshotSession');
    if (!savedSessionStr) return;

    try {
      const savedSession: SavedSession = JSON.parse(savedSessionStr);
      console.log('Tentando reconectar à sala:', savedSession.roomCode);

      socket.emit('joinRoom', {
        code: savedSession.roomCode,
        playerName: savedSession.playerName,
      });
    } catch {
      localStorage.removeItem('bangshotSession');
      navigate('/multiplayer');
    }
  }, [reconnecting, socket, isConnected, navigate]);

  // Escutar eventos de reconexão
  useEffect(() => {
    if (!socket || !reconnecting) return;

    const handleRoomJoined = (data: { code: string; isHost: boolean; players: PlayerPublicState[] }) => {
      setRoomCode(data.code);
      setIsHost(data.isHost);
      setPlayers(data.players);
      setReconnecting(false);
    };

    const handleJoinError = (message: string) => {
      console.log('Erro ao reconectar:', message);
      localStorage.removeItem('bangshotSession');
      setReconnecting(false);
      navigate('/multiplayer');
    };

    socket.on('roomJoined', handleRoomJoined);
    socket.on('joinError', handleJoinError);

    return () => {
      socket.off('roomJoined', handleRoomJoined);
      socket.off('joinError', handleJoinError);
    };
  }, [socket, reconnecting, navigate]);

  useEffect(() => {
    if ((!state && !reconnecting && !roomCode) || !socket) {
      if (!reconnecting) {
        navigate('/multiplayer');
      }
      return;
    }

    // Player joined
    socket.on('playerJoined', ({ players: newPlayers }) => {
      setPlayers(newPlayers);
    });

    // Player left
    socket.on('playerLeft', ({ players: newPlayers }) => {
      setPlayers(newPlayers);
    });

    // Host changed
    socket.on('hostChanged', ({ newHost }) => {
      const currentPlayer = players.find(p => p.id === socket.id);
      if (currentPlayer?.name === newHost) {
        setIsHost(true);
      }
    });

    // Game started
    socket.on('roundStarted', (gameState) => {
      gameStarted.current = true;
      navigate('/multiplayer/game', {
        state: {
          roomCode,
          gameState,
        },
      });
    });

    // Start error
    socket.on('startError', (message) => {
      setError(message);
    });

    // Left room
    socket.on('leftRoom', () => {
      localStorage.removeItem('bangshotSession');
      navigate('/multiplayer');
    });

    return () => {
      socket.off('playerJoined');
      socket.off('playerLeft');
      socket.off('hostChanged');
      socket.off('roundStarted');
      socket.off('startError');
      socket.off('leftRoom');
    };
  }, [socket, state, navigate, roomCode, players]);

  // NÃO fazemos cleanup automático ao desmontar.
  // O servidor controla o grace period de 60s para reconexão.
  // Se o jogador sair explicitamente, usa handleLeaveRoom.

  const handleStartGame = () => {
    if (!socket || !isHost) return;
    setError('');
    socket.emit('startGame');
  };

  // TODO: Implement leave room functionality
  // const handleLeaveRoom = () => {
  //   if (!socket) return;
  //   localStorage.removeItem('bangshotSession');
  //   socket.emit('leaveRoom');
  // };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = roomCode;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isConnected) {
    return (
      <PageLayout title="Sala de Espera">
        <div className="waiting-room-content">
          <p className="loading-message">Conectando ao servidor...</p>
        </div>
      </PageLayout>
    );
  }

  const canStart = players.length >= GAME_RULES.MIN_PLAYERS;

  return (
    <PageLayout title="Sala de Espera">
      <div className="waiting-room-content">
        <div className="room-code-display">
          <span className="code-label">Codigo da Sala</span>
          <div className="code-value" onClick={handleCopyCode}>
            {roomCode}
            <span className="copy-hint">{copied ? 'Copiado!' : 'Clique para copiar'}</span>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        <InlineAd position="inline-top" />

        <div className="players-section">
          <h3>Jogadores ({players.length}/{GAME_RULES.MAX_PLAYERS})</h3>
          <div className="players-list">
            {players.map((player, index) => (
              <div key={player.id} className="player-card">
                <div className="player-avatar">
                  {player.name.charAt(0).toUpperCase()}
                </div>
                <div className="player-info">
                  <span className="player-name">{player.name}</span>
                  {index === 0 && <span className="host-badge">HOST</span>}
                </div>
              </div>
            ))}

            {/* Empty slots */}
            {Array.from({ length: GAME_RULES.MAX_PLAYERS - players.length }).map((_, i) => (
              <div key={`empty-${i}`} className="player-card empty">
                <div className="player-avatar empty">?</div>
                <div className="player-info">
                  <span className="player-name">Aguardando...</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="game-rules-preview">
          <h4>Regras</h4>
          <ul>
            <li>Melhor de {GAME_RULES.MAX_ROUNDS} rodadas</li>
            <li>{GAME_RULES.MIN_PLAYERS}-{GAME_RULES.MAX_PLAYERS} jogadores</li>
            <li>Max {GAME_RULES.ITEMS.MAX_PER_PLAYER} itens por jogador</li>
            <li>{GAME_RULES.TIMERS.TURN_DURATION_MS / 1000}s por turno</li>
          </ul>
        </div>

        <InlineAd position="inline-bottom" />

        {isHost ? (
          <button
            className="start-btn"
            onClick={handleStartGame}
            disabled={!canStart}
          >
            {canStart
              ? 'INICIAR JOGO'
              : `AGUARDANDO JOGADORES (MIN. ${GAME_RULES.MIN_PLAYERS})`}
          </button>
        ) : (
          <p className="waiting-host">Aguardando o host iniciar o jogo...</p>
        )}
      </div>
    </PageLayout>
  );
}
