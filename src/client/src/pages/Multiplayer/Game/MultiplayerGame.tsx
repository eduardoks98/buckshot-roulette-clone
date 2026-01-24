// ==========================================
// MULTIPLAYER GAME PAGE
// ==========================================

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSocket } from '../../../context/SocketContext';
import {
  PlayerPublicState,
  RoundStartedPayload,
  ShotFiredPayload,
  ItemUsedPayload,
  GameOverPayload,
  PlayerGameStats,
  GameAward,
} from '../../../../../shared/types';
import { GAME_RULES, ITEMS } from '../../../../../shared/constants';
import { ItemId } from '../../../../../shared/types';
import './MultiplayerGame.css';

interface LocationState {
  roomCode: string;
  gameState?: RoundStartedPayload;
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

  const state = location.state as LocationState | null;

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
  const [lastShotResult, setLastShotResult] = useState<{ type: 'live' | 'blank'; shooter: string; target: string; damage: number } | null>(null);
  const [roundAnnouncement, setRoundAnnouncement] = useState<{ round: number; live: number; blank: number; hp: number } | null>(null);
  // Mapa: playerId -> último cartucho disparado (mostra apenas 1 por jogador)
  const [playerLastShell, setPlayerLastShell] = useState<Record<string, 'live' | 'blank'>>({});
  const [stealingFromPlayer, setStealingFromPlayer] = useState<{
    playerId: string;
    playerName: string;
    items: { id: string; emoji: string; name: string }[];
  } | null>(null);
  const [gameOverData, setGameOverData] = useState<GameOverPayload | null>(null);

  // Disconnected players tracking for countdown
  const [disconnectedPlayers, setDisconnectedPlayers] = useState<{
    playerId: string;
    playerName: string;
    remainingTime: number;
  }[]>([]);

  // Overlay queue system - prevents overlays from overlapping
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

  // Ref to access current overlay state in socket handlers (avoids stale closures)
  const hasActiveOverlayRef = useRef(hasActiveOverlay);
  hasActiveOverlayRef.current = hasActiveOverlay;

