// ==========================================
// MULTIPLAYER GAME PAGE
// ==========================================

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSocket } from '../../../context/SocketContext';
import { useAuth } from '../../../context/AuthContext';
import { useRequireAuth } from '../../../hooks';
import {
  PlayerPublicState,
  RoundStartedPayload,
  ShotFiredPayload,
  ItemUsedPayload,
  GameOverPayload,
  PlayerGameStats,
  GameAward,
  AchievementUnlocked,
  PlayerXpResult,
} from '../../../../../shared/types';
import { GAME_RULES, ITEMS } from '../../../../../shared/constants';
import { ItemId } from '../../../../../shared/types';
import { getLevelInfo } from '../../../../../shared/utils/xpCalculator';
import { BugReportModal, GameStateForReport } from '../../../components/common/BugReportModal';
import { AchievementToast } from '../../../components/common';
import { GameBoard, GameBoardRef, GamePlayer, GameItem, ShotResult, RoundAnnouncement, StealModalData, ItemActionModal, TurnDirection } from '../../../components/game';
import { InterstitialAd, VideoRewardedAd } from '../../../components/ads';
import { AWARD_ICONS } from '../../../components/icons';
import { useSounds } from '../../../audio';
import './MultiplayerGame.css';

interface LocationState {
  roomCode: string;
  reconnected?: boolean;
  gameState?: RoundStartedPayload & {
    yourItems?: { id: string; emoji: string; name: string }[];
    yourHp?: number;
    roomCode?: string;
  };
}

interface ShellInfo {
  total: number;
  live: number;
  blank: number;
  initialTotal?: number;
  currentPosition?: number;
}

