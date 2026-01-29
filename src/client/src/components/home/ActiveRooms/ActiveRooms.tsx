// ==========================================
// ACTIVE ROOMS - Lista de salas disponiveis
// ==========================================

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../../../context/SocketContext';
import { useAuth } from '../../../context/AuthContext';
import {
  useAutoConnect,
  useLobbyEvents,
  useLobbyActions,
  useGameSession,
} from '../../../hooks';
import type { RoomInfo, RoomCreatedPayload, RoomJoinedPayload } from '../../../hooks';
import { PlayersIcon, RefreshIcon, UserIcon, PlusIcon, TargetCircleIcon, GamepadIcon, LockIcon } from '../../icons';
import './ActiveRooms.css';

export function ActiveRooms() {
  const { isConnected } = useSocket();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Hooks customizados
  useAutoConnect();
  const { saveSession, clearSession, getSession } = useGameSession();
  const {
    listRooms,
    createRoom,
    joinRoom: emitJoinRoom,
    rejoinGame,
    abandonGame,
    checkActiveGame,
  } = useLobbyActions();

  // Estado local
  const [rooms, setRooms] = useState<RoomInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [roomCode, setRoomCode] = useState('');
  const [joinPassword, setJoinPassword] = useState('');
  const [joinError, setJoinError] = useState('');
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pendingRoomCode, setPendingRoomCode] = useState('');
  const [activeGame, setActiveGame] = useState<{ roomCode: string; gameStarted: boolean } | null>(null);
  const [isReconnecting, setIsReconnecting] = useState(false);

  // Handlers para eventos do lobby
  const handleRoomList = useCallback((data: RoomInfo[]) => {
    setRooms(data);
    setLoading(false);
    setRefreshing(false);
  }, []);

  const handleRoomListUpdated = useCallback(() => {
    listRooms();
  }, [listRooms]);

  const handleRoomCreated = useCallback((data: RoomCreatedPayload) => {
    console.log('Sala criada:', data.code);
    setCreating(false);
    saveSession({
      roomCode: data.code,
      playerName: user?.display_name || '',
      isHost: data.isHost,
    });
    navigate('/multiplayer/room', {
      state: {
        roomCode: data.code,
        isHost: data.isHost,
        players: data.players,
      },
    });
  }, [navigate, saveSession, user?.display_name]);

  const handleRoomJoined = useCallback((data: RoomJoinedPayload) => {
    console.log('Entrou na sala:', data.code);
    setJoining(false);
    setShowPasswordModal(false);
    saveSession({
      roomCode: data.code,
      playerName: user?.display_name || '',
      isHost: data.isHost,
    });
    navigate('/multiplayer/room', {
      state: {
        roomCode: data.code,
        isHost: data.isHost,
        players: data.players,
      },
    });
  }, [navigate, saveSession, user?.display_name]);

  const handleJoinError = useCallback((message: string) => {
    setJoining(false);
    setCreating(false);
    setIsReconnecting(false);
    setJoinError(message);

    // Se erro indica que a sala não existe mais ou usuário não está nela, limpar activeGame e sessão
    if (message.includes('não encontrada') || message.includes('not found') ||
        message.includes('não existe') || message.includes('não está nesta sala')) {
      console.log('[ActiveRooms] Sala não existe ou usuário removido, limpando activeGame');
      setActiveGame(null);
      clearSession();
    }
    // Se erro é "Já está na sala", limpar sessão antiga corrompida
    else if (message.includes('Já está na sala') || message.includes('já está')) {
      clearSession();
    }

    setTimeout(() => setJoinError(''), 3000);
  }, [clearSession]);

  const handleRoomDeleted = useCallback((data: { code: string }) => {
    const session = getSession();
    if (session && session.roomCode === data.code) {
      clearSession();
    }
    listRooms();
  }, [clearSession, getSession, listRooms]);

  const handleLeftRoom = useCallback(() => {
    clearSession();
  }, [clearSession]);

  const handleAlreadyInGame = useCallback((data: { roomCode: string; gameStarted: boolean }) => {
    console.log('[ActiveRooms] alreadyInGame:', data);
    setCreating(false);
    setJoining(false);
    setActiveGame({
      roomCode: data.roomCode,
      gameStarted: data.gameStarted,
    });
  }, []);

  const handleReconnected = useCallback((data: { roomCode: string }) => {
    console.log('[ActiveRooms] reconnected:', data.roomCode);
    setIsReconnecting(false);
    setActiveGame(null);
    navigate('/multiplayer/game', {
      state: { roomCode: data.roomCode, reconnected: true, gameState: data },
    });
  }, [navigate]);

  const handleGameAbandoned = useCallback(() => {
    console.log('[ActiveRooms] gameAbandoned');
    setActiveGame(null);
  }, []);

  // Registrar event listeners via hook
  useLobbyEvents({
    onRoomList: handleRoomList,
    onRoomListUpdated: handleRoomListUpdated,
    onRoomCreated: handleRoomCreated,
    onRoomJoined: handleRoomJoined,
    onJoinError: handleJoinError,
    onRoomDeleted: handleRoomDeleted,
    onLeftRoom: handleLeftRoom,
    onAlreadyInGame: handleAlreadyInGame,
    onReconnected: handleReconnected,
    onGameAbandoned: handleGameAbandoned,
  });

  // Efeito inicial: solicitar lista e verificar jogo ativo
  useEffect(() => {
    if (!isConnected) {
      setLoading(false);
      return;
    }

    listRooms();
    checkActiveGame();

    // Atualizar a cada 3 segundos
    const interval = setInterval(() => {
      listRooms();
    }, 3000);

    return () => clearInterval(interval);
  }, [isConnected, listRooms, checkActiveGame]);

  // Refresh manual
  const refreshRooms = useCallback(() => {
    if (!isConnected) return;
    setRefreshing(true);
    listRooms();
    setTimeout(() => setRefreshing(false), 500);
  }, [isConnected, listRooms]);

  // Criar sala diretamente
  const handleCreateRoom = useCallback(() => {
    if (!isConnected || !user) {
      setJoinError('Voce precisa estar conectado');
      return;
    }
    clearSession();
    setCreating(true);
    setJoinError('');
    createRoom(user.display_name);
  }, [isConnected, user, clearSession, createRoom]);

  // Entrar em sala da lista
  const handleJoinRoom = useCallback((code: string, hasPassword: boolean) => {
    if (!isConnected || !user) {
      setJoinError('Voce precisa estar conectado');
      return;
    }
    if (hasPassword) {
      setPendingRoomCode(code);
      setShowPasswordModal(true);
      return;
    }
    clearSession();
    setJoining(true);
    setJoinError('');
    emitJoinRoom(code, user.display_name);
  }, [isConnected, user, clearSession, emitJoinRoom]);

  // Entrar com codigo digitado
  const handleJoinByCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected || !user) {
      setJoinError('Voce precisa estar conectado');
      return;
    }
    const code = roomCode.trim().toUpperCase();
    if (!code) {
      setJoinError('Digite um codigo');
      return;
    }
    if (code.length < 4) {
      setJoinError('Codigo invalido');
      return;
    }
    clearSession();
    setJoining(true);
    setJoinError('');
    emitJoinRoom(code, user.display_name, joinPassword || undefined);
  };

  // Entrar em sala com senha
  const handleJoinWithPassword = () => {
    if (!isConnected || !user || !pendingRoomCode) return;
    clearSession();
    setJoining(true);
    emitJoinRoom(pendingRoomCode, user.display_name, joinPassword);
  };

  // Fechar modal de senha
  const closePasswordModal = () => {
    setShowPasswordModal(false);
    setPendingRoomCode('');
    setJoinPassword('');
  };

  // Reconectar ao jogo ativo
  const handleReconnect = useCallback(() => {
    if (!activeGame) return;
    setIsReconnecting(true);
    rejoinGame(activeGame.roomCode);
  }, [activeGame, rejoinGame]);

  // Abandonar jogo ativo
  const handleAbandonGame = useCallback(() => {
    if (!activeGame) return;
    abandonGame(activeGame.roomCode);
  }, [activeGame, abandonGame]);

  return (
    <div className="active-rooms">
      {/* Banner de jogo ativo */}
      {activeGame && (
        <div className="active-game-banner">
          <div className="active-game-banner__info">
            <span className="active-game-banner__icon">⚠️</span>
            <div className="active-game-banner__text">
              <strong>{activeGame.gameStarted ? 'Partida em andamento!' : 'Você está em uma sala!'}</strong>
              <span>Sala: {activeGame.roomCode}</span>
            </div>
          </div>
          <div className="active-game-banner__actions">
            <button
              className="active-game-banner__btn active-game-banner__btn--primary"
              onClick={handleReconnect}
              disabled={isReconnecting || !isConnected}
            >
              {isReconnecting ? 'Reconectando...' : 'RECONECTAR'}
            </button>
            <button
              className="active-game-banner__btn active-game-banner__btn--secondary"
              onClick={handleAbandonGame}
              disabled={isReconnecting}
            >
              ABANDONAR
            </button>
          </div>
        </div>
      )}

      {/* Header with title and refresh button */}
      <div className="active-rooms__header">
        <h2 className="active-rooms__title">
          <PlayersIcon size={20} />
          SALAS DISPONIVEIS
        </h2>
        <button
          className={`refresh-btn ${refreshing ? 'spinning' : ''}`}
          onClick={refreshRooms}
          title="Atualizar lista"
          disabled={refreshing}
        >
          <RefreshIcon size={16} />
        </button>
      </div>

      {/* Join by code input */}
      <form className="join-by-code" onSubmit={handleJoinByCode}>
        <input
          type="text"
          className="join-by-code__input"
          placeholder="Codigo da sala (ex: ABC123)"
          value={roomCode}
          onChange={(e) => {
            setRoomCode(e.target.value.toUpperCase());
            setJoinError('');
          }}
          maxLength={10}
        />
        <button type="submit" className="join-by-code__btn">
          Entrar
        </button>
      </form>
      {joinError && <p className="join-by-code__error">{joinError}</p>}

      <div className="active-rooms__content">
        {loading && (
          <p className="active-rooms__loading">Carregando salas...</p>
        )}

        {!loading && rooms.length === 0 && (
          <div className="active-rooms__empty">
            <GamepadIcon size={48} color="#6b5b95" />
            <p>Nenhuma sala disponivel</p>
            <span className="active-rooms__empty-hint">Crie uma sala ou jogue solo!</span>
          </div>
        )}

        {!loading && rooms.length > 0 && (
          <div className="active-rooms__list">
            {rooms.map(room => (
              <div key={room.code} className="room-card">
                <div className="room-card__main">
                  <span className="room-card__host">{room.hostName}</span>
                  <span className="room-card__code">#{room.code}</span>
                </div>
                <div className="room-card__meta">
                  <span className="room-card__players">
                    <UserIcon size={14} />
                    {room.playerCount}/{room.maxPlayers}
                  </span>
                  {room.hasPassword && (
                    <span className="room-card__lock" title="Sala com senha">
                      <LockIcon size={14} color="#d4a418" />
                    </span>
                  )}
                </div>
                <button
                  className="room-card__join"
                  onClick={() => handleJoinRoom(room.code, room.hasPassword)}
                  disabled={joining || creating}
                >
                  Entrar
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="active-rooms__actions">
        <button
          className="btn-primary btn-create-room"
          onClick={handleCreateRoom}
          disabled={creating || joining || !isConnected || !user}
        >
          <PlusIcon size={16} />
          {creating ? 'Criando...' : 'Criar Sala'}
        </button>
        <button
          className="btn-secondary btn-solo"
          onClick={() => navigate('/singleplayer')}
        >
          <TargetCircleIcon size={16} />
          Jogar Solo
        </button>
      </div>

      {/* Modal de senha */}
      {showPasswordModal && (
        <div className="password-modal-overlay" onClick={closePasswordModal}>
          <div className="password-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Sala com senha</h3>
            <p>A sala #{pendingRoomCode} requer senha</p>
            <input
              type="password"
              className="password-modal__input"
              placeholder="Digite a senha"
              value={joinPassword}
              onChange={(e) => setJoinPassword(e.target.value)}
              autoFocus
            />
            <div className="password-modal__actions">
              <button
                className="password-modal__cancel"
                onClick={closePasswordModal}
              >
                Cancelar
              </button>
              <button
                className="password-modal__confirm"
                onClick={handleJoinWithPassword}
                disabled={joining || !joinPassword}
              >
                {joining ? 'Entrando...' : 'Entrar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ActiveRooms;
