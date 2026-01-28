// ==========================================
// USE AUTO CONNECT - Conecta automaticamente ao socket
// ==========================================

import { useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';

/**
 * Hook para conectar automaticamente ao socket quando autenticado
 * Usado em páginas que precisam de conexão socket ativa
 *
 * @example
 * function MultiplayerLobby() {
 *   useAutoConnect();
 *   // ... resto do componente
 * }
 */
export function useAutoConnect() {
  const { isConnected, connect } = useSocket();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isConnected && isAuthenticated) {
      connect();
    }
  }, [isAuthenticated, isConnected, connect]);

  return { isConnected };
}

export default useAutoConnect;
