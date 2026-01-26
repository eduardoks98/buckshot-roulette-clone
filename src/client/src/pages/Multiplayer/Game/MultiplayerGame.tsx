// ==========================================
// MULTIPLAYER GAME PAGE
// ==========================================

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSocket } from '../../../context/SocketContext';
import { useAuth } from '../../../context/AuthContext';
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
  MatchBadgeAwarded,
} from '../../../../../shared/types';
import { GAME_RULES, ITEMS } from '../../../../../shared/constants';
import { ItemId } from '../../../../../shared/types';
import { getLevelInfo } from '../../../../../shared/utils/xpCalculator';
import { BugReportModal, GameStateForReport } from '../../../components/common/BugReportModal';
import { AchievementToast } from '../../../components/common';
import { GameBoard, GamePlayer, GameItem, ShotResult, RoundAnnouncement, StealModalData } from '../../../components/game';
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
}

export default function MultiplayerGame() {
  const navigate = useNavigate();
  const location = useLocation();
  const { socket, isConnected } = useSocket();
  const { isAuthenticated, isLoading } = useAuth();

  const state = location.state as LocationState | null;

  // Redirecionar se não autenticado
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/');
    }
  }, [isLoading, isAuthenticated, navigate]);

  // Game state
  const [players, setPlayers] = useState<PlayerPublicState[]>([]);
  const [currentPlayerId, setCurrentPlayerId] = useState('');
  const [round, setRound] = useState(1);
  const [shells, setShells] = useState<ShellInfo>({ total: 0, live: 0, blank: 0 });
  const [myItems, setMyItems] = useState<{ id: string; emoji: string; name: string }[]>([]);
  const [revealedShell, setRevealedShell] = useState<'live' | 'blank' | null>(null);

  // UI state
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [turnTimer, setTurnTimer] = useState(GAME_RULES.TIMERS.TURN_DURATION_MS / 1000);
  const [shotAnimation, setShotAnimation] = useState<'live' | 'blank' | null>(null);
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

  // Disconnected players tracking for countdown
  const [disconnectedPlayers, setDisconnectedPlayers] = useState<{
    playerId: string;
    playerName: string;
    remainingTime: number;
  }[]>([]);

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
           stealingFromPlayer !== null;
  }, [roundAnnouncement, lastShotResult, gameOverData, stealingFromPlayer]);

  // Ref to access current overlay state in socket handlers
  const hasActiveOverlayRef = useRef(hasActiveOverlay);
  hasActiveOverlayRef.current = hasActiveOverlay;

  // Process overlay queue when current overlay finishes
  useEffect(() => {
    if (!hasActiveOverlay && overlayQueue.length > 0) {
      const [next, ...rest] = overlayQueue;
      setOverlayQueue(rest);

      hasActiveOverlayRef.current = true;

      switch (next.type) {
        case 'round':
        case 'reload':
          setRoundAnnouncement(next.data as RoundAnnouncement);
          setTimeout(() => setRoundAnnouncement(null), next.duration);
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
        setRoundAnnouncement({
          round: gs.round,
          live: gs.shells.live,
          blank: gs.shells.blank,
          hp: maxHp,
        });
        hasActiveOverlayRef.current = true;
        setTimeout(() => setRoundAnnouncement(null), 5000);
      } else {
        setMessage('Reconectado ao jogo!');
      }
    }
  }, [state, socket, navigate]);

  // Auto-reconnect quando Socket.IO reconecta automaticamente
  useEffect(() => {
    if (!socket || !isConnected) return;

    const saved = localStorage.getItem('bangshotReconnect');
    if (!saved) return;

    try {
      const data = JSON.parse(saved);
      const alreadyInRoom = players.some(p => p.id === socket.id);
      if (alreadyInRoom) return;

      if (players.length > 0) {
        console.log('[Game] Socket reconectou com novo ID, tentando reconexão automática...');
        socket.emit('reconnectToGame', {
          roomCode: data.roomCode,
          playerName: data.playerName,
          reconnectToken: data.reconnectToken,
        });
      }
    } catch {
      // ignore
    }
  }, [socket, isConnected]);

  // Socket event handlers
  useEffect(() => {
    if (!socket) return;

    // Round started
    socket.on('roundStarted', (data: RoundStartedPayload) => {
      setPlayers(data.players);
      setCurrentPlayerId(data.currentPlayer);
      setRound(data.round);
      setShells(data.shells);
      setMyItems(data.itemsReceived || []);
      setRevealedShell(null);
      setSelectedTarget(null);
      setSelectedItem(null);
      setPlayerLastShell({});

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
        hasActiveOverlayRef.current = true;
        setRoundAnnouncement(overlayData);
        setTimeout(() => setRoundAnnouncement(null), 5000);
      }

      setMessage('');
      setTurnTimer(GAME_RULES.TIMERS.TURN_DURATION_MS / 1000);
    });

    // Turn changed
    socket.on('turnChanged', ({ currentPlayer, reason, players: updatedPlayers }) => {
      setCurrentPlayerId(currentPlayer);
      setRevealedShell(null);
      setSelectedTarget(null);
      setSelectedItem(null);
      setTurnTimer(GAME_RULES.TIMERS.TURN_DURATION_MS / 1000);

      if (updatedPlayers) {
        setPlayers(updatedPlayers);
        const myData = updatedPlayers.find(p => p.id === myId);
        if (myData) {
          setMyItems(myData.items);
        }
      }

      const player = (updatedPlayers || players).find(p => p.id === currentPlayer);
      if (reason && player) {
        setMessage(`Turno de ${player.name} (${reason})`);
      }
    });

    // Shot fired
    socket.on('shotFired', (data: ShotFiredPayload) => {
      setPlayerLastShell(prev => ({
        ...prev,
        [data.shooter]: data.shell
      }));

      setShotAnimation(data.shell);
      setTimeout(() => setShotAnimation(null), 600);

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

      setShells(data.shellsRemaining);

      if (data.shell === 'live') {
        setMessage(`${shooterName} atirou em ${targetName}`);
        setDamagedPlayerId(data.target);
        setTimeout(() => setDamagedPlayerId(null), 600);
      } else {
        setMessage(`${shooterName} atirou em ${targetName}`);
      }
    });

    // Item used
    socket.on('itemUsed', (data: ItemUsedPayload) => {
      const userName = data.playerId === myId ? 'Você' : data.playerName;
      const item = ITEMS[data.itemId as ItemId];

      if (data.itemId === 'adrenaline' && data.stolenItem) {
        const stolenFrom = data.playerId === myId ? data.targetName : userName;
        const stolenBy = data.playerId === myId ? 'Você roubou' : `${userName} roubou`;
        setMessage(`💉 ${stolenBy} ${data.stolenItem.emoji} ${data.stolenItem.name} de ${stolenFrom}!`);
      } else {
        setMessage(`${userName} usou ${item?.emoji} ${item?.name}`);
      }

      if (data.itemId === 'magnifying_glass' && data.revealedShell) {
        if (data.playerId === myId) {
          setRevealedShell(data.revealedShell);
        }
      }

      if (data.itemId === 'phone' && data.phoneShell && data.playerId === myId) {
        setMessage(`📱 Cartucho #${data.phonePosition}: ${data.phoneShell === 'live' ? '🔴 LIVE' : '🔵 BLANK'}`);
      }

      if (data.itemId === 'cigarettes' && data.healedAmount && data.healedAmount > 0) {
        setHealedPlayerId(data.playerId);
        setTimeout(() => setHealedPlayerId(null), 700);
      }

      if (data.itemId === 'expired_medicine' && data.damagedAmount && data.damagedAmount > 0) {
        setDamagedPlayerId(data.playerId);
        setTimeout(() => setDamagedPlayerId(null), 600);
      } else if (data.itemId === 'expired_medicine' && data.healedAmount && data.healedAmount > 0) {
        setHealedPlayerId(data.playerId);
        setTimeout(() => setHealedPlayerId(null), 700);
      }

      if (data.ejectedShell) {
        setPlayerLastShell(prev => ({
          ...prev,
          [data.playerId]: data.ejectedShell!
        }));
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
        hasActiveOverlayRef.current = true;
        setRoundAnnouncement(overlayData);
        setTimeout(() => setRoundAnnouncement(null), 4000);
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
      const winner = players.find(p => p.id === winnerId);
      setMessage(`${winner?.name} venceu a rodada!`);

      setPlayers(prev => prev.map(p => {
        const wins = roundWins.find(w => w.playerId === p.id);
        return wins ? { ...p, roundWins: wins.wins } : p;
      }));
    });

    // Game over
    socket.on('gameOver', (data: GameOverPayload) => {
      localStorage.removeItem('bangshotSession');
      localStorage.removeItem('bangshotReconnect');
      setGameOverData(data);
    });

    // Reconnected
    socket.on('reconnected', (data) => {
      console.log('[Game] Reconectado com sucesso ao jogo:', data.roomCode);
      setPlayers(data.players);
      setCurrentPlayerId(data.currentPlayer);
      setRound(data.round);
      setShells(data.shells);
      setMyItems(data.yourItems || []);
      setRevealedShell(null);
      setSelectedTarget(null);
      setSelectedItem(null);
      setMessage('Reconectado ao jogo!');
    });

    // Reconnect error
    socket.on('reconnectError', (data) => {
      console.log('[Game] Erro ao reconectar:', data.message);
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
    };
  }, [socket, players, myId, selectedItem, navigate]);

  // Turn timer
  useEffect(() => {
    if (!isMyTurn) return;

    const interval = setInterval(() => {
      setTurnTimer(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isMyTurn, currentPlayerId]);

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
    if (!socket || !isMyTurn || hasActiveOverlay) return;
    socket.emit('shoot', { targetId });
    setSelectedTarget(null);
  }, [socket, isMyTurn, hasActiveOverlay]);

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
  const alivePlayers = players.filter(p => p.alive);
  const otherPlayers = alivePlayers.filter(p => p.id !== myId);

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
        message={message}
        turnTimer={turnTimer}
        roundAnnouncement={roundAnnouncement}
        lastShotResult={lastShotResult}
        stealModalData={stealModalData}
        gameOverData={gameOverData ? (
          <div className="game-over-overlay">
            <div className="game-over-modal">
              <h1 className="game-over-title">🏆 FIM DE JOGO 🏆</h1>

              {/* Winner */}
              <div className="winner-section">
                <span className="crown">👑</span>
                <h2 className="winner-name">{gameOverData.winner?.name || 'Empate'}</h2>
                {gameOverData.winner && (
                  <p className="winner-rounds">Vencedor com {gameOverData.winner.roundWins} rounds!</p>
                )}
              </div>

              {/* Stats Table */}
              {gameOverData.stats && gameOverData.stats.length > 0 && (
                <div className="stats-section">
                  <h3>📊 ESTATÍSTICAS</h3>
                  <table className="stats-table">
                    <thead>
                      <tr>
                        <th className="th-player">Jogador</th>
                        <th className="th-stat" title="Rounds Vencidos">
                          <span className="th-emoji">🏆</span>
                          <span className="th-label">Rounds</span>
                        </th>
                        <th className="th-stat" title="Dano Causado">
                          <span className="th-emoji">💥</span>
                          <span className="th-label">Dano</span>
                        </th>
                        <th className="th-stat" title="Dano Sofrido">
                          <span className="th-emoji">💔</span>
                          <span className="th-label">Sofrido</span>
                        </th>
                        <th className="th-stat" title="Dano em Si Mesmo">
                          <span className="th-emoji">🤕</span>
                          <span className="th-label">Auto</span>
                        </th>
                        <th className="th-stat" title="Tiros Disparados">
                          <span className="th-emoji">🔫</span>
                          <span className="th-label">Tiros</span>
                        </th>
                        <th className="th-stat" title="Eliminações">
                          <span className="th-emoji">☠️</span>
                          <span className="th-label">Kills</span>
                        </th>
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
                </div>
              )}

              {/* Awards */}
              {gameOverData.awards && gameOverData.awards.length > 0 && (
                <div className="awards-section">
                  <h3>🏅 TÍTULOS 🏅</h3>
                  <div className="awards-list">
                    {gameOverData.awards.map((award: GameAward) => (
                      <div key={award.type} className={`award-item ${award.type}`}>
                        <span className="award-icon">{getAwardIcon(award.type)}</span>
                        <span className="award-title">{getAwardTitle(award.type)}</span>
                        <span className="award-player">{award.playerName}</span>
                        <span className="award-value">({award.value})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* XP Results */}
              {gameOverData.xpResults && gameOverData.xpResults.length > 0 && (
                <div className="xp-results-section">
                  <h3>✨ EXPERIÊNCIA ✨</h3>
                  <div className="xp-results-list">
                    {gameOverData.xpResults.map((xpResult: PlayerXpResult) => {
                      const playerName = gameOverData.stats?.find(s => s.odId === xpResult.odId)?.guestName || 'Jogador';
                      const levelInfo = getLevelInfo(xpResult.newTotalXp);
                      const isMe = xpResult.odId === myId;
                      const leveledUp = xpResult.newLevel > xpResult.previousLevel;
                      const prestiged = xpResult.newPrestige > xpResult.previousPrestige;
                      return (
                        <div key={xpResult.odId} className={`xp-result-item ${isMe ? 'is-me' : ''} ${leveledUp ? 'leveled-up' : ''}`}>
                          <div className="xp-result-header">
                            <span className="xp-player-name">{playerName}</span>
                            <span className="xp-earned">+{xpResult.xpEarned} XP</span>
                          </div>
                          {isMe && (
                            <div className="xp-breakdown">
                              {xpResult.breakdown.participation > 0 && <span className="xp-detail">Participação: +{xpResult.breakdown.participation}</span>}
                              {xpResult.breakdown.positionBonus > 0 && <span className="xp-detail">Posição: +{xpResult.breakdown.positionBonus}</span>}
                              {xpResult.breakdown.killXp > 0 && <span className="xp-detail">Kills: +{xpResult.breakdown.killXp}</span>}
                              {xpResult.breakdown.roundWinXp > 0 && <span className="xp-detail">Rounds: +{xpResult.breakdown.roundWinXp}</span>}
                              {xpResult.breakdown.damageXp > 0 && <span className="xp-detail">Dano: +{xpResult.breakdown.damageXp}</span>}
                              {xpResult.breakdown.itemXp > 0 && <span className="xp-detail">Itens: +{xpResult.breakdown.itemXp}</span>}
                              {xpResult.breakdown.survivalXp > 0 && <span className="xp-detail">Sobrevivência: +{xpResult.breakdown.survivalXp}</span>}
                              {xpResult.breakdown.cleanPlayBonus > 0 && <span className="xp-detail">Jogo Limpo: +{xpResult.breakdown.cleanPlayBonus}</span>}
                            </div>
                          )}
                          <div className="xp-level-bar">
                            <div className="xp-level-info">
                              <span className="xp-level">Nv. {levelInfo.displayLevel}</span>
                              {levelInfo.prestigeLevel > 0 && (
                                <span className="xp-prestige">{'⭐'.repeat(Math.min(levelInfo.prestigeLevel, 5))}</span>
                              )}
                            </div>
                            <div className="xp-progress-bar">
                              <div
                                className="xp-progress-fill"
                                style={{ width: `${Math.round(levelInfo.xpProgress * 100)}%` }}
                              />
                            </div>
                          </div>
                          {leveledUp && <div className="level-up-alert">LEVEL UP! Nv. {xpResult.newLevel}</div>}
                          {prestiged && <div className="prestige-alert">⭐ PRESTÍGIO {xpResult.newPrestige}! ⭐</div>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Badges */}
              {gameOverData.badges && gameOverData.badges.length > 0 && (
                <div className="badges-section">
                  <h3>🎖️ BADGES 🎖️</h3>
                  <div className="badges-list">
                    {gameOverData.badges.map((badge: MatchBadgeAwarded, index: number) => (
                      <div key={`${badge.badgeId}-${index}`} className="badge-item">
                        <span className="badge-icon">{badge.icon}</span>
                        <div className="badge-info">
                          <span className="badge-name">{badge.name}</span>
                          <span className="badge-player">{badge.playerName}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                className="back-to-lobby-btn"
                onClick={() => navigate('/multiplayer')}
              >
                Voltar ao Lobby
              </button>
            </div>
          </div>
        ) : null}
        shotAnimation={shotAnimation}
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
function getAwardIcon(type: string): string {
  const icons: Record<string, string> = {
    'most_damage': '💥',
    'most_damage_taken': '🛡️',
    'most_passive': '🕊️',
    'most_self_damage': '🤕',
    'most_items_used': '🎒',
    'most_kills': '☠️',
  };
  return icons[type] || '🏅';
}

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
