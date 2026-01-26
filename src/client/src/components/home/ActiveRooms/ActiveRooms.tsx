// ==========================================
// ACTIVE ROOMS - Lista de salas disponiveis
// ==========================================

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../../../context/SocketContext';
import { useAuth } from '../../../context/AuthContext';
import './ActiveRooms.css';

interface RoomInfo {
  code: string;
  hostName: string;
  playerCount: number;
  maxPlayers: number;
  hasPassword: boolean;
}

export function ActiveRooms() {
  const { socket, isConnected, connect } = useSocket();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
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

  // Conectar ao socket se necessario
  useEffect(() => {
    if (!isConnected && isAuthenticated) {
      connect();
    }
  }, [isAuthenticated, isConnected, connect]);

  const refreshRooms = useCallback(() => {
    if (!socket || !isConnected) return;
    setRefreshing(true);
    socket.emit('listRooms');
    setTimeout(() => setRefreshing(false), 500);
  }, [socket, isConnected]);

  useEffect(() => {
    if (!socket || !isConnected) {
      setLoading(false);
      return;
    }

    // Listener para lista de salas
    const handleRoomList = (data: RoomInfo[]) => {
      setRooms(data);
      setLoading(false);
      setRefreshing(false);
    };

    // Listener para qualquer atualização na lista de salas (real-time)
    const handleRoomListUpdated = () => {
      socket.emit('listRooms');
    };

    // Listener para sala criada - navegar para waiting room
    const handleRoomCreated = (data: { code: string; isHost: boolean; players: unknown[] }) => {
      console.log('Sala criada:', data.code);
      setCreating(false);
      // Salvar dados da sessão
      localStorage.setItem('bangshotSession', JSON.stringify({
        roomCode: data.code,
        playerName: user?.display_name || '',
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
    };

    // Listener para entrar em sala - navegar para waiting room
    const handleRoomJoined = (data: { code: string; isHost: boolean; players: unknown[] }) => {
      console.log('Entrou na sala:', data.code);
      setJoining(false);
      setShowPasswordModal(false);
      // Salvar dados da sessão
      localStorage.setItem('bangshotSession', JSON.stringify({
        roomCode: data.code,
        playerName: user?.display_name || '',
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
    };

    // Listener para erro ao entrar
    const handleJoinError = (message: string) => {
      setJoining(false);
      setCreating(false);
      setJoinError(message);

      // Se erro é "Já está na sala", limpar sessão antiga corrompida
      if (message.includes('Já está na sala') || message.includes('já está')) {
        localStorage.removeItem('bangshotSession');
      }

      setTimeout(() => setJoinError(''), 3000);
    };

    // Listener para sala deletada - limpar sessão se era nossa sala
    const handleRoomDeleted = (data: { code: string }) => {
      const session = localStorage.getItem('bangshotSession');
      if (session) {
        try {
          const parsed = JSON.parse(session);
          if (parsed.roomCode === data.code) {
            localStorage.removeItem('bangshotSession');
          }
        } catch {
          // Se JSON inválido, limpar
          localStorage.removeItem('bangshotSession');
        }
      }
      // Atualizar lista de salas
      socket.emit('listRooms');
    };

    // Listener para ser removido da sala (kicked, left, etc)
    const handleLeftRoom = () => {
      localStorage.removeItem('bangshotSession');
    };

    socket.on('roomList', handleRoomList);
    socket.on('roomListUpdated', handleRoomListUpdated);
    socket.on('roomDeleted', handleRoomDeleted);
    socket.on('roomUpdated', handleRoomListUpdated);
    socket.on('roomCreated', handleRoomCreated);
    socket.on('roomJoined', handleRoomJoined);
    socket.on('joinError', handleJoinError);
    socket.on('leftRoom', handleLeftRoom);

    // Solicitar lista inicial
    socket.emit('listRooms');

    // Atualizar a cada 3 segundos (mais frequente)
    const interval = setInterval(() => {
      socket.emit('listRooms');
    }, 3000);

    return () => {
      socket.off('roomList', handleRoomList);
      socket.off('roomListUpdated', handleRoomListUpdated);
      socket.off('roomDeleted', handleRoomDeleted);
      socket.off('roomUpdated', handleRoomListUpdated);
      socket.off('roomCreated', handleRoomCreated);
      socket.off('roomJoined', handleRoomJoined);
      socket.off('joinError', handleJoinError);
      socket.off('leftRoom', handleLeftRoom);
      clearInterval(interval);
    };
  }, [socket, isConnected, navigate, user]);

  // Criar sala diretamente
  const handleCreateRoom = useCallback(() => {
    if (!socket || !isConnected || !user) {
      setJoinError('Voce precisa estar conectado');
      return;
    }
    // Limpar sessao antiga antes de criar nova sala
    localStorage.removeItem('bangshotSession');
    setCreating(true);
    setJoinError('');
    socket.emit('createRoom', {
      playerName: user.display_name,
      password: undefined,
    });
  }, [socket, isConnected, user]);

  // Entrar em sala da lista
  const handleJoinRoom = useCallback((code: string, hasPassword: boolean) => {
    if (!socket || !isConnected || !user) {
      setJoinError('Voce precisa estar conectado');
      return;
    }
    if (hasPassword) {
      setPendingRoomCode(code);
      setShowPasswordModal(true);
      return;
    }
    // Limpar sessao antiga antes de entrar em nova sala
    localStorage.removeItem('bangshotSession');
    setJoining(true);
    setJoinError('');
    socket.emit('joinRoom', {
      code,
      playerName: user.display_name,
    });
  }, [socket, isConnected, user]);

  // Entrar com codigo digitado
  const handleJoinByCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!socket || !isConnected || !user) {
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
    // Limpar sessao antiga antes de entrar em nova sala
    localStorage.removeItem('bangshotSession');
    setJoining(true);
    setJoinError('');
    socket.emit('joinRoom', {
      code,
      playerName: user.display_name,
      password: joinPassword || undefined,
    });
  };

  // Entrar em sala com senha
  const handleJoinWithPassword = () => {
    if (!socket || !isConnected || !user || !pendingRoomCode) return;
    // Limpar sessao antiga antes de entrar em nova sala
    localStorage.removeItem('bangshotSession');
    setJoining(true);
    socket.emit('joinRoom', {
      code: pendingRoomCode,
      playerName: user.display_name,
      password: joinPassword,
    });
  };

  // Fechar modal de senha
  const closePasswordModal = () => {
    setShowPasswordModal(false);
    setPendingRoomCode('');
    setJoinPassword('');
  };

  return (
    <div className="active-rooms">
      {/* Header with title and refresh button */}
      <div className="active-rooms__header">
        <h2 className="active-rooms__title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          SALAS DISPONIVEIS
        </h2>
        <button
          className={`refresh-btn ${refreshing ? 'spinning' : ''}`}
          onClick={refreshRooms}
          title="Atualizar lista"
          disabled={refreshing}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M23 4v6h-6"/>
            <path d="M1 20v-6h6"/>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
          </svg>
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
            <span className="active-rooms__empty-icon">🎮</span>
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
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                    {room.playerCount}/{room.maxPlayers}
                  </span>
                  {room.hasPassword && (
                    <span className="room-card__lock" title="Sala com senha">🔒</span>
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
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          {creating ? 'Criando...' : 'Criar Sala'}
        </button>
        <button
          className="btn-secondary btn-solo"
          onClick={() => navigate('/singleplayer')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
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
