// ==========================================
// TAB SYNC CONTEXT
// Gerencia sincronização entre abas automaticamente
// Funciona como um Provider - basta envolver o App
// ==========================================

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { soundManager } from '../audio/SoundManager';

// ==========================================
// TYPES
// ==========================================

interface TabSyncContextType {
  /** Se a aba está focada */
  isFocused: boolean;
  /** Se está sincronizando (voltando do blur) */
  isSyncing: boolean;
  /** Se o overlay deve ser mostrado */
  showOverlay: boolean;
  /** Mensagem do overlay */
  overlayMessage: string;
}

interface TabSyncProviderProps {
  children: ReactNode;
  /** Se deve recarregar ao voltar o foco (default: true) */
  reloadOnFocus?: boolean;
  /** Tempo mínimo fora de foco para recarregar em ms (default: 3000) */
  minBlurTime?: number;
  /** Se deve parar a música ao perder foco (default: true) */
  stopMusicOnBlur?: boolean;
  /** Se o provider está ativo (default: true) */
  enabled?: boolean;
}

// ==========================================
// CONTEXT
// ==========================================

const TabSyncContext = createContext<TabSyncContextType | null>(null);

// ==========================================
// OVERLAY COMPONENT (interno)
// ==========================================

function SyncOverlay({ isVisible, message }: { isVisible: boolean; message: string }) {
  if (!isVisible) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(10, 10, 10, 0.95)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      animation: 'fadeIn 0.3s ease',
    }}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '24px',
      }}>
        {/* Spinner */}
        <div style={{ position: 'relative', width: '80px', height: '80px' }}>
          <div style={{
            position: 'absolute',
            inset: 0,
            border: '3px solid transparent',
            borderTopColor: '#ff0040',
            borderRadius: '50%',
            animation: 'spin 1.5s linear infinite',
          }} />
          <div style={{
            position: 'absolute',
            inset: '8px',
            border: '3px solid transparent',
            borderRightColor: '#ff3366',
            borderRadius: '50%',
            animation: 'spin 1.5s linear infinite reverse',
            animationDelay: '0.15s',
          }} />
          <div style={{
            position: 'absolute',
            inset: '16px',
            border: '3px solid transparent',
            borderBottomColor: '#ff6699',
            borderRadius: '50%',
            animation: 'spin 1.5s linear infinite',
            animationDelay: '0.3s',
          }} />
        </div>
        {/* Message */}
        <p style={{
          fontFamily: "'Orbitron', sans-serif",
          fontSize: '1.125rem',
          fontWeight: 500,
          color: '#ffffff',
          textTransform: 'uppercase',
          letterSpacing: '2px',
          animation: 'pulse 2s ease-in-out infinite',
          margin: 0,
        }}>
          {message}
        </p>
      </div>
    </div>
  );
}

// ==========================================
// PROVIDER
// ==========================================

export function TabSyncProvider({
  children,
  reloadOnFocus = true,
  minBlurTime = 3000,
  stopMusicOnBlur = true,
  enabled = true,
}: TabSyncProviderProps) {
  const [isFocused, setIsFocused] = useState(!document.hidden);
  const [isSyncing, setIsSyncing] = useState(false);
  const [blurTimestamp, setBlurTimestamp] = useState<number | null>(null);

  const handleVisibilityChange = useCallback(() => {
    if (!enabled) return;

    if (document.hidden) {
      // Tab lost focus
      console.log('[TabSync] Tab lost focus');
      setIsFocused(false);
      setBlurTimestamp(Date.now());

      // Stop music if configured
      if (stopMusicOnBlur) {
        soundManager.stopMusic(false);
      }
    } else {
      // Tab gained focus
      console.log('[TabSync] Tab gained focus');

      // Check if should reload
      if (blurTimestamp && reloadOnFocus) {
        const timeAway = Date.now() - blurTimestamp;

        if (timeAway >= minBlurTime) {
          console.log(`[TabSync] Was away for ${timeAway}ms, reloading...`);
          setIsSyncing(true);

          // Small delay to show loading before reload
          setTimeout(() => {
            window.location.reload();
          }, 500);
          return;
        }
      }

      setIsFocused(true);
      setBlurTimestamp(null);
    }
  }, [enabled, blurTimestamp, minBlurTime, reloadOnFocus, stopMusicOnBlur]);

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, handleVisibilityChange]);

  const showOverlay = enabled && (!isFocused || isSyncing);
  const overlayMessage = isSyncing ? 'Sincronizando...' : 'Jogo pausado';

  const value: TabSyncContextType = {
    isFocused,
    isSyncing,
    showOverlay,
    overlayMessage,
  };

  return (
    <TabSyncContext.Provider value={value}>
      <SyncOverlay isVisible={showOverlay} message={overlayMessage} />
      {children}
    </TabSyncContext.Provider>
  );
}

// ==========================================
// HOOK
// ==========================================

export function useTabSync(): TabSyncContextType {
  const context = useContext(TabSyncContext);
  if (!context) {
    throw new Error('useTabSync deve ser usado dentro de TabSyncProvider');
  }
  return context;
}

// ==========================================
// EXPORTS
// ==========================================

export default TabSyncProvider;
