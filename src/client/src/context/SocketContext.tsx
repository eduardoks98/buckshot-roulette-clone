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

export interface ActiveGameInfo {
  roomCode: string;
  gameStarted: boolean;
}

interface SocketContextType {
  socket: TypedSocket | null;
  isConnected: boolean;
  isSessionInvalidated: boolean;
  sessionInvalidatedReason: string | null;
  // Active game state (global)
  activeGame: ActiveGameInfo | null;
  isReconnecting: boolean;
  reconnectedGameData: unknown | null;
  connect: () => void;
  disconnect: () => void;
  clearSessionInvalidated: () => void;
  // Active game methods
  clearActiveGame: () => void;
  setReconnecting: (value: boolean) => void;
  clearReconnectedGameData: () => void;
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
  const [isSessionInvalidated, setIsSessionInvalidated] = useState(false);
  const [sessionInvalidatedReason, setSessionInvalidatedReason] = useState<string | null>(null);

  // Active game state (global - for reconnection modal)
  const [activeGame, setActiveGame] = useState<ActiveGameInfo | null>(null);
  const [isReconnecting, setIsReconnectingState] = useState(false);
  const [reconnectedGameData, setReconnectedGameData] = useState<unknown | null>(null);

  // Usar ref para evitar criacao duplicada de socket em React.StrictMode
  const socketRef = useRef<TypedSocket | null>(null);
  const connectingRef = useRef(false);
  const activeGameRef = useRef<ActiveGameInfo | null>(null);

  // Limpar estado de sessão invalidada
  const clearSessionInvalidated = useCallback(() => {
    setIsSessionInvalidated(false);
    setSessionInvalidatedReason(null);
  }, []);

  // Active game methods
  const clearActiveGame = useCallback(() => {
    setActiveGame(null);
    activeGameRef.current = null;
    setIsReconnectingState(false);
  }, []);

  const setReconnecting = useCallback((value: boolean) => {
    setIsReconnectingState(value);
  }, []);

  const clearReconnectedGameData = useCallback(() => {
    setReconnectedGameData(null);
  }, []);

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

    // Listener para invalidação de sessão (limite de 1 aba por usuário)
    newSocket.on('sessionInvalidated', (data) => {
      console.log('Sessão invalidada:', data.reason);
      setIsSessionInvalidated(true);
      setSessionInvalidatedReason(data.reason);
    });

    // NOTA: Listeners de active game foram movidos para useEffect separado
    // para evitar duplicação a cada reconexão

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

  // ==========================================
  // ACTIVE GAME LISTENERS (Global)
  // Registrados em useEffect separado para evitar duplicação
  // ==========================================
  useEffect(() => {
    if (!socket) return;

    // Evento: usuário já está em uma sala/partida
    const handleAlreadyInGame = (data: { roomCode: string; gameStarted: boolean }) => {
      console.log('[SocketContext] alreadyInGame:', data);
      setActiveGame({
        roomCode: data.roomCode,
        gameStarted: data.gameStarted,
      });
      activeGameRef.current = {
        roomCode: data.roomCode,
        gameStarted: data.gameStarted,
      };
    };

    // Evento: reconectado com sucesso à sala
    const handleReconnected = (data: unknown) => {
      console.log('[SocketContext] reconnected:', data);
      setIsReconnectingState(false);
      setActiveGame(null);
      activeGameRef.current = null;
      // Armazenar dados do jogo para navegação
      setReconnectedGameData(data);
    };

    // Evento: jogo abandonado
    const handleGameAbandoned = () => {
      console.log('[SocketContext] gameAbandoned');
      setActiveGame(null);
      activeGameRef.current = null;
      setIsReconnectingState(false);
    };

    // Evento: sala deletada
    const handleRoomDeleted = (data: { code: string }) => {
      console.log('[SocketContext] roomDeleted:', data);
      // Limpar activeGame se for a mesma sala
      if (activeGameRef.current?.roomCode === data.code) {
        setActiveGame(null);
        activeGameRef.current = null;
        setIsReconnectingState(false);
      }
    };

    // Registrar listeners
    socket.on('alreadyInGame', handleAlreadyInGame);
    socket.on('reconnected', handleReconnected);
    socket.on('gameAbandoned', handleGameAbandoned);
    socket.on('roomDeleted', handleRoomDeleted);

    // Cleanup: remover listeners ao trocar socket ou desmontar
    return () => {
      socket.off('alreadyInGame', handleAlreadyInGame);
      socket.off('reconnected', handleReconnected);
      socket.off('gameAbandoned', handleGameAbandoned);
      socket.off('roomDeleted', handleRoomDeleted);
    };
  }, [socket]);

  // Handler para quando o usuário fecha a aba/navegador
  // IMPORTANTE: NÃO emitir leaveRoom aqui!
  // O servidor detecta a desconexão automaticamente via Socket.IO disconnect event.
  // Se emitirmos leaveRoom antes do disconnect, o jogador é removido da sala
  // e perde a chance de reconectar durante o grace period.
  //
  // O leaveRoom só deve ser chamado EXPLICITAMENTE quando o jogador clica em "Sair".

  const value: SocketContextType = {
    socket,
    isConnected,
    isSessionInvalidated,
    sessionInvalidatedReason,
    // Active game state
    activeGame,
    isReconnecting,
    reconnectedGameData,
    connect,
    disconnect,
    clearSessionInvalidated,
    // Active game methods
    clearActiveGame,
    setReconnecting,
    clearReconnectedGameData,
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
