// ==========================================
// USE AUTO CLOSE MESSAGE - Fecha mensagem automaticamente
// ==========================================

import { useState, useCallback, useRef, useEffect } from 'react';

export interface UseAutoCloseMessageOptions {
  /** Tempo em ms para fechar automaticamente (default: 3000) */
  duration?: number;
}

export interface UseAutoCloseMessageReturn {
  /** Mensagem atual */
  message: string;
  /** Define uma nova mensagem (fecha automaticamente após duration) */
  setMessage: (msg: string) => void;
  /** Limpa a mensagem imediatamente */
  clearMessage: () => void;
}

/**
 * Hook para mensagens que fecham automaticamente após um tempo
 * Útil para feedback temporário ao usuário
 *
 * @example
 * function MyComponent() {
 *   const { message, setMessage } = useAutoCloseMessage({ duration: 3000 });
 *
 *   const handleError = () => setMessage('Erro ao processar');
 *
 *   return message ? <Alert>{message}</Alert> : null;
 * }
 */
export function useAutoCloseMessage(options: UseAutoCloseMessageOptions = {}): UseAutoCloseMessageReturn {
  const { duration = 3000 } = options;
  const [message, setMessageState] = useState('');
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Limpar timeout no unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const setMessage = useCallback((msg: string) => {
    // Limpar timeout anterior se existir
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setMessageState(msg);

    // Agendar limpeza automática
    if (msg) {
      timeoutRef.current = setTimeout(() => {
        setMessageState('');
      }, duration);
    }
  }, [duration]);

  const clearMessage = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setMessageState('');
  }, []);

  return {
    message,
    setMessage,
    clearMessage,
  };
}

export default useAutoCloseMessage;
