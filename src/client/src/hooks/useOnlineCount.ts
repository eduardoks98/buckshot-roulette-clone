// ==========================================
// HOOK - useOnlineCount
// Retorna o número de jogadores online
// ==========================================

import { useState, useEffect, useCallback } from 'react';
import { useSocket } from '../context/SocketContext';

export function useOnlineCount(): number {
  const { socket, isConnected } = useSocket();
  const [onlineCount, setOnlineCount] = useState(0);

  // Fetch online count via REST
  const fetchOnlineCount = useCallback(async () => {
    try {
      const res = await fetch('/api/online');
      if (res.ok) {
        const data = await res.json();
        setOnlineCount(data.total);
      }
    } catch {
      // silently fail
    }
  }, []);

  // Fetch initially and every 30 seconds
  useEffect(() => {
    fetchOnlineCount();
    const interval = setInterval(fetchOnlineCount, 30000);
    return () => clearInterval(interval);
  }, [fetchOnlineCount]);

  // Also listen for socket broadcasts if connected
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handler = (data: { total: number; inQueue: number }) => {
      setOnlineCount(data.total);
    };

    socket.on('onlineCount', handler);
    return () => { socket.off('onlineCount', handler); };
  }, [socket, isConnected]);

  return onlineCount;
}
