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
  // Nota: saveSession e getSession são deprecated - servidor gerencia via getRoomByUserId()
  const { clearSession } = useGameSession();
  const { startGame, leaveRoom, addBot, removeBot } = useRoomActions();
  const { joinRoom: emitJoinRoom } = useLobbyActions();

  const state = location.state as LocationState | null;
  const reconnectAttempted = useRef(false);
  const gameStarted = useRef(false);
  const hasRejoined = useRef(false);  // Para controlar reentrada após F5
  const wasInitiallyConnected = useRef(isConnected);  // Para diferenciar F5 de navegação normal

  const [roomCode, setRoomCode] = useState(state?.roomCode || '');
  const [isHost, setIsHost] = useState(state?.isHost || false);
  const [players, setPlayers] = useState<PlayerPublicState[]>(state?.players || []);

  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const reconnectingRef = useRef(false);  // Usar ref para evitar race condition
  const [addingBot, setAddingBot] = useState(false);

  // Manter musica do menu tocando
  useEffect(() => {
    playMusic('ambient-menu');
  }, [playMusic]);

  // SEMPRE conectar ao socket quando entrar na WaitingRoom
  // Necessário porque após F5, location.state persiste mas socket desconecta
  useEffect(() => {
    if (!isConnected) {
      console.log('[WaitingRoom] Conectando ao socket...');
      connect();
    }
  }, [isConnected, connect]);

  // Reentrar na sala após F5 (quando state existe mas socket RECONECTOU)
  // wasInitiallyConnected diferencia F5 (socket desconectado no mount) de navegação normal (socket já conectado)
  useEffect(() => {
    // Só reentrar se socket RECONECTOU (não estava conectado inicialmente, agora está)
    if (state?.roomCode && isConnected && !wasInitiallyConnected.current && !hasRejoined.current && user?.display_name) {
      console.log('[WaitingRoom] Socket reconectou após F5, reentrando na sala:', state.roomCode);
      hasRejoined.current = true;
      emitJoinRoom(state.roomCode, user.display_name);
    }
  }, [state?.roomCode, isConnected, user?.display_name, emitJoinRoom]);

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
    reconnectingRef.current = false;
  }, []);

  const handleJoinError = useCallback((message: string) => {
    console.log('Erro ao reconectar:', message);
    clearSession();
    reconnectingRef.current = false;
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

  // Nota: Session não é mais salva no cliente - servidor gerencia via getRoomByUserId()
  // O useEffect abaixo foi removido pois era redundante

  // Se não tiver state (F5 ou acesso direto), redirecionar para lobby
  // O servidor vai emitir 'alreadyInGame' se usuário estiver em uma sala
  useEffect(() => {
    if (state || reconnectAttempted.current) return;

    console.log('[WaitingRoom] Sem state, redirecionando para lobby (servidor notificará via alreadyInGame se estiver em sala)');
    reconnectAttempted.current = true;
    navigate('/multiplayer');
  }, [state, navigate]);

  // Nota: Reconexão via localStorage foi removida - servidor gerencia via alreadyInGame

  // Redirecionar se não tiver state nem sessão
  // Só redireciona se reconnectAttempted já foi true (evita redirect antes do check de sessão)
  useEffect(() => {
    if (!state && !reconnectingRef.current && !roomCode && reconnectAttempted.current) {
      console.log('[WaitingRoom] Redirecionando para lobby - reconexão falhou ou sem dados');
      navigate('/multiplayer');
    }
  }, [state, roomCode, navigate]);

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
