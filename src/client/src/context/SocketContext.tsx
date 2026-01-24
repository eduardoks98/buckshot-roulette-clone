import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from '@shared/types/socket-events.types';

// ==========================================
// TYPES
// ==========================================

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

interface SocketContextType {
  socket: TypedSocket | null;
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
}

// ==========================================
// CONTEXT
// ==========================================

const SocketContext = createContext<SocketContextType | null>(null);

// ==========================================
// PROVIDER
// ==========================================

interface SocketProviderProps {
  children: ReactNode;
}

export function SocketProvider({ children }: SocketProviderProps) {
  const [socket, setSocket] = useState<TypedSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const connect = () => {
    if (socket?.connected) {
      console.log('Já conectado ao servidor');
      return;
    }

    const serverUrl = import.meta.env.DEV
      ? 'http://localhost:3000'
      : window.location.origin;

    console.log('Conectando ao servidor:', serverUrl);

    // Pegar token de autenticação se existir
    const authToken = localStorage.getItem('buckshot_auth_token');

    const newSocket: TypedSocket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      timeout: 10000,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      auth: authToken ? { token: authToken } : undefined,
    });

    newSocket.on('connect', () => {
      console.log('Conectado ao servidor:', newSocket.id);
      setIsConnected(true);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Desconectado do servidor:', reason);
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Erro de conexão:', error.message);
      setIsConnected(false);
    });

    setSocket(newSocket);
  };

  const disconnect = () => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
      setIsConnected(false);
    }
  };

  // Limpar ao desmontar
  useEffect(() => {
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [socket]);

  const value: SocketContextType = {
    socket,
    isConnected,
    connect,
    disconnect,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}

// ==========================================
// HOOK
// ==========================================

export function useSocket(): SocketContextType {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket deve ser usado dentro de SocketProvider');
  }
  return context;
}
