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
import { Modal } from '../../common/Modal';
import './ActiveRooms.css';

export function ActiveRooms() {
  const { isConnected, activeGame, clearActiveGame } = useSocket();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Hooks customizados
  useAutoConnect();
  // Nota: saveSession e getSession são deprecated (noop) - servidor gerencia via socket
  const { clearSession } = useGameSession();
  const {
    listRooms,
    createRoom,
    joinRoom: emitJoinRoom,
    checkActiveGame,
  } = useLobbyActions();

  // Estado local (apenas para UI do lobby, nao para jogo ativo - agora e global)
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
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createPassword, setCreatePassword] = useState('');
  const [usePassword, setUsePassword] = useState(false);

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
    // Nota: session não é mais salva no cliente - servidor gerencia via getRoomByUserId()
    navigate('/multiplayer/room', {
      state: {
        roomCode: data.code,
        isHost: data.isHost,
        players: data.players,
      },
    });
  }, [navigate]);

  const handleRoomJoined = useCallback((data: RoomJoinedPayload) => {
    console.log('Entrou na sala:', data.code);
    setJoining(false);
    setShowPasswordModal(false);
    // Nota: session não é mais salva no cliente - servidor gerencia via getRoomByUserId()
    navigate('/multiplayer/room', {
      state: {
        roomCode: data.code,
        isHost: data.isHost,
        players: data.players,
      },
    });
  }, [navigate]);

  const handleJoinError = useCallback((message: string) => {
    setJoining(false);
    setCreating(false);
    setJoinError(message);

    // Se erro indica que a sala não existe mais ou usuário não está nela, limpar activeGame e sessão
    if (message.includes('não encontrada') || message.includes('not found') ||
        message.includes('não existe') || message.includes('não está nesta sala')) {
      console.log('[ActiveRooms] Sala não existe ou usuário removido, limpando activeGame');
      clearActiveGame();
      clearSession();
    }
    // Se erro é "Já está na sala", limpar sessão antiga corrompida
    else if (message.includes('Já está na sala') || message.includes('já está')) {
      clearSession();
    }

    setTimeout(() => setJoinError(''), 3000);
  }, [clearSession, clearActiveGame]);

  const handleRoomDeleted = useCallback(() => {
    // Nota: activeGame agora e limpo globalmente no SocketContext
    // Limpar qualquer dado de sessão legado
    clearSession();
    listRooms();
  }, [clearSession, listRooms]);

  const handleLeftRoom = useCallback(() => {
    clearSession();
  }, [clearSession]);

  // Nota: alreadyInGame, reconnected e gameAbandoned agora sao tratados globalmente no SocketContext
  const handleAlreadyInGame = useCallback(() => {
    // Apenas limpar estados de loading
    setCreating(false);
    setJoining(false);
  }, []);

  // Registrar event listeners via hook
  // Nota: alreadyInGame, reconnected e gameAbandoned sao tratados globalmente no SocketContext
  useLobbyEvents({
    onRoomList: handleRoomList,
    onRoomListUpdated: handleRoomListUpdated,
    onRoomCreated: handleRoomCreated,
    onRoomJoined: handleRoomJoined,
    onJoinError: handleJoinError,
    onRoomDeleted: handleRoomDeleted,
    onLeftRoom: handleLeftRoom,
    onAlreadyInGame: handleAlreadyInGame,
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

  // Abrir modal de criação de sala
  const handleOpenCreateModal = useCallback(() => {
    if (!isConnected || !user) {
      setJoinError('Voce precisa estar conectado');
      return;
    }
    // Se já está em uma sala, não permitir criar outra
    if (activeGame) {
      setJoinError(`Voce ja esta na sala ${activeGame.roomCode}`);
      return;
    }
    setShowCreateModal(true);
    setCreatePassword('');
    setUsePassword(false);
    setJoinError('');
  }, [isConnected, user, activeGame]);

  // Criar sala (com ou sem senha)
  const handleCreateRoom = useCallback(() => {
    if (!isConnected || !user) {
      setJoinError('Voce precisa estar conectado');
      return;
    }
    clearSession();
    setCreating(true);
    setShowCreateModal(false);
    setJoinError('');
    createRoom(user.display_name, usePassword ? createPassword : undefined);
  }, [isConnected, user, clearSession, createRoom, usePassword, createPassword]);

  // Fechar modal de criação
  const closeCreateModal = useCallback(() => {
    setShowCreateModal(false);
    setCreatePassword('');
    setUsePassword(false);
  }, []);

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

  // Nota: Reconexao e abandono agora sao tratados pelo ActiveGameModal global

  return (
    <div className="active-rooms">
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
          onClick={handleOpenCreateModal}
          disabled={creating || joining || !isConnected || !user || !!activeGame}
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

      {/* Modal de senha para entrar */}
      <Modal
        isOpen={showPasswordModal}
        onClose={closePasswordModal}
        title="Sala com senha"
        size="sm"
      >
        <div className="password-modal-content">
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
      </Modal>

      {/* Modal de criação de sala */}
      <Modal
        isOpen={showCreateModal}
        onClose={closeCreateModal}
        title="Criar Sala"
        size="sm"
      >
        <div className="create-room-modal-content">
          <p>Configure sua nova sala</p>

          <div className="create-room__option">
            <label className="create-room__toggle">
              <input
                type="checkbox"
                checked={usePassword}
                onChange={(e) => setUsePassword(e.target.checked)}
              />
              <span className="create-room__toggle-slider"></span>
              <span className="create-room__toggle-label">
                <LockIcon size={14} />
                Proteger com senha
              </span>
            </label>
          </div>

          {usePassword && (
            <input
              type="password"
              className="password-modal__input"
              placeholder="Digite a senha da sala"
              value={createPassword}
              onChange={(e) => setCreatePassword(e.target.value)}
              autoFocus
            />
          )}

          <div className="password-modal__actions">
            <button
              className="password-modal__cancel"
              onClick={closeCreateModal}
            >
              Cancelar
            </button>
            <button
              className="password-modal__confirm"
              onClick={handleCreateRoom}
              disabled={creating || (usePassword && !createPassword)}
            >
              {creating ? 'Criando...' : 'Criar Sala'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default ActiveRooms;
