// ==========================================
// WAITING ROOM PAGE
// ==========================================

import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSocket } from '../../../context/SocketContext';
import { useAuth } from '../../../context/AuthContext';
import {
  useRequireAuth,
  useRoomEvents,
  useRoomActions,
  useLobbyActions,
  useGameSession,
} from '../../../hooks';
import type {
  PlayerJoinedPayload,
  PlayerLeftPayload,
  RoomPlayerDisconnectedPayload,
  RoomPlayerReconnectedPayload,
  HostChangedPayload,
  BotErrorPayload,
} from '../../../hooks';
import { PageLayout, InlineAd } from '../../../components/layout/PageLayout';
import { PlayerPublicState, RoundStartedPayload } from '../../../../../shared/types';
import { GAME_RULES } from '../../../../../shared/constants';
import { useSounds } from '../../../audio/useSounds';
import './WaitingRoom.css';

// Verificar se está em modo de desenvolvimento
const isDevelopment = import.meta.env.DEV;

interface LocationState {
  roomCode: string;
  isHost: boolean;
  players: PlayerPublicState[];
  fromRematch?: boolean;
}

export default function WaitingRoom() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isConnected, connect } = useSocket();
  const { user } = useAuth();
  const { playMusic, playJoinRoom, playLeaveRoom, stopMusic } = useSounds();

  // Hooks customizados
  useRequireAuth();
  const { saveSession, clearSession, getSession } = useGameSession();
  const { startGame, leaveRoom, addBot, removeBot } = useRoomActions();
  const { joinRoom: emitJoinRoom } = useLobbyActions();

  const state = location.state as LocationState | null;
  const reconnectAttempted = useRef(false);
  const gameStarted = useRef(false);

  const [roomCode, setRoomCode] = useState(state?.roomCode || '');
  const [isHost, setIsHost] = useState(state?.isHost || false);
  const [players, setPlayers] = useState<PlayerPublicState[]>(state?.players || []);

  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const [addingBot, setAddingBot] = useState(false);

  // Manter musica do menu tocando
  useEffect(() => {
    playMusic('ambient-menu');
  }, [playMusic]);

  // Event handlers
  const handlePlayerJoined = useCallback((data: PlayerJoinedPayload) => {
    playJoinRoom(); // Som quando jogador entra
    setPlayers(data.players);
  }, [playJoinRoom]);

  const handlePlayerLeft = useCallback((data: PlayerLeftPayload) => {
    playLeaveRoom(); // Som quando jogador sai
    setPlayers(data.players);
  }, [playLeaveRoom]);

  const handlePlayerDisconnected = useCallback((data: RoomPlayerDisconnectedPayload) => {
    console.log(`[WaitingRoom] ${data.playerName} desconectou temporariamente`);
    setPlayers(prev => prev.map(p =>
      p.id === data.playerId ? { ...p, disconnected: true } : p
    ));
  }, []);

  const handlePlayerReconnected = useCallback((data: RoomPlayerReconnectedPayload) => {
    console.log(`[WaitingRoom] ${data.playerName} reconectou (${data.playerId} -> ${data.newSocketId})`);
    setPlayers(prev => prev.map(p =>
      p.id === data.playerId ? { ...p, id: data.newSocketId || p.id, disconnected: false } : p
    ));
  }, []);

  const handleHostChanged = useCallback((data: HostChangedPayload) => {
    // Check if current user became host by name comparison
    if (user?.display_name === data.newHost) {
      setIsHost(true);
    }
  }, [user?.display_name]);

  const handleRoundStarted = useCallback((gameState: RoundStartedPayload) => {
    gameStarted.current = true;
    stopMusic(true); // Para musica do menu com fade out
    navigate('/multiplayer/game', {
      state: {
        roomCode,
        gameState,
      },
    });
  }, [navigate, roomCode, stopMusic]);

  const handleStartError = useCallback((message: string) => {
    setError(message);
  }, []);

  const handleLeftRoom = useCallback(() => {
    clearSession();
    navigate('/multiplayer');
  }, [clearSession, navigate]);

  const handleRoomJoined = useCallback((data: { code: string; isHost: boolean; players: PlayerPublicState[] }) => {
    setRoomCode(data.code);
    setIsHost(data.isHost);
    setPlayers(data.players);
    setReconnecting(false);
  }, []);

  const handleJoinError = useCallback((message: string) => {
    console.log('Erro ao reconectar:', message);
    clearSession();
    setReconnecting(false);
    navigate('/multiplayer');
  }, [clearSession, navigate]);

  const handleBotAdded = useCallback(() => {
    setAddingBot(false);
  }, []);

  const handleBotError = useCallback((data: BotErrorPayload) => {
    setError(data.message);
    setAddingBot(false);
  }, []);

  // Registrar eventos via hook
  useRoomEvents({
    onPlayerJoined: handlePlayerJoined,
    onPlayerLeft: handlePlayerLeft,
    onPlayerDisconnected: handlePlayerDisconnected,
    onPlayerReconnected: handlePlayerReconnected,
    onHostChanged: handleHostChanged,
    onRoundStarted: handleRoundStarted,
    onStartError: handleStartError,
    onLeftRoom: handleLeftRoom,
    onRoomJoined: handleRoomJoined,
    onJoinError: handleJoinError,
    onBotAdded: handleBotAdded,
    onBotError: handleBotError,
  });

  // Salvar sessão quando vem do rematch
  useEffect(() => {
    if (state?.fromRematch && state.roomCode && user?.display_name) {
      saveSession({
        roomCode: state.roomCode,
        playerName: user.display_name,
        isHost: state.isHost,
      });
      console.log('[WaitingRoom] Sessão salva do rematch:', state.roomCode);
    }
  }, [state?.fromRematch, state?.roomCode, state?.isHost, user?.display_name, saveSession]);

  // Tentar reconectar se não tiver state (F5)
  useEffect(() => {
    if (state || reconnectAttempted.current) return;

    const savedSession = getSession();
    if (!savedSession) {
      navigate('/multiplayer');
      return;
    }

    reconnectAttempted.current = true;
    setReconnecting(true);
    setRoomCode(savedSession.roomCode);

    if (isConnected) {
      console.log('[WaitingRoom] Já conectado, emitindo joinRoom:', savedSession.roomCode);
      emitJoinRoom(savedSession.roomCode, savedSession.playerName);
    } else {
      console.log('[WaitingRoom] Aguardando conexão...');
      connect();
    }
  }, [state, isConnected, connect, navigate, getSession, emitJoinRoom]);

  // Tentar reconectar quando socket conectar
  useEffect(() => {
    if (!reconnecting || !isConnected) return;

    const savedSession = getSession();
    if (!savedSession) return;

    console.log('[WaitingRoom] Socket conectou, tentando reconectar à sala:', savedSession.roomCode);
    emitJoinRoom(savedSession.roomCode, savedSession.playerName);
  }, [reconnecting, isConnected, getSession, emitJoinRoom]);

  // Redirecionar se não tiver state nem sessão
  useEffect(() => {
    if ((!state && !reconnecting && !roomCode)) {
      if (!reconnecting) {
        navigate('/multiplayer');
      }
    }
  }, [state, reconnecting, roomCode, navigate]);

  // Handler para sair da sala
  const handleLeaveRoom = useCallback(() => {
    clearSession();
    leaveRoom();
    navigate('/multiplayer');
  }, [clearSession, leaveRoom, navigate]);

  // Handlers para ações
  const handleStartGame = useCallback(() => {
    if (!isHost) return;
    setError('');
    startGame();
  }, [isHost, startGame]);

  const handleAddBot = useCallback(() => {
    if (!isHost || !isDevelopment) return;
    if (players.length >= GAME_RULES.MAX_PLAYERS) {
      setError('Sala cheia');
      return;
    }
    setAddingBot(true);
    setError('');
    addBot('medium');
  }, [isHost, players.length, addBot]);

  const handleRemoveBot = useCallback((botId: string) => {
    if (!isHost || !isDevelopment) return;
    removeBot(botId);
  }, [isHost, removeBot]);

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
      <PageLayout title="Sala de Espera" onBack={handleLeaveRoom}>
        <div className="waiting-room-content">
          <p className="loading-message">Conectando ao servidor...</p>
        </div>
      </PageLayout>
    );
  }

  const canStart = players.length >= GAME_RULES.MIN_PLAYERS;

  return (
    <PageLayout title="Sala de Espera" onBack={handleLeaveRoom}>
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
            {players.map((player, index) => {
              const isBot = player.id.startsWith('BOT_');
              return (
                <div key={player.id} className={`player-card ${player.disconnected ? 'disconnected' : ''} ${isBot ? 'bot' : ''}`}>
                  <div className={`player-avatar ${player.disconnected ? 'disconnected' : ''} ${isBot ? 'bot' : ''}`}>
                    {isBot ? 'AI' : player.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="player-info">
                    <span className="player-name">{player.name}</span>
                    {index === 0 && !isBot && <span className="host-badge">HOST</span>}
                    {isBot && <span className="bot-badge">BOT</span>}
                    {player.disconnected && <span className="reconnecting-badge">Reconectando...</span>}
                  </div>
                  {isHost && isDevelopment && isBot && (
                    <button
                      className="remove-bot-btn"
                      onClick={() => handleRemoveBot(player.id)}
                      title="Remover bot"
                    >
                      X
                    </button>
                  )}
                </div>
              );
            })}

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

          {/* Add Bot button (Development only) */}
          {isDevelopment && isHost && players.length < GAME_RULES.MAX_PLAYERS && (
            <button
              className="add-bot-btn"
              onClick={handleAddBot}
              disabled={addingBot}
            >
              {addingBot ? 'Adicionando...' : '+ Adicionar Bot (DEV)'}
            </button>
          )}
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