export default function MultiplayerGame() {
  const navigate = useNavigate();
  const location = useLocation();
  const { socket, isConnected } = useSocket();
  const { user } = useAuth();
  const {
    playDamage, playHeal, playItem,
    playRoundStart, playRoundWin, playGameOver,
    playTurnChange, playReload, resetTimerWarning, checkTimerWarning,
    playMusic, stopMusic
  } = useSounds();

  const state = location.state as LocationState | null;

  // Redirecionar se não autenticado
  useRequireAuth();

  // Tocar musica ambiente do jogo
  useEffect(() => {
    playMusic('ambient-game');
    return () => {
      stopMusic(true); // Para musica ao sair do jogo
    };
  }, [playMusic, stopMusic]);

  // Game state
  const [players, setPlayers] = useState<PlayerPublicState[]>([]);
  const [currentPlayerId, setCurrentPlayerId] = useState('');
  const [round, setRound] = useState(1);
  const [shells, setShells] = useState<ShellInfo>({ total: 0, live: 0, blank: 0 });
  const [myItems, setMyItems] = useState<{ id: string; emoji: string; name: string }[]>([]);
  const [revealedShell, setRevealedShell] = useState<'live' | 'blank' | null>(null);
  const [phoneRevealedPositions, setPhoneRevealedPositions] = useState<{ position: number; type: 'live' | 'blank' }[]>([]);

  // UI state
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [turnTimer, setTurnTimer] = useState(GAME_RULES.TIMERS.TURN_DURATION_MS / 1000);
  const [damagedPlayerId, setDamagedPlayerId] = useState<string | null>(null);
  const [healedPlayerId, setHealedPlayerId] = useState<string | null>(null);
  const [lastShotResult, setLastShotResult] = useState<ShotResult | null>(null);
  const [roundAnnouncement, setRoundAnnouncement] = useState<RoundAnnouncement | null>(null);
  const [playerLastShell, setPlayerLastShell] = useState<Record<string, 'live' | 'blank'>>({});
  const [stealingFromPlayer, setStealingFromPlayer] = useState<{
    playerId: string;
    playerName: string;
    items: { id: string; emoji: string; name: string }[];
  } | null>(null);
  const [gameOverData, setGameOverData] = useState<GameOverPayload | null>(null);
  const [unlockedAchievements, setUnlockedAchievements] = useState<AchievementUnlocked[]>([]);
  const [showBugReport, setShowBugReport] = useState(false);
  const [recentEvents, setRecentEvents] = useState<string[]>([]);
  const [itemActionModal, setItemActionModal] = useState<ItemActionModal | null>(null);
  const [turnDirection, setTurnDirection] = useState<TurnDirection>(1);

  // Disconnected players tracking for countdown
  const [disconnectedPlayers, setDisconnectedPlayers] = useState<{
    playerId: string;
    playerName: string;
    remainingTime: number;
  }[]>([]);

  // Rematch state
  const [isRequestingRematch, setIsRequestingRematch] = useState(false);

  // Ads state
  const [showInterstitial, setShowInterstitial] = useState(false);
  const [showRewarded, setShowRewarded] = useState(false);
  const [rewardClaimed, setRewardClaimed] = useState(false);

  // Estado para rastrear item roubado que precisa de alvo (Adrenaline + Handcuffs/Adrenaline)
  const [pendingStolenItem, setPendingStolenItem] = useState<{
    itemId: string;
    itemIndex: number;
    itemName: string;
    itemEmoji: string;
  } | null>(null);

  // Overlay queue system
  interface PendingOverlay {
    type: 'round' | 'shot' | 'reload';
    data: unknown;
    duration: number;
  }
  const [overlayQueue, setOverlayQueue] = useState<PendingOverlay[]>([]);

  // Get current player
  const myId = socket?.id || '';
  const isMyTurn = currentPlayerId === myId;
  const me = players.find(p => p.id === myId);

  // Check if any overlay is active (blocks actions)
  const hasActiveOverlay = useMemo(() => {
    return roundAnnouncement !== null ||
           lastShotResult !== null ||
           gameOverData !== null ||
           stealingFromPlayer !== null ||
           itemActionModal !== null;
  }, [roundAnnouncement, lastShotResult, gameOverData, stealingFromPlayer, itemActionModal]);

  // Ref to access current overlay state in socket handlers
  const hasActiveOverlayRef = useRef(hasActiveOverlay);
  hasActiveOverlayRef.current = hasActiveOverlay;

  // Ref for GameBoard to trigger shot animations
  const gameBoardRef = useRef<GameBoardRef>(null);

  // Process overlay queue when current overlay finishes
  useEffect(() => {
    if (!hasActiveOverlay && overlayQueue.length > 0) {
      const [next, ...rest] = overlayQueue;
      setOverlayQueue(rest);

      hasActiveOverlayRef.current = true;

      switch (next.type) {
        case 'round':
        case 'reload':
          // Animation component will call onRoundAnnouncementComplete when done
          setRoundAnnouncement(next.data as RoundAnnouncement);
          break;
        case 'shot':
          setLastShotResult(next.data as ShotResult);
          setTimeout(() => setLastShotResult(null), next.duration);
          break;
      }
    }
  }, [hasActiveOverlay, overlayQueue]);

  // Initialize game state
  useEffect(() => {
    if (!state || !socket) {
      navigate('/multiplayer');
      return;
    }

    if (state.gameState) {
      const gs = state.gameState;
      setPlayers(gs.players);
      setCurrentPlayerId(gs.currentPlayer);
      setRound(gs.round);
      setShells(gs.shells);

      const items = gs.itemsReceived || gs.yourItems || [];
      setMyItems(items);

      const maxHp = gs.maxHp || gs.yourHp || players.find(p => p.alive)?.maxHp || 4;

      if (!state.reconnected) {
        // Animation component will call onRoundAnnouncementComplete when done
        setRoundAnnouncement({
          round: gs.round,
          live: gs.shells.live,
          blank: gs.shells.blank,
          hp: maxHp,
        });
        hasActiveOverlayRef.current = true;
      } else {
        setMessage('Reconectado ao jogo!');
      }
    }
  }, [state, socket, navigate]);

  // Ref para evitar múltiplas tentativas de reconexão
  const reconnectAttemptedRef = useRef(false);

  // Auto-reconnect quando Socket.IO reconecta automaticamente
  useEffect(() => {
    if (!socket || !isConnected) return;
    if (reconnectAttemptedRef.current) return;

    const saved = localStorage.getItem('bangshotReconnect');
    if (!saved) return;

    try {
      const data = JSON.parse(saved);

      // Verificar se a sessão não expirou (5 minutos)
      if (Date.now() - data.timestamp > 5 * 60 * 1000) {
        localStorage.removeItem('bangshotReconnect');
        return;
      }

      // Verificar se já está na sala com este socket.id
      const alreadyInRoom = players.some(p => p.id === socket.id);
      if (alreadyInRoom) {
        localStorage.removeItem('bangshotReconnect');
        return;
      }

      // Marcar que já tentou reconectar para evitar tentativas duplicadas
      reconnectAttemptedRef.current = true;

      console.log('[Game] Tentando reconexão automática para sala:', data.roomCode);
      socket.emit('reconnectToGame', {
        roomCode: data.roomCode,
        playerName: data.playerName,
        reconnectToken: data.reconnectToken,
      });
    } catch {
      localStorage.removeItem('bangshotReconnect');
    }
  }, [socket, isConnected, players]);

  // Socket event handlers
  useEffect(() => {
    if (!socket) return;

    // Round started
    socket.on('roundStarted', (data: RoundStartedPayload) => {
      // Tocar som de início de round e recarregar
      playRoundStart();
      playReload();
      resetTimerWarning(); // Resetar warning do timer para novo round

      setPlayers(data.players);
      setCurrentPlayerId(data.currentPlayer);
      setRound(data.round);
      setShells(data.shells);
      setMyItems(data.itemsReceived || []);
      setRevealedShell(null);
      setPhoneRevealedPositions([]);
      setSelectedTarget(null);
      setSelectedItem(null);
      setPendingStolenItem(null); // Limpar item pendente no início do round
      setPlayerLastShell({});
      setTurnDirection(data.turnDirection || 1);

      const overlayData: RoundAnnouncement = {
        round: data.round,
        live: data.shells.live,
        blank: data.shells.blank,
        hp: data.maxHp,
      };

      if (hasActiveOverlayRef.current) {
        setOverlayQueue(prev => [...prev, {
          type: 'round' as const,
          data: overlayData,
          duration: 5000,
        }]);
      } else {
        // Animation component will call onRoundAnnouncementComplete when done
        hasActiveOverlayRef.current = true;
        setRoundAnnouncement(overlayData);
      }

      setMessage('');

      // Sincronizar timer com servidor usando turnElapsed (tempo já decorrido)
      if (data.turnElapsed !== undefined) {
        const elapsedSec = Math.floor(data.turnElapsed / 1000);
        const remaining = Math.max(0, (GAME_RULES.TIMERS.TURN_DURATION_MS / 1000) - elapsedSec);
        setTurnTimer(remaining);
      } else if (data.turnStartTime) {
        // fallback para compatibilidade com versões antigas
        const elapsed = Math.floor((Date.now() - data.turnStartTime) / 1000);
        const remaining = Math.max(0, (GAME_RULES.TIMERS.TURN_DURATION_MS / 1000) - elapsed);
        setTurnTimer(remaining);
      } else {
        setTurnTimer(GAME_RULES.TIMERS.TURN_DURATION_MS / 1000);
      }
    });

    // Turn changed
    socket.on('turnChanged', ({ currentPlayer, players: updatedPlayers, turnElapsed, turnStartTime }) => {
      // Tocar som de mudança de turno
      playTurnChange();
      resetTimerWarning(); // Resetar warning do timer para novo turno

      setCurrentPlayerId(currentPlayer);
      setRevealedShell(null);
      setSelectedTarget(null);
      setSelectedItem(null);
      setPendingStolenItem(null); // Limpar item pendente quando turno muda
      setMessage(''); // Limpar mensagem anterior

      // Calcular tempo restante usando turnElapsed (tempo já decorrido)
      if (turnElapsed !== undefined) {
        const elapsedSec = Math.floor(turnElapsed / 1000);
        const remaining = Math.max(0, (GAME_RULES.TIMERS.TURN_DURATION_MS / 1000) - elapsedSec);
        setTurnTimer(remaining);
      } else if (turnStartTime) {
        // fallback para compatibilidade
        const elapsed = Math.floor((Date.now() - turnStartTime) / 1000);
        const remaining = Math.max(0, (GAME_RULES.TIMERS.TURN_DURATION_MS / 1000) - elapsed);
        setTurnTimer(remaining);
      } else {
        setTurnTimer(GAME_RULES.TIMERS.TURN_DURATION_MS / 1000);
      }

      if (updatedPlayers) {
        setPlayers(updatedPlayers);
        const myData = updatedPlayers.find(p => p.id === myId);
        if (myData) {
          setMyItems(myData.items);
        }
      }
    });

    // Shot fired
    socket.on('shotFired', (data: ShotFiredPayload) => {
      // Trigger shot animation + sound via GameBoard ref
      gameBoardRef.current?.triggerShot(data.shell === 'live');

      // Som de dano se acertou alguém
      if (data.shell === 'live' && data.damage > 0) {
        setTimeout(() => playDamage(), 500); // Delay para sincronizar com animação (spin + tiro)
      }

      setPlayerLastShell(prev => ({
        ...prev,
        [data.shooter]: data.shell
      }));

      const shooterName = data.shooter === myId ? 'Você' : data.shooterName;
      const targetName = data.target === myId ? 'você' : data.targetName;

      hasActiveOverlayRef.current = true;

      setLastShotResult({
        type: data.shell,
        shooter: shooterName,
        target: targetName,
        damage: data.damage,
      });
      setTimeout(() => setLastShotResult(null), 3000);

      if (data.players) {
        setPlayers(data.players);
        const myData = data.players.find(p => p.id === myId);
        if (myData) {
          setMyItems(myData.items);
        }
      }

      // Remover posição revelada do Phone que foi gasta (a posição atual antes do tiro)
      // A posição gasta é calculada como: total inicial - total restante - 1
      const spentPosition = (shells.initialTotal || shells.total) - data.shellsRemaining.total - 1;
      setPhoneRevealedPositions(prev => prev.filter(p => p.position !== spentPosition));

      // Limpar revelação da lupa quando cartucho é usado
      setRevealedShell(null);

      setShells(data.shellsRemaining);

      if (data.shell === 'live') {
        setDamagedPlayerId(data.target);
        setTimeout(() => setDamagedPlayerId(null), 600);
      }
    });

    // Item used
    socket.on('itemUsed', (data: ItemUsedPayload) => {
      // Tocar som do item
      playItem(data.itemId);

      const userName = data.playerId === myId ? 'Você' : data.playerName;
      const item = ITEMS[data.itemId as ItemId];
      const isMe = data.playerId === myId;

      // Determinar informação extra baseado no tipo de item e se é o próprio jogador
      let extraInfo: string | undefined;
      if (isMe) {
        // Mostrar informação completa apenas para quem usou
        if (data.itemId === 'magnifying_glass' && data.revealedShell) {
          extraInfo = data.revealedShell === 'live' ? '🔴 VIVA' : '🔵 VAZIA';
          setRevealedShell(data.revealedShell);
        } else if (data.itemId === 'phone' && data.phoneShell && data.phonePosition) {
          extraInfo = `#${data.phonePosition}: ${data.phoneShell === 'live' ? '🔴 LIVE' : '🔵 BLANK'}`;
          // Adicionar posição revelada ao estado (phonePosition é 1-indexed, converter para 0-indexed)
          setPhoneRevealedPositions(prev => [
            ...prev.filter(p => p.position !== data.phonePosition! - 1),
            { position: data.phonePosition! - 1, type: data.phoneShell! }
          ]);
        } else if (data.itemId === 'beer' && data.ejectedShell) {
          extraInfo = data.ejectedShell === 'live' ? '🔴 VIVA' : '🔵 VAZIA';
        } else if (data.itemId === 'expired_medicine') {
          if (data.healedAmount && data.healedAmount > 0) {
            extraInfo = `+${data.healedAmount} HP`;
          } else if (data.damagedAmount && data.damagedAmount > 0) {
            extraInfo = `-${data.damagedAmount} HP`;
          }
        }
      } else {
        // Para outros jogadores, mostrar info apenas de itens não-secretos
        if (data.itemId === 'beer' && data.ejectedShell) {
          extraInfo = data.ejectedShell === 'live' ? '🔴 VIVA' : '🔵 VAZIA';
        } else if (data.itemId === 'expired_medicine') {
          if (data.healedAmount && data.healedAmount > 0) {
            extraInfo = `+${data.healedAmount} HP`;
          } else if (data.damagedAmount && data.damagedAmount > 0) {
            extraInfo = `-${data.damagedAmount} HP`;
          }
        }
      }

      // Determinar mensagem especial para adrenaline
      let message = '';
      if (data.itemId === 'adrenaline' && data.stolenItem) {
        message = `Roubou ${data.stolenItem.emoji} ${data.stolenItem.name} de ${data.targetName}!`;
      } else if (data.itemId === 'handcuffs' && data.targetName) {
        message = `Algemou ${data.targetName}!`;
      } else if (data.itemId === 'turn_reverser') {
        message = 'Direção invertida!';
      }

      // Criar modal de item
      const modalData: ItemActionModal = {
        itemId: data.itemId,
        emoji: item?.emoji || '?',
        name: item?.name || data.itemId,
        playerName: userName,
        message: message,
        result: data.failed ? 'fail' : 'success',
        extraInfo: extraInfo,
      };

      hasActiveOverlayRef.current = true;
      setItemActionModal(modalData);
      setTimeout(() => setItemActionModal(null), 2500);

      // Atualizar direção se mudou (turn_reverser)
      if (data.directionChanged && data.newDirection !== undefined) {
        setTurnDirection(data.newDirection);
      }

      // Efeitos visuais e sonoros de cura/dano
      if (data.itemId === 'cigarettes' && data.healedAmount && data.healedAmount > 0) {
        playHeal();
        setHealedPlayerId(data.playerId);
        setTimeout(() => setHealedPlayerId(null), 700);
      }

      if (data.itemId === 'expired_medicine' && data.damagedAmount && data.damagedAmount > 0) {
        playDamage();
        setDamagedPlayerId(data.playerId);
        setTimeout(() => setDamagedPlayerId(null), 600);
      } else if (data.itemId === 'expired_medicine' && data.healedAmount && data.healedAmount > 0) {
        playHeal();
        setHealedPlayerId(data.playerId);
        setTimeout(() => setHealedPlayerId(null), 700);
      }

      if (data.ejectedShell) {
        setPlayerLastShell(prev => ({
          ...prev,
          [data.playerId]: data.ejectedShell!
        }));

        // Beer ejetou um cartucho - remover posição revelada do Phone que foi ejetada
        if (data.shellsRemaining) {
          const ejectedPosition = (shells.initialTotal || shells.total) - data.shellsRemaining.total - 1;
          setPhoneRevealedPositions(prev => prev.filter(p => p.position !== ejectedPosition));
          // Limpar revelação da lupa também
          setRevealedShell(null);
        }
      }

      // Inverter usado - INVERTER a cor da bala revelada (blank↔live)
      if (data.itemId === 'inverter') {
        // Inverter cor da revelação da lupa (se estava visível)
        setRevealedShell(prev => prev === 'blank' ? 'live' : prev === 'live' ? 'blank' : null);
        // Também inverter posição 0 do Phone (bala atual)
        setPhoneRevealedPositions(prev => prev.map(p =>
          p.position === 0 ? { ...p, type: p.type === 'blank' ? 'live' : 'blank' } : p
        ));
      }

      if (data.shellsRemaining) {
        setShells(data.shellsRemaining);
      }

      if (data.players) {
        setPlayers(data.players);
        const myData = data.players.find(p => p.id === myId);
        if (myData) {
          setMyItems(myData.items);
        }
      }

      setSelectedItem(null);

      // Verificar se item roubado precisa de alvo e foi eu quem usou
      // Segundo regras do Buckshot Roulette: item roubado DEVE ser usado imediatamente
      if (data.itemId === 'adrenaline' && data.stolenItem && isMe) {
        const stolenItemId = data.stolenItem.id;
        const needsTarget = stolenItemId === 'handcuffs' || stolenItemId === 'adrenaline';

        if (needsTarget) {
          // Encontrar o item no inventário atualizado
          const updatedItems = data.players?.find(p => p.id === myId)?.items || [];
          const stolenIndex = updatedItems.findIndex(item => item.id === stolenItemId);

          if (stolenIndex !== -1) {
            // Agendar para mostrar seleção de alvo APÓS o overlay de item fechar
            setTimeout(() => {
              setPendingStolenItem({
                itemId: stolenItemId,
                itemIndex: stolenIndex,
                itemName: data.stolenItem!.name,
                itemEmoji: data.stolenItem!.emoji,
              });
              setMessage(`Use ${data.stolenItem!.emoji} ${data.stolenItem!.name} - Selecione um alvo!`);
            }, 2600); // Overlay de item dura 2500ms + buffer
          }
        }
      }
    });

    // Shell ejected (Beer item)
    socket.on('shellEjected', (data: { ejectedShell: 'live' | 'blank'; playerId: string }) => {
      setPlayerLastShell(prev => ({
        ...prev,
        [data.playerId]: data.ejectedShell
      }));
    });

    // Shells reloaded
    socket.on('shellsReloaded', ({ shells: newShells, itemsDistributed }) => {
      setShells(newShells);
      setRevealedShell(null);
      // Limpar posições do Phone apenas no reload (novos cartuchos = novas posições)
      setPhoneRevealedPositions([]);
      setPlayerLastShell({});

      const myNewItems = itemsDistributed.find(d => d.playerId === myId)?.items || [];
      setMyItems(prev => [...prev, ...myNewItems].slice(0, GAME_RULES.ITEMS.MAX_PER_PLAYER));

      const overlayData: RoundAnnouncement = {
        round: round,
        live: newShells.live,
        blank: newShells.blank,
        hp: me?.maxHp || 4,
      };

      if (hasActiveOverlayRef.current) {
        setOverlayQueue(prev => [...prev, {
          type: 'reload' as const,
          data: overlayData,
          duration: 4000,
        }]);
      } else {
        // Animation component will call onRoundAnnouncementComplete when done
        hasActiveOverlayRef.current = true;
        setRoundAnnouncement(overlayData);
      }
    });

    // Player eliminated
    socket.on('playerEliminated', ({ playerId, playerName, reason }) => {
      setPlayers(prev => prev.map(p =>
        p.id === playerId ? { ...p, alive: false, hp: 0 } : p
      ));
      setDisconnectedPlayers(prev => prev.filter(p => p.playerId !== playerId));
      setMessage(`💀 ${playerName} foi eliminado! (${reason})`);
    });

    // Round ended
    socket.on('roundEnded', ({ winnerId, roundWins }) => {
      // Tocar som de vitória de round
      playRoundWin();

      const winner = players.find(p => p.id === winnerId);
      setMessage(`${winner?.name} venceu a rodada!`);

      setPlayers(prev => prev.map(p => {
        const wins = roundWins.find(w => w.playerId === p.id);
        return wins ? { ...p, roundWins: wins.wins } : p;
      }));
    });

    // Game over
    socket.on('gameOver', (data: GameOverPayload) => {
      // Tocar som de game over (vitória ou derrota)
      const isWinner = data.winner?.id === myId;
      playGameOver(isWinner);

      localStorage.removeItem('bangshotSession');
      localStorage.removeItem('bangshotReconnect');
      setGameOverData(data);
      setIsRequestingRematch(false);
    });

    // Rematch - room created (I'm the host)
    socket.on('roomCreated', (data) => {
      setIsRequestingRematch(false);
      navigate('/multiplayer/room', {
        state: {
          roomCode: data.code,
          isHost: true,
          players: data.players,
          fromRematch: true,
        },
      });
    });

    // Rematch - room joined (I joined an existing rematch room)
    socket.on('roomJoined', (data) => {
      setIsRequestingRematch(false);
      navigate('/multiplayer/room', {
        state: {
          roomCode: data.code,
          isHost: data.isHost,
          players: data.players,
          fromRematch: true,
        },
      });
    });

    // Reconnected
    socket.on('reconnected', (data) => {
      console.log('[Game] Reconectado com sucesso ao jogo:', data.roomCode);
      console.log('[Game] Dados de reconexão:', { turnElapsed: data.turnElapsed, turnStartTime: data.turnStartTime });
      // Limpar dados de reconexão antigos (novo token será enviado pelo servidor)
      localStorage.removeItem('bangshotReconnect');
      setPlayers(data.players);
      setCurrentPlayerId(data.currentPlayer);
      setRound(data.round);
      setShells(data.shells);
      setMyItems(data.yourItems || []);
      setRevealedShell(null);
      setSelectedTarget(null);
      setSelectedItem(null);
      setMessage('Reconectado ao jogo!');

      // CRÍTICO: Sincronizar timer com o servidor
      if (data.turnElapsed !== undefined) {
        const elapsedSec = Math.floor(data.turnElapsed / 1000);
        const remaining = Math.max(0, (GAME_RULES.TIMERS.TURN_DURATION_MS / 1000) - elapsedSec);
        console.log('[Game] Timer sincronizado via turnElapsed:', { elapsedSec, remaining });
        setTurnTimer(remaining);
      } else if (data.turnStartTime) {
        const elapsed = Math.floor((Date.now() - data.turnStartTime) / 1000);
        const remaining = Math.max(0, (GAME_RULES.TIMERS.TURN_DURATION_MS / 1000) - elapsed);
        console.log('[Game] Timer sincronizado via turnStartTime:', { elapsed, remaining });
        setTurnTimer(remaining);
      }
    });

    // Reconnect error
    socket.on('reconnectError', (data) => {
      console.log('[Game] Erro ao reconectar:', data.message);
      // Limpar dados de reconexão inválidos
      localStorage.removeItem('bangshotReconnect');
      setMessage(`Erro: ${data.message}`);
    });

    // Reconnect credentials
    socket.on('reconnectCredentials', (data: { roomCode: string; playerName: string; reconnectToken: string }) => {
      localStorage.setItem('bangshotReconnect', JSON.stringify({
        roomCode: data.roomCode,
        playerName: data.playerName,
        reconnectToken: data.reconnectToken,
        timestamp: Date.now(),
      }));
      console.log('[Game] Credenciais de reconexão salvas:', data.roomCode);
    });

    // Achievements unlocked
    socket.on('achievementsUnlocked', (achievements: AchievementUnlocked[]) => {
      if (achievements.length > 0) {
        setUnlockedAchievements(achievements);
      }
    });

    // Player disconnected
    socket.on('playerDisconnected', ({ playerId, playerName, gracePeriod }) => {
      console.log('[Game] Recebeu playerDisconnected:', { playerId, playerName, gracePeriod });
      setDisconnectedPlayers(prev => {
        if (prev.find(p => p.playerId === playerId)) return prev;
        return [...prev, {
          playerId,
          playerName,
          remainingTime: Math.floor(gracePeriod / 1000),
        }];
      });
    });

    // Player reconnected
    socket.on('playerReconnected', ({ playerName }) => {
      setDisconnectedPlayers(prev => prev.filter(p => p.playerName !== playerName));
      setMessage(`${playerName} reconectou!`);
    });

    // Player items (para Adrenalina)
    socket.on('playerItems', (data: { targetId: string; targetName: string; items: { id: string; emoji: string; name: string }[] }) => {
      setStealingFromPlayer({
        playerId: data.targetId,
        playerName: data.targetName,
        items: data.items,
      });
    });

    // Action error
    socket.on('actionError', (error) => {
      setStealingFromPlayer(null);
      setSelectedItem(null);
      setSelectedTarget(null);
      setMessage(`Erro: ${error}`);
    });

    return () => {
      socket.off('roundStarted');
      socket.off('turnChanged');
      socket.off('shotFired');
      socket.off('itemUsed');
      socket.off('shellEjected');
      socket.off('shellsReloaded');
      socket.off('playerEliminated');
      socket.off('playerItems');
      socket.off('roundEnded');
      socket.off('gameOver');
      socket.off('playerDisconnected');
      socket.off('playerReconnected');
      socket.off('actionError');
      socket.off('reconnected');
      socket.off('reconnectError');
      socket.off('reconnectCredentials');
      socket.off('achievementsUnlocked');
      socket.off('roomCreated');
      socket.off('roomJoined');
    };
  }, [socket, players, myId, selectedItem, navigate, playDamage, playHeal, playItem, playRoundStart, playRoundWin, playGameOver, playTurnChange, playReload, resetTimerWarning]);

  // Turn timer - decrements for all players to stay in sync
  useEffect(() => {
    // Only run if game is in progress (currentPlayerId is set)
    if (!currentPlayerId) return;

    const interval = setInterval(() => {
      setTurnTimer(prev => {
        if (prev <= 0) {
          return 0;
        }
        const newTime = prev - 1;
        // Verificar se deve tocar warning (apenas uma vez quando chega em 10s)
        checkTimerWarning(newTime);
        return newTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [currentPlayerId, checkTimerWarning]);

  // Countdown timer for disconnected players
  useEffect(() => {
    if (disconnectedPlayers.length === 0) return;

    const interval = setInterval(() => {
      setDisconnectedPlayers(prev =>
        prev
          .map(p => ({ ...p, remainingTime: p.remainingTime - 1 }))
          .filter(p => p.remainingTime > 0)
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [disconnectedPlayers.length]);

  // Actions
  const handleShoot = useCallback((targetId: string) => {
    // Bloquear tiro se tem item roubado pendente de uso (ex: Handcuffs via Adrenaline)
    if (!socket || !isMyTurn || hasActiveOverlay || pendingStolenItem) return;
    socket.emit('shoot', { targetId });
    setSelectedTarget(null);
  }, [socket, isMyTurn, hasActiveOverlay, pendingStolenItem]);

  const handleUseItem = useCallback((itemIndex: number) => {
    if (!socket || !isMyTurn || hasActiveOverlay || itemIndex >= myItems.length) return;

    const item = myItems[itemIndex];
    const needsTarget = ['handcuffs', 'adrenaline'].includes(item.id);

    if (needsTarget && !selectedTarget) {
      setSelectedItem(itemIndex);
      setMessage('Selecione um alvo para usar o item');
      return;
    }

    if (item.id === 'adrenaline' && selectedTarget) {
      socket.emit('getPlayerItems', { targetId: selectedTarget });
      return;
    }

    socket.emit('useItem', {
      itemId: item.id as ItemId,
      targetId: selectedTarget || undefined,
      itemIndex,
    });

    setSelectedItem(null);
    setSelectedTarget(null);
  }, [socket, isMyTurn, hasActiveOverlay, myItems, selectedTarget]);

  const handleSelectTarget = (playerId: string) => {
    if (!isMyTurn || !socket || hasActiveOverlay) return;

    // Se tem item roubado pendente (Adrenaline -> Handcuffs/Adrenaline), usar automaticamente
    if (pendingStolenItem) {
      socket.emit('useItem', {
        itemId: pendingStolenItem.itemId as ItemId,
        targetId: playerId,
        itemIndex: pendingStolenItem.itemIndex,
      });
      setPendingStolenItem(null);
      setSelectedTarget(null);
      setMessage('');
      return;
    }

    if (selectedItem !== null) {
      const item = myItems[selectedItem];

      if (item.id === 'adrenaline') {
        socket.emit('getPlayerItems', { targetId: playerId });
        return;
      }

      socket.emit('useItem', {
        itemId: item.id as ItemId,
        targetId: playerId,
        itemIndex: selectedItem,
      });
      setSelectedItem(null);
      setSelectedTarget(null);
    } else {
      setSelectedTarget(playerId === selectedTarget ? null : playerId);
    }
  };

  const handleStealItem = useCallback((itemIndex: number) => {
    if (!socket || !stealingFromPlayer) return;
    socket.emit('useItem', {
      itemId: 'adrenaline',
      targetId: stealingFromPlayer.playerId,
      itemIndex,
    });
    setStealingFromPlayer(null);
    setSelectedItem(null);
    setSelectedTarget(null);
  }, [socket, stealingFromPlayer]);

  const handleCancelSteal = useCallback(() => {
    setStealingFromPlayer(null);
    setSelectedItem(null);
    setSelectedTarget(null);
  }, []);

  // Handle rematch request
  const handleRematch = useCallback(() => {
    if (!socket || !state?.roomCode || !me?.name) return;

    // Show interstitial ad before rematch
    setShowInterstitial(true);
  }, [socket, state?.roomCode, me?.name]);

  // Handle interstitial close and proceed with rematch
  const handleInterstitialClose = useCallback(() => {
    setShowInterstitial(false);
    if (!socket || !state?.roomCode || !me?.name) return;

    setIsRequestingRematch(true);
    socket.emit('requestRematch', {
      previousRoomCode: state.roomCode,
      playerName: me.name,
    });
  }, [socket, state?.roomCode, me?.name]);

  // Handle rewarded video completion
  const handleRewardClaimed = useCallback(() => {
    setRewardClaimed(true);
    setShowRewarded(false);
  }, []);

  // Helper to log events for bug reports
  const logEvent = useCallback((event: string) => {
    const timestamp = new Date().toISOString();
    setRecentEvents(prev => [...prev.slice(-49), `[${timestamp}] ${event}`]);
  }, []);

  // Build game state for bug report
  const gameStateForReport: GameStateForReport = useMemo(() => ({
    roomCode: state?.roomCode,
    round,
    players: players.map(p => ({ id: p.id, name: p.name, hp: p.hp, alive: p.alive })),
    currentPlayerId,
    shells,
    myItems: myItems.map(i => ({ id: i.id, name: i.name })),
    recentEvents,
  }), [state?.roomCode, round, players, currentPlayerId, shells, myItems, recentEvents]);

  if (!isConnected) {
    return (
      <div className="multiplayer-game-page">
        <p className="connecting-message">Reconectando...</p>
      </div>
    );
  }

  // Prepare props for GameBoard
  // Mostrar TODOS os jogadores (vivos e eliminados) para permitir roubo de itens com Adrenaline
  const otherPlayers = players.filter(p => p.id !== myId);

  const opponentsForBoard: GamePlayer[] = otherPlayers.map(p => ({
    id: p.id,
    name: p.name,
    hp: p.hp,
    maxHp: p.maxHp,
    items: p.items as GameItem[],
    handcuffed: p.handcuffed,
    sawedOff: p.sawedOff,
    alive: p.alive,
    roundWins: p.roundWins,
  }));

  const meForBoard: GamePlayer | null = me ? {
    id: me.id,
    name: me.name,
    hp: me.hp,
    maxHp: me.maxHp,
    items: me.items as GameItem[],
    handcuffed: me.handcuffed,
    sawedOff: me.sawedOff,
    alive: me.alive,
    roundWins: me.roundWins,
  } : null;

  const stealModalData: StealModalData | null = stealingFromPlayer ? {
    playerId: stealingFromPlayer.playerId,
    playerName: stealingFromPlayer.playerName,
    items: stealingFromPlayer.items as GameItem[],
  } : null;

  return (
    <div className="multiplayer-game-page">
      <GameBoard
        ref={gameBoardRef}
        round={round}
        maxRounds={GAME_RULES.MAX_ROUNDS}
        shells={shells}
        currentPlayerId={currentPlayerId}
        myId={myId}
        opponents={opponentsForBoard}
        me={meForBoard}
        myItems={myItems as GameItem[]}
        isMyTurn={isMyTurn}
        selectedTarget={selectedTarget}
        revealedShell={revealedShell}
        phoneRevealedPositions={phoneRevealedPositions}
        message={message}
        turnTimer={turnTimer}
        roundAnnouncement={roundAnnouncement}
        lastShotResult={lastShotResult}
        stealModalData={stealModalData}
        itemActionModal={itemActionModal}
        selectedItemId={selectedItem !== null ? myItems[selectedItem]?.id : null}
        turnDirection={turnDirection}
        gameOverData={gameOverData ? (
          <div className="game-over-overlay">
            <div className="game-over-modal">
              {/* Winner Header */}
              <div className="winner-header">
                <span className="crown">👑</span>
                <h2 className="winner-name">{gameOverData.winner?.name || 'Empate'}</h2>
              </div>

              {/* Stats Table - Compact */}
              {gameOverData.stats && gameOverData.stats.length > 0 && (
                <table className="stats-table">
                  <thead>
                    <tr>
                      <th>Jogador</th>
                      <th title="Rounds vencidos">ROUNDS</th>
                      <th title="Dano causado em outros jogadores">DANO</th>
                      <th title="Dano recebido de outros jogadores">SOFRIDO</th>
                      <th title="Dano causado em si mesmo">AUTO</th>
                      <th title="Total de tiros disparados">TIROS</th>
                      <th title="Jogadores eliminados">KILLS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gameOverData.stats.map((stat: PlayerGameStats) => (
                      <tr key={stat.odId} className={stat.odId === gameOverData.winner?.id ? 'winner-row' : ''}>
                        <td className="player-name-cell">{stat.guestName}</td>
                        <td>{stat.roundsWon}</td>
                        <td>{stat.damageDealt}</td>
                        <td>{stat.damageTaken}</td>
                        <td>{stat.selfDamage}</td>
                        <td>{stat.shotsFired}</td>
                        <td>{stat.kills}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* Awards - Com ícones SVG */}
              {gameOverData.awards && gameOverData.awards.length > 0 && (
                <div className="awards-section">
                  <h4>TÍTULOS</h4>
                  <div className="awards-list">
                    {gameOverData.awards.map((award: GameAward) => {
                      const IconComponent = AWARD_ICONS[award.type as keyof typeof AWARD_ICONS];
                      return (
                        <div key={award.type} className="award-item">
                          <div className="award-icon">
                            {IconComponent && <IconComponent size="md" color="var(--gold-accent)" />}
                          </div>
                          <div className="award-info">
                            <span className="award-title">{getAwardTitle(award.type)}</span>
                            <span className="award-description">{getAwardDescription(award.type)}</span>
                          </div>
                          <div className="award-winner">
                            <span className="award-player">{award.playerName}</span>
                            <span className="award-value">{award.value}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* XP Results - Apenas o meu */}
              {gameOverData.xpResults && gameOverData.xpResults.length > 0 && (() => {
                const myUserId = user?.id;
                const myXpResult = gameOverData.xpResults.find((xp: PlayerXpResult) => xp.odUserId === myUserId);
                if (!myXpResult) return null;

                const levelInfo = getLevelInfo(myXpResult.newTotalXp);
                return (
                  <div className="xp-section">
                    <h4>EXPERIÊNCIA</h4>
                    <div className="xp-item is-me">
                      <div className="xp-header">
                        <span className="xp-earned">+{myXpResult.xpEarned} XP</span>
                      </div>
                      {myXpResult.breakdown && (
                        <div className="xp-breakdown">
                          {myXpResult.breakdown.participation > 0 && <span>Participação: +{myXpResult.breakdown.participation}</span>}
                          {myXpResult.breakdown.positionBonus > 0 && <span>Posição: +{myXpResult.breakdown.positionBonus}</span>}
                          {myXpResult.breakdown.killXp > 0 && <span>Kills: +{myXpResult.breakdown.killXp}</span>}
                          {myXpResult.breakdown.roundWinXp > 0 && <span>Rounds: +{myXpResult.breakdown.roundWinXp}</span>}
                          {myXpResult.breakdown.damageXp > 0 && <span>Dano: +{myXpResult.breakdown.damageXp}</span>}
                          {myXpResult.breakdown.itemXp > 0 && <span>Itens: +{myXpResult.breakdown.itemXp}</span>}
                          {myXpResult.breakdown.survivalXp > 0 && <span>Sobrevivência: +{myXpResult.breakdown.survivalXp}</span>}
                        </div>
                      )}
                      <div className="xp-bar">
                        <span className="xp-level">Nv. {levelInfo.displayLevel}</span>
                        <div className="xp-progress">
                          <div className="xp-fill" style={{ width: `${Math.round(levelInfo.xpProgress * 100)}%` }} />
                        </div>
                      </div>
                      {/* LP Ranking */}
                      {myXpResult.lpChange !== undefined && (
                        <div className="lp-section">
                          {/* Promoção/Rebaixamento */}
                          {myXpResult.promoted && (
                            <div className="rank-event promotion">
                              🎉 Promovido para {myXpResult.displayRank}!
                            </div>
                          )}
                          {myXpResult.demoted && (
                            <div className="rank-event demotion">
                              📉 Rebaixado para {myXpResult.displayRank}
                            </div>
                          )}

                          {/* LP Change */}
                          <div className={`lp-change ${myXpResult.lpChange >= 0 ? 'positive' : 'negative'}`}>
                            {myXpResult.lpChange >= 0 ? '+' : ''}{myXpResult.lpChange} LP
                          </div>

                          {/* LP Progress Bar */}
                          <div className="lp-progress-container">
                            <span className="rank-badge">{myXpResult.displayRank}</span>
                            <div className="lp-bar">
                              <div
                                className="lp-fill"
                                style={{ width: `${myXpResult.newLp}%` }}
                              />
                            </div>
                            <span className="lp-text">{myXpResult.newLp}/100 LP</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Rewarded Video Option */}
              {!rewardClaimed && (
                <button
                  className="rewarded-video-btn"
                  onClick={() => setShowRewarded(true)}
                >
                  🎬 Assistir video para bonus XP
                </button>
              )}
              {rewardClaimed && (
                <div className="reward-claimed-badge">
                  ✓ Bonus XP reivindicado!
                </div>
              )}

              <div className="game-over-actions">
                <button
                  className="rematch-btn"
                  onClick={handleRematch}
                  disabled={isRequestingRematch}
                >
                  {isRequestingRematch ? 'Aguardando...' : 'Jogar Novamente'}
                </button>
                <button className="back-btn" onClick={() => navigate('/multiplayer')}>
                  Voltar ao Lobby
                </button>
              </div>
            </div>

            {/* Interstitial Ad */}
            <InterstitialAd
              isOpen={showInterstitial}
              onClose={handleInterstitialClose}
              position="game_over"
              autoCloseAfter={5}
            />

            {/* Rewarded Video Ad */}
            <VideoRewardedAd
              isOpen={showRewarded}
              onClose={() => setShowRewarded(false)}
              onRewardClaimed={handleRewardClaimed}
              rewardType="XP"
              rewardAmount={50}
            />
          </div>
        ) : null}
        damagedPlayerId={damagedPlayerId}
        healedPlayerId={healedPlayerId}
        playerLastShell={playerLastShell}
        onSelectTarget={handleSelectTarget}
        onShoot={handleShoot}
        onShootSelf={() => handleShoot(myId)}
        onUseItem={handleUseItem}
        onStealItem={handleStealItem}
        onCancelSteal={handleCancelSteal}
        onBack={() => navigate('/multiplayer')}
        onRoundAnnouncementComplete={() => {
          setRoundAnnouncement(null);
          // Spin dramático quando o anúncio do round termina
          gameBoardRef.current?.triggerReloadSpin();
        }}
      >
        {/* Disconnected Players Alert */}
        {disconnectedPlayers.length > 0 && (
          <div className="disconnected-players-container">
            {disconnectedPlayers.map(dp => (
              <div key={dp.playerId} className="disconnected-player-alert">
                <span className="warning-icon">⚠️</span>
                <span className="player-name">{dp.playerName} desconectou!</span>
                <span className={`countdown ${dp.remainingTime <= 10 ? 'critical' : ''}`}>
                  {dp.remainingTime}s
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Bug Report Button */}
        <button
          className="bug-report-btn"
          onClick={() => {
            logEvent('Bug report opened');
            setShowBugReport(true);
          }}
          title="Reportar Bug"
        >
          🐛
        </button>

        {/* Bug Report Modal */}
        <BugReportModal
          isOpen={showBugReport}
          onClose={() => setShowBugReport(false)}
          gameState={gameStateForReport}
        />

        {/* Achievement Toast */}
        <AchievementToast
          achievements={unlockedAchievements}
          onDismiss={() => setUnlockedAchievements([])}
        />
      </GameBoard>
    </div>
  );
}

// Helper functions for awards
function getAwardTitle(type: string): string {
  const titles: Record<string, string> = {
    'most_damage': 'Mais Dano',
    'most_damage_taken': 'Tank',
    'most_passive': 'Passivo',
    'most_self_damage': 'Masoquista',
    'most_items_used': 'Colecionador',
    'most_kills': 'Exterminador',
  };
  return titles[type] || type;
}

function getAwardDescription(type: string): string {
  const descriptions: Record<string, string> = {
    'most_damage': 'Causou mais dano total',
    'most_damage_taken': 'Recebeu mais dano',
    'most_passive': 'Atirou menos vezes',
    'most_self_damage': 'Mais dano em si mesmo',
    'most_items_used': 'Usou mais itens',
    'most_kills': 'Mais eliminações',
  };
  return descriptions[type] || '';
}
