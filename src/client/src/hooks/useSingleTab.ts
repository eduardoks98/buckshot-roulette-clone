// ==========================================
// USE SINGLE TAB - Limita jogo a 1 aba + sincronização
// Usa BroadcastChannel API para comunicação entre abas
// ==========================================

import { useEffect, useState, useCallback, useRef } from 'react';

const CHANNEL_NAME = 'bangshot_single_tab';
const TAB_ID_KEY = 'bangshot_active_tab_id';

interface UseSingleTabOptions {
  /** Callback quando a aba perde foco */
  onBlur?: () => void;
  /** Callback quando a aba ganha foco (antes do reload) */
  onFocus?: () => void;
  /** Callback quando a aba é invalidada por outra aba */
  onInvalidated?: (reason: string) => void;
  /** Se deve dar reload automático ao voltar o foco */
  reloadOnFocus?: boolean;
  /** Tempo mínimo fora de foco para dar reload (ms) */
  minBlurTime?: number;
  /** Se deve limitar a 1 aba */
  limitToSingleTab?: boolean;
  /** Ativar/desativar o hook */
  enabled?: boolean;
}

interface UseSingleTabResult {
  /** Se a aba está focada */
  isFocused: boolean;
  /** Se está em estado de "sincronizando" (voltando do blur) */
  isSyncing: boolean;
  /** Se a aba foi invalidada por outra aba */
  isInvalidated: boolean;
  /** Motivo da invalidação */
  invalidationReason: string | null;
  /** Recarrega a página */
  reloadPage: () => void;
  /** ID único desta aba */
  tabId: string;
}

// Gera um ID único para a aba
function generateTabId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Hook para garantir sincronização do estado do jogo entre abas
 * e limitar a apenas 1 aba ativa por vez
 *
 * @example
 * function App() {
 *   const { isFocused, isSyncing, isInvalidated, invalidationReason, reloadPage } = useSingleTab({
 *     reloadOnFocus: true,
 *     minBlurTime: 5000,
 *     limitToSingleTab: true,
 *   });
 *
 *   if (isInvalidated) return <SessionInvalidatedModal reason={invalidationReason} onReload={reloadPage} />;
 *   if (isSyncing) return <LoadingOverlay message="Sincronizando..." />;
 * }
 */
export function useSingleTab(options: UseSingleTabOptions = {}): UseSingleTabResult {
  const {
    onBlur,
    onFocus,
    onInvalidated,
    reloadOnFocus = true,
    minBlurTime = 3000,
    limitToSingleTab = true,
    enabled = true,
  } = options;

  const [isFocused, setIsFocused] = useState(!document.hidden);
  const [isSyncing, setIsSyncing] = useState(false);
  const [blurTimestamp, setBlurTimestamp] = useState<number | null>(null);
  const [isInvalidated, setIsInvalidated] = useState(false);
  const [invalidationReason, setInvalidationReason] = useState<string | null>(null);

  const channelRef = useRef<BroadcastChannel | null>(null);
  const tabIdRef = useRef<string>(generateTabId());

  // Recarrega a página
  const reloadPage = useCallback(() => {
    window.location.reload();
  }, []);

  // Anuncia que esta aba está ativa
  const announceActive = useCallback(() => {
    if (!channelRef.current || !limitToSingleTab) return;

    channelRef.current.postMessage({
      type: 'TAB_ACTIVE',
      tabId: tabIdRef.current,
      timestamp: Date.now(),
    });

    localStorage.setItem(TAB_ID_KEY, tabIdRef.current);
  }, [limitToSingleTab]);

  // Handler de visibilidade (foco)
  const handleVisibilityChange = useCallback(() => {
    if (isInvalidated) return; // Ignorar se já foi invalidada

    if (document.hidden) {
      console.log('[SingleTab] Tab lost focus');
      setIsFocused(false);
      setBlurTimestamp(Date.now());
      onBlur?.();
    } else {
      console.log('[SingleTab] Tab gained focus');
      onFocus?.();

      if (blurTimestamp && reloadOnFocus) {
        const timeAway = Date.now() - blurTimestamp;

        if (timeAway >= minBlurTime) {
          console.log(`[SingleTab] Was away for ${timeAway}ms, reloading...`);
          setIsSyncing(true);
          setTimeout(() => window.location.reload(), 500);
          return;
        }
      }

      setIsFocused(true);
      setBlurTimestamp(null);

      // Re-anunciar ao ganhar foco
      announceActive();
    }
  }, [isInvalidated, blurTimestamp, minBlurTime, onBlur, onFocus, reloadOnFocus, announceActive]);

  // Handler de mensagens do BroadcastChannel
  const handleChannelMessage = useCallback((event: MessageEvent) => {
    const { type, tabId } = event.data;

    if (type === 'TAB_ACTIVE' && tabId !== tabIdRef.current) {
      // Outra aba anunciou que está ativa - invalidar esta
      console.log('[SingleTab] Nova aba detectada, invalidando esta aba');
      const reason = 'Você abriu o jogo em outra aba';
      setIsInvalidated(true);
      setInvalidationReason(reason);
      onInvalidated?.(reason);
    }
  }, [onInvalidated]);

  // Setup BroadcastChannel para limitação de 1 aba
  useEffect(() => {
    if (!enabled || !limitToSingleTab) return;

    if (typeof BroadcastChannel === 'undefined') {
      console.warn('[SingleTab] BroadcastChannel not supported');
      return;
    }

    channelRef.current = new BroadcastChannel(CHANNEL_NAME);
    channelRef.current.addEventListener('message', handleChannelMessage);

    // Anunciar após pequeno delay
    const timeout = setTimeout(() => announceActive(), 100);

    return () => {
      clearTimeout(timeout);
      channelRef.current?.removeEventListener('message', handleChannelMessage);
      channelRef.current?.close();
      channelRef.current = null;
    };
  }, [enabled, limitToSingleTab, handleChannelMessage, announceActive]);

  // Setup listener de visibilidade
  useEffect(() => {
    if (!enabled) return;

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [enabled, handleVisibilityChange]);

  return {
    isFocused,
    isSyncing,
    isInvalidated,
    invalidationReason,
    reloadPage,
    tabId: tabIdRef.current,
  };
}

export default useSingleTab;