  // Process overlay queue when current overlay finishes
  useEffect(() => {
    if (!hasActiveOverlay && overlayQueue.length > 0) {
      const [next, ...rest] = overlayQueue;
      setOverlayQueue(rest);

      // Atualizar ref IMEDIATAMENTE para evitar race condition
      hasActiveOverlayRef.current = true;

      switch (next.type) {
        case 'round':
        case 'reload':
          setRoundAnnouncement(next.data as { round: number; live: number; blank: number; hp: number });
          setTimeout(() => setRoundAnnouncement(null), next.duration);
          break;
        case 'shot':
          setLastShotResult(next.data as { type: 'live' | 'blank'; shooter: string; target: string; damage: number });
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
      setMyItems(gs.itemsReceived || []);
    }
  }, [state, socket, navigate]);

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
      setPlayerLastShell({}); // Limpar balas gastas no início da rodada

      const overlayData = {
        round: data.round,
        live: data.shells.live,
        blank: data.shells.blank,
        hp: data.maxHp,
      };

      // Se há overlay ativo (ex: resultado do tiro), enfileirar o anúncio
      if (hasActiveOverlayRef.current) {
        setOverlayQueue(prev => [...prev, {
          type: 'round' as const,
          data: overlayData,
          duration: 5000,
        }]);
      } else {
        // Atualizar ref IMEDIATAMENTE para evitar race condition
        hasActiveOverlayRef.current = true;
        // Mostrar anúncio de rodada em destaque (fica visível por 5 segundos)
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

      // Sincronizar estado dos jogadores do servidor (corrige dessincronização de itens)
      if (updatedPlayers) {
        setPlayers(updatedPlayers);
        // Sincronizar meus itens
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
      // Guardar apenas o ÚLTIMO cartucho do jogador que atirou
      setPlayerLastShell(prev => ({
        ...prev,
        [data.shooter]: data.shell
      }));

      // Disparar animação de tiro
      setShotAnimation(data.shell);
      setTimeout(() => setShotAnimation(null), 600);

      // Mostrar resultado do tiro em destaque (fica visível por 3 segundos)
      const shooterName = data.shooter === myId ? 'Você' : data.shooterName;
      const targetName = data.target === myId ? 'você' : data.targetName;

      // Atualizar ref IMEDIATAMENTE para evitar race condition com roundStarted
      hasActiveOverlayRef.current = true;

      setLastShotResult({
        type: data.shell,
        shooter: shooterName,
        target: targetName,
        damage: data.damage,
      });
      setTimeout(() => setLastShotResult(null), 3000);

      // Atualizar jogadores do servidor
      if (data.players) {
        setPlayers(data.players);
        // Sincronizar meus itens
        const myData = data.players.find(p => p.id === myId);
        if (myData) {
          setMyItems(myData.items);
        }
      }

      // shellsRemaining já é um ShellInfo (objeto)
      setShells(data.shellsRemaining);

      if (data.shell === 'live') {
        setMessage(`${shooterName} atirou em ${targetName}`);
        // Mostrar efeito de dano no alvo
        setDamagedPlayerId(data.target);
        setTimeout(() => setDamagedPlayerId(null), 600);
      } else {
        setMessage(`${shooterName} atirou em ${targetName}`);
      }
    });

    // Item used
    socket.on('itemUsed', (data: ItemUsedPayload) => {
      // Usar playerName que vem do servidor (não buscar em players que pode estar desatualizado)
      const userName = data.playerId === myId ? 'Você' : data.playerName;
      const item = ITEMS[data.itemId as ItemId];

      // Adrenaline - mostrar o item roubado
      if (data.itemId === 'adrenaline' && data.stolenItem) {
        const stolenFrom = data.playerId === myId ? data.targetName : userName;
        const stolenBy = data.playerId === myId ? 'Você roubou' : `${userName} roubou`;
        setMessage(`💉 ${stolenBy} ${data.stolenItem.emoji} ${data.stolenItem.name} de ${stolenFrom}!`);
      } else {
        setMessage(`${userName} usou ${item?.emoji} ${item?.name}`);
      }

      // Handle specific item effects
      if (data.itemId === 'magnifying_glass' && data.revealedShell) {
        if (data.playerId === myId) {
          setRevealedShell(data.revealedShell);
        }
      }

      // Phone - mostrar resultado apenas para quem usou
      if (data.itemId === 'phone' && data.phoneShell && data.playerId === myId) {
        setMessage(`📱 Cartucho #${data.phonePosition}: ${data.phoneShell === 'live' ? '🔴 LIVE' : '🔵 BLANK'}`);
      }

      // Efeitos visuais de cura
      if (data.itemId === 'cigarettes' && data.healedAmount && data.healedAmount > 0) {
        setHealedPlayerId(data.playerId);
        setTimeout(() => setHealedPlayerId(null), 700);
      }

      // Efeitos visuais de dano (expired medicine que deu errado)
      if (data.itemId === 'expired_medicine' && data.damagedAmount && data.damagedAmount > 0) {
        setDamagedPlayerId(data.playerId);
        setTimeout(() => setDamagedPlayerId(null), 600);
      } else if (data.itemId === 'expired_medicine' && data.healedAmount && data.healedAmount > 0) {
        setHealedPlayerId(data.playerId);
        setTimeout(() => setHealedPlayerId(null), 700);
      }

      // Beer ejected a shell - mostrar para o jogador que usou
      if (data.ejectedShell) {
        setPlayerLastShell(prev => ({
          ...prev,
          [data.playerId]: data.ejectedShell!
        }));
      }

      // Atualizar shells se mudou
      if (data.shellsRemaining) {
        setShells(data.shellsRemaining);
      }

      // Update players state from server response
      if (data.players) {
        setPlayers(data.players);
        // Sync my items from server state
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
      setPlayerLastShell({}); // Limpar balas gastas quando recarrega

      const myNewItems = itemsDistributed.find(d => d.playerId === myId)?.items || [];
      setMyItems(prev => [...prev, ...myNewItems].slice(0, GAME_RULES.ITEMS.MAX_PER_PLAYER));

      const overlayData = {
        round: round,
        live: newShells.live,
        blank: newShells.blank,
        hp: me?.maxHp || 4,
      };

      // Se há overlay ativo, enfileirar
      if (hasActiveOverlayRef.current) {
        setOverlayQueue(prev => [...prev, {
          type: 'reload' as const,
          data: overlayData,
          duration: 4000,
        }]);
      } else {
        // Atualizar ref IMEDIATAMENTE para evitar race condition
        hasActiveOverlayRef.current = true;
        // Mostrar anúncio de recarga com LIVE/BLANK igual ao início de rodada
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

      // Update round wins
      setPlayers(prev => prev.map(p => {
        const wins = roundWins.find(w => w.playerId === p.id);
        return wins ? { ...p, roundWins: wins.wins } : p;
      }));
    });

    // Game over
    socket.on('gameOver', (data: GameOverPayload) => {
      // Limpar sessões salvas
      localStorage.removeItem('buckshotSession');
      localStorage.removeItem('buckshotReconnect');

      // Mostrar modal de fim de jogo com estatísticas
      setGameOverData(data);
    });

    // Reconnect credentials - salvar para possível reconexão
    socket.on('reconnectCredentials', (data: { roomCode: string; playerName: string; reconnectToken: string }) => {
      localStorage.setItem('buckshotReconnect', JSON.stringify({
        roomCode: data.roomCode,
        playerName: data.playerName,
        reconnectToken: data.reconnectToken,
        timestamp: Date.now(),
      }));
      console.log('[Game] Credenciais de reconexão salvas:', data.roomCode);
    });

    // Player disconnected
    socket.on('playerDisconnected', ({ playerId, playerName, gracePeriod }) => {
      setDisconnectedPlayers(prev => {
        // Evitar duplicatas
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
      // Filtrar por playerName pois o playerId muda após reconexão (novo socket.id)
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
      socket.off('reconnectCredentials');
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

  // Actions - blocked when overlay is active
  const handleShoot = useCallback((targetId: string) => {
    if (!socket || !isMyTurn || hasActiveOverlay) return;
    socket.emit('shoot', { targetId });
    setSelectedTarget(null);
  }, [socket, isMyTurn, hasActiveOverlay]);

  const handleUseItem = useCallback((itemIndex: number) => {
    if (!socket || !isMyTurn || hasActiveOverlay || itemIndex >= myItems.length) return;

    const item = myItems[itemIndex];

    // Items that need a target
    const needsTarget = ['handcuffs', 'adrenaline'].includes(item.id);

    if (needsTarget && !selectedTarget) {
      setSelectedItem(itemIndex);
      setMessage('Selecione um alvo para usar o item');
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

      // Adrenaline: primeiro obter os itens do alvo antes de usar
      if (item.id === 'adrenaline') {
        socket.emit('getPlayerItems', { targetId: playerId });
        setSelectedItem(null);
        return;
      }

      // Using item on target
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

  if (!isConnected) {
    return (
      <div className="game-container">
        <p className="connecting-message">Reconectando...</p>
      </div>
    );
  }

  const alivePlayers = players.filter(p => p.alive);
  const otherPlayers = alivePlayers.filter(p => p.id !== myId);

  return (
    <div className="game-container">
      {/* Header */}
      <div className="game-header">
        <div className="round-info">Rodada {round}/{GAME_RULES.MAX_ROUNDS}</div>
        <div className="shells-info">
          <span className="shells-remaining">{shells.total} CARTUCHOS</span>
        </div>
        {isMyTurn && (
          <div className={`turn-timer ${turnTimer <= 10 ? 'warning' : ''} ${turnTimer <= 30 ? 'caution' : ''}`}>
            {turnTimer}s
          </div>
        )}
      </div>

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

      {/* Round Announcement Overlay */}
      {roundAnnouncement && !gameOverData && (
        <div className="round-announcement-overlay">
          <div className="round-announcement">
            <h2>🎯 RODADA {roundAnnouncement.round}</h2>
            <div className="shell-distribution">
              {/* Shells visuais com cores */}
              <div className="shells-visual-container">
                {renderShellIcons(roundAnnouncement.live, roundAnnouncement.blank)}
              </div>

              {/* Legenda abaixo */}
              <div className="shell-legend">
                <span className="legend-item live">🔴 {roundAnnouncement.live} LIVE</span>
                <span className="legend-item blank">🔵 {roundAnnouncement.blank} BLANK</span>
              </div>
            </div>
            <div className="hp-announcement">❤️ {roundAnnouncement.hp} HP cada</div>
          </div>
        </div>
      )}

      {/* Shot Result Overlay */}
      {lastShotResult && !gameOverData && (
        <div className={`shot-result-overlay ${lastShotResult.type}`}>
          <div className="shot-result">
            {lastShotResult.type === 'live' ? (
              <>
                <div className="shot-icon">💥</div>
                <div className="shot-text">BALA REAL!</div>
                <div className="shot-damage">-{lastShotResult.damage} HP</div>
              </>
            ) : (
              <>
                <div className="shot-icon">💨</div>
                <div className="shot-text">VAZIA</div>
                <div className="shot-info">Sem dano</div>
              </>
            )}
            <div className="shot-details">
              {lastShotResult.shooter} → {lastShotResult.target}
            </div>
          </div>
        </div>
      )}

      {/* Message */}
      {message && !roundAnnouncement && !lastShotResult && !gameOverData && <div className="game-message">{message}</div>}

      {/* Revealed Shell */}
      {revealedShell && !gameOverData && (
        <div className={`revealed-shell ${revealedShell}`}>
          Proximo cartucho: {revealedShell === 'live' ? 'VIVA' : 'VAZIA'}
        </div>
      )}

      {/* Other Players */}
      <div className="opponents-area">
        {otherPlayers.map(player => (
          <div
            key={player.id}
            className={`opponent-card ${player.id === currentPlayerId ? 'active' : ''} ${player.id === selectedTarget ? 'selected' : ''} ${!player.alive ? 'dead' : ''} ${player.id === damagedPlayerId ? 'damage' : ''} ${player.id === healedPlayerId ? 'heal' : ''}`}
            onClick={() => player.alive && handleSelectTarget(player.id)}
          >
            <div className="opponent-name">
              {player.name}
              {player.roundWins > 0 && <span className="round-wins">🏆{player.roundWins}</span>}
              {player.handcuffed && <span className="status-icon">🔗</span>}
              {player.sawedOff && <span className="status-icon">🪚</span>}
            </div>
            <div className="opponent-hp">
              {Array.from({ length: player.maxHp }).map((_, i) => (
                <span
                  key={i}
                  className={`hp-heart ${i < player.hp ? 'full' : 'empty'}`}
                >
                  {i < player.hp ? '❤️' : '🖤'}
                </span>
              ))}
            </div>
            <div className="opponent-items">
              {player.items.slice(0, 8).map((item, i) => (
                <span key={i} className="item-icon">{item.emoji}</span>
              ))}
            </div>

            {/* Cartucho gasto deste jogador (apenas o último) */}
            {playerLastShell[player.id] && (
              <div className={`player-spent-shell ${playerLastShell[player.id]}`} />
            )}
          </div>
        ))}
      </div>

      {/* Shotgun Area */}
      <div className="shotgun-area">
        <div className={`shotgun ${isMyTurn ? 'active' : ''} ${shotAnimation ? `shot-${shotAnimation}` : ''}`}>
          <div className="shotgun-barrel"></div>
          <div className="shotgun-body"></div>
          {shotAnimation && <div className={`muzzle-flash ${shotAnimation}`}></div>}
        </div>

        {isMyTurn && selectedTarget && (
          <button
            className={`shoot-btn ${hasActiveOverlay ? 'disabled' : ''}`}
            onClick={() => handleShoot(selectedTarget)}
            disabled={hasActiveOverlay}
          >
            ATIRAR
          </button>
        )}

        {isMyTurn && !selectedTarget && (
          <div className="shoot-options">
            <button
              className={`shoot-self-btn ${hasActiveOverlay ? 'disabled' : ''}`}
              onClick={() => handleShoot(myId)}
              disabled={hasActiveOverlay}
            >
              Atirar em Si
            </button>
            <p className="shoot-hint">ou selecione um oponente</p>
          </div>
        )}
      </div>

      {/* My Status */}
      <div className={`my-status ${myId === damagedPlayerId ? 'damage' : ''} ${myId === healedPlayerId ? 'heal' : ''}`}>
        {/* Meu cartucho gasto (apenas o último) */}
        {playerLastShell[myId] && (
          <div className={`my-spent-shell ${playerLastShell[myId]}`} />
        )}
        {me && me.roundWins > 0 && <span className="my-round-wins">🏆 {me.roundWins}</span>}
        <div className="my-hp">
          {Array.from({ length: me?.maxHp || 0 }).map((_, i) => (
            <span
              key={i}
              className={`hp-heart ${i < (me?.hp || 0) ? 'full' : 'empty'}`}
            >
              {i < (me?.hp || 0) ? '❤️' : '🖤'}
            </span>
          ))}
        </div>

        {me?.handcuffed && <span className="my-status-effect">Algemado</span>}
        {me?.sawedOff && <span className="my-status-effect">Serrada (2x dano)</span>}
      </div>

      {/* My Items */}
      <div className="my-items">
        {myItems.map((item, index) => (
          <button
            key={index}
            className={`item-btn ${selectedItem === index ? 'selected' : ''} ${hasActiveOverlay ? 'disabled' : ''}`}
            onClick={() => isMyTurn && handleUseItem(index)}
            disabled={!isMyTurn || hasActiveOverlay}
            title={item.name}
          >
            {item.emoji}
          </button>
        ))}
        {myItems.length === 0 && (
          <p className="no-items">Sem itens</p>
        )}
      </div>

      {/* Turn Indicator */}
      {!isMyTurn && (
        <div className="waiting-turn">
          Vez de {players.find(p => p.id === currentPlayerId)?.name}...
        </div>
      )}

      {/* Steal Item Modal (Adrenaline) */}
      {stealingFromPlayer && !gameOverData && (
        <div className="steal-modal-overlay">
          <div className="steal-modal">
            <h3>💉 Roubar item de {stealingFromPlayer.playerName}</h3>
            <p className="steal-instruction">Selecione um item para roubar e USAR IMEDIATAMENTE:</p>
            <div className="steal-items">
              {stealingFromPlayer.items.filter(item => item.id !== 'adrenaline').length > 0 ? (
                stealingFromPlayer.items
                  .map((item, index) => ({ item, originalIndex: index }))
                  .filter(({ item }) => item.id !== 'adrenaline') // Não pode roubar outra Adrenalina
                  .map(({ item, originalIndex }) => (
                  <button
                    key={originalIndex}
                    className="steal-item-btn"
                    onClick={() => {
                      socket?.emit('useItem', {
                        itemId: 'adrenaline',
                        targetId: stealingFromPlayer.playerId,
                        itemIndex: originalIndex,
                      });
                      setStealingFromPlayer(null);
                    }}
                    title={`${item.name} (será usado imediatamente)`}
                  >
                    <span className="steal-item-emoji">{item.emoji}</span>
                    <span className="steal-item-name">{item.name}</span>
                  </button>
                ))
              ) : (
                <p className="no-items-to-steal">Este jogador não tem itens roubáveis!</p>
              )}
            </div>
            <button
              className="steal-cancel-btn"
              onClick={() => setStealingFromPlayer(null)}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Game Over Modal */}
      {gameOverData && (
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

            <button
              className="back-to-lobby-btn"
              onClick={() => navigate('/multiplayer')}
            >
              Voltar ao Lobby
            </button>
          </div>
        </div>
      )}
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

// Renderiza shells visuais coloridas - em sequência (LIVE primeiro, BLANK depois)
// NOTA: A ordem de disparo é aleatória (determinada pelo servidor), mas a visualização
// mostra apenas a COMPOSIÇÃO do pente, não a ordem real
function renderShellIcons(live: number, blank: number): JSX.Element {
  const shells: JSX.Element[] = [];

  // Primeiro todas as LIVE (vermelhas)
  for (let i = 0; i < live; i++) {
    shells.push(
      <div key={`live-${i}`} className="shell-icon live" title="LIVE">
        <div className="shell-tip"></div>
      </div>
    );
  }

  // Depois todas as BLANK (azuis)
  for (let i = 0; i < blank; i++) {
    shells.push(
      <div key={`blank-${i}`} className="shell-icon blank" title="BLANK">
        <div className="shell-tip"></div>
      </div>
    );
  }

  return <div className="shells-visual">{shells}</div>;
}
