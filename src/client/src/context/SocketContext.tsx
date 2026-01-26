import { createContext, useContext, useEffect, useState, useRef, useCallback, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from '@shared/types/socket-events.types';
import { API_URL } from '../config';

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

  // Usar ref para evitar criacao duplicada de socket em React.StrictMode
  const socketRef = useRef<TypedSocket | null>(null);
  const connectingRef = useRef(false);

  const connect = useCallback(() => {
    // Evitar conexoes duplicadas
    if (socketRef.current?.connected) {
      console.log('Ja conectado ao servidor');
      return;
    }

    // Evitar multiplas tentativas simultaneas de conexao
    if (connectingRef.current) {
      console.log('Conexao ja em andamento');
      return;
    }

    // Desconectar socket anterior se existir
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    connectingRef.current = true;

    const serverUrl = API_URL || window.location.origin;

    console.log('Conectando ao servidor:', serverUrl);

    // Pegar token de autenticação se existir
    const authToken = localStorage.getItem('bangshot_auth_token');

    const newSocket: TypedSocket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      timeout: 10000,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      auth: authToken ? { token: authToken } : undefined,
    });

    socketRef.current = newSocket;

    newSocket.on('connect', () => {
      console.log('Conectado ao servidor:', newSocket.id);
      setIsConnected(true);
      connectingRef.current = false;
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Desconectado do servidor:', reason);
      setIsConnected(false);
      connectingRef.current = false;
    });

    newSocket.on('connect_error', (error) => {
      console.error('Erro de conexao:', error.message);
      setIsConnected(false);
      connectingRef.current = false;
    });

    setSocket(newSocket);
  }, []);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setSocket(null);
      setIsConnected(false);
      connectingRef.current = false;
    }
  }, []);

  // Limpar ao desmontar
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  // Handler para quando o usuário fecha a aba/navegador
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Tentar enviar leaveRoom via socket
      if (socketRef.current?.connected) {
        socketRef.current.emit('leaveRoom');
      }

      // Usar sendBeacon como fallback para garantir que o servidor seja notificado
      const serverUrl = API_URL || window.location.origin;

      const socketId = socketRef.current?.id;
      if (socketId) {
        navigator.sendBeacon(
          `${serverUrl}/api/leave-room`,
          JSON.stringify({ socketId })
        );
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

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
