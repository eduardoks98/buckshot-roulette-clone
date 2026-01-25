// ==========================================
// ACTIVE ROOMS - Lista de salas disponiveis
// ==========================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../../../context/SocketContext';
import './ActiveRooms.css';

interface RoomInfo {
  code: string;
  hostName: string;
  playerCount: number;
  maxPlayers: number;
  hasPassword: boolean;
}

export function ActiveRooms() {
  const { socket, isConnected } = useSocket();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<RoomInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!socket || !isConnected) {
      setLoading(false);
      return;
    }

    // Listener para lista de salas
    const handleRoomList = (data: RoomInfo[]) => {
      setRooms(data);
      setLoading(false);
    };

    socket.on('roomList', handleRoomList);

    // Solicitar lista inicial
    socket.emit('listRooms');

    // Atualizar a cada 5 segundos
    const interval = setInterval(() => {
      socket.emit('listRooms');
    }, 5000);

    return () => {
      socket.off('roomList', handleRoomList);
      clearInterval(interval);
    };
  }, [socket, isConnected]);

  const handleJoinRoom = (code: string) => {
    navigate(`/multiplayer?join=${code}`);
  };

  return (
    <div className="active-rooms">
      <h2 className="active-rooms__title">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
        SALAS DISPONIVEIS
      </h2>

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
                  onClick={() => handleJoinRoom(room.code)}
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
          onClick={() => navigate('/multiplayer')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Criar Sala
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
    </div>
  );
}

export default ActiveRooms;
