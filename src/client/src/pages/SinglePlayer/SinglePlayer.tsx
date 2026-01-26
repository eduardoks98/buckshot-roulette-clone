import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  generateShells as generateShellsUtil,
  getRandomHP,
  ITEMS as SHARED_ITEMS,
  getRandomItem as getRandomItemUtil,
} from '../../../../shared';
import { GameBoard, GamePlayer, GameItem, ShotResult, RoundAnnouncement, StealModalData } from '../../components/game';
import './SinglePlayer.css';

// ========================================
// TYPES
// ========================================

interface Item {
  id: string;
  emoji: string;
  name: string;
  description?: string;
}

interface Character {
  hp: number;
  maxHp: number;
  items: Item[];
  handcuffed: boolean;
  sawedOff: boolean;
  knownShell?: 'live' | 'blank' | null;
}

interface RevealedPosition {
  index: number;
  type: 'live' | 'blank';
}

interface GameState {
  currentRound: number;
  player: Character;
  dealer: Character;
  shells: ('live' | 'blank')[];
  currentShellIndex: number;
  currentTurn: 'player' | 'dealer';
  isGameOver: boolean;
  winner: 'player' | 'dealer' | null;
  actionInProgress: boolean;
  revealedShell: 'live' | 'blank' | null;
  revealedPositions: RevealedPosition[];
}

// ========================================
// ITEMS (usando shared/constants/items)
// ========================================

const ITEMS = SHARED_ITEMS;

// ========================================
// HELPERS (usando shared/utils/gameUtils)
// ========================================

function getRandomItem(): Item {
  const item = getRandomItemUtil(['turn_reverser']);
  return item;
}

function createInitialState(round: number): GameState {
  const maxHp = getRandomHP();

  return {
    currentRound: round,
    player: {
      hp: maxHp,
      maxHp,
      items: [],
      handcuffed: false,
      sawedOff: false,
    },
    dealer: {
      hp: maxHp,
      maxHp,
      items: [],
      handcuffed: false,
      sawedOff: false,
      knownShell: null,
    },
    shells: [],
    currentShellIndex: 0,
    currentTurn: 'player',
    isGameOver: false,
    winner: null,
    actionInProgress: false,
    revealedShell: null,
    revealedPositions: [],
  };
}

const generateShells = generateShellsUtil;

// ========================================
// COMPONENT
// ========================================

export default function SinglePlayer() {
  const navigate = useNavigate();
  const [gameStarted, setGameStarted] = useState(false);
  const [game, setGame] = useState<GameState>(() => createInitialState(1));
  const [message, setMessage] = useState<string>('');
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [stealModalOpen, setStealModalOpen] = useState(false);
  const [roundAnnouncement, setRoundAnnouncement] = useState<RoundAnnouncement | null>(null);
  const [lastShotResult, setLastShotResult] = useState<ShotResult | null>(null);
  const [gameOverData, setGameOverData] = useState<{ show: boolean; victory: boolean } | null>(null);
  const [phoneModal, setPhoneModal] = useState<{ position: number; shell: 'live' | 'blank' } | null>(null);
  const [shotAnimation, setShotAnimation] = useState<'live' | 'blank' | null>(null);
  const [dealerDamageFlash, setDealerDamageFlash] = useState(false);
  const [playerDamageFlash, setPlayerDamageFlash] = useState(false);
  const [dealerHealFlash, setDealerHealFlash] = useState(false);
  const [playerHealFlash, setPlayerHealFlash] = useState(false);
  const [playerLastShell, setPlayerLastShell] = useState<Record<string, 'live' | 'blank'>>({});

  const dealerTimeoutRef = useRef<number | null>(null);

  // ========================================
  // COMPUTED VALUES
  // ========================================

  const liveRemaining = game.shells.slice(game.currentShellIndex).filter(s => s === 'live').length;
  const blankRemaining = game.shells.slice(game.currentShellIndex).filter(s => s === 'blank').length;
  const currentShell = game.shells[game.currentShellIndex];
  const hasActiveOverlay = roundAnnouncement !== null || lastShotResult !== null || gameOverData !== null || stealModalOpen;

  // ========================================
  // GAME LIFECYCLE
  // ========================================

  const startGame = useCallback(() => {
    const initialState = createInitialState(1);
    const shells = generateShells();
    const itemCount = 2;

    const playerItems: Item[] = [];
    const dealerItems: Item[] = [];
    for (let i = 0; i < itemCount; i++) {
      playerItems.push(getRandomItem());
      dealerItems.push(getRandomItem());
    }

    setGame({
      ...initialState,
      shells,
      player: { ...initialState.player, items: playerItems },
      dealer: { ...initialState.dealer, items: dealerItems },
    });
    setGameStarted(true);
    setPlayerLastShell({});

    const liveCount = shells.filter(s => s === 'live').length;
    const blankCount = shells.filter(s => s === 'blank').length;
    setRoundAnnouncement({
      round: 1,
      live: liveCount,
      blank: blankCount,
      hp: initialState.player.maxHp,
    });
    setTimeout(() => setRoundAnnouncement(null), 5000);
  }, []);

  const startRound = useCallback((roundNumber: number) => {
    const initialState = createInitialState(roundNumber);
    const shells = generateShells();
    const itemCount = roundNumber === 1 ? 2 : (roundNumber === 2 ? 3 : 4);

    const playerItems: Item[] = [];
    const dealerItems: Item[] = [];
    for (let i = 0; i < itemCount; i++) {
      playerItems.push(getRandomItem());
      dealerItems.push(getRandomItem());
    }

    setGame({
      ...initialState,
      shells,
      player: { ...initialState.player, items: playerItems },
      dealer: { ...initialState.dealer, items: dealerItems },
    });
    setPlayerLastShell({});

    const liveCount = shells.filter(s => s === 'live').length;
    const blankCount = shells.filter(s => s === 'blank').length;
    setRoundAnnouncement({
      round: roundNumber,
      live: liveCount,
      blank: blankCount,
      hp: initialState.player.maxHp,
    });
    setTimeout(() => setRoundAnnouncement(null), 5000);
  }, []);

  // ========================================
  // MESSAGE SYSTEM
  // ========================================

  const showMessage = useCallback((text: string, duration = 2000) => {
    setMessage(text);
    setTimeout(() => setMessage(''), duration);
  }, []);

  // ========================================
  // SHELL MANAGEMENT
  // ========================================

  const reloadIfNeeded = useCallback(() => {
    setGame(prev => {
      if (prev.currentShellIndex >= prev.shells.length) {
        const newShells = generateShells();
        const itemCount = prev.currentRound === 1 ? 2 : (prev.currentRound === 2 ? 3 : 4);

        const newPlayerItems = [...prev.player.items];
        const newDealerItems = [...prev.dealer.items];

        for (let i = 0; i < itemCount; i++) {
          if (newPlayerItems.length < 8) newPlayerItems.push(getRandomItem());
          if (newDealerItems.length < 8) newDealerItems.push(getRandomItem());
        }

        const liveCount = newShells.filter(s => s === 'live').length;
        const blankCount = newShells.filter(s => s === 'blank').length;
        setRoundAnnouncement({
          round: prev.currentRound,
          live: liveCount,
          blank: blankCount,
          hp: prev.player.maxHp,
        });
        setTimeout(() => setRoundAnnouncement(null), 4000);
        setPlayerLastShell({});

        return {
          ...prev,
          shells: newShells,
          currentShellIndex: 0,
          revealedShell: null,
          revealedPositions: [],
          player: { ...prev.player, items: newPlayerItems },
          dealer: { ...prev.dealer, items: newDealerItems, knownShell: null },
        };
      }
      return prev;
    });
  }, []);

  // ========================================
  // DAMAGE & HEALING
  // ========================================

  const applyDamage = useCallback((target: 'player' | 'dealer', amount: number) => {
    if (target === 'player') {
      setPlayerDamageFlash(true);
      setTimeout(() => setPlayerDamageFlash(false), 600);
    } else {
      setDealerDamageFlash(true);
      setTimeout(() => setDealerDamageFlash(false), 600);
    }

    setGame(prev => ({
      ...prev,
      [target]: {
        ...prev[target],
        hp: Math.max(0, prev[target].hp - amount),
      },
    }));
  }, []);

  const applyHealing = useCallback((target: 'player' | 'dealer', amount: number) => {
    if (target === 'player') {
      setPlayerHealFlash(true);
      setTimeout(() => setPlayerHealFlash(false), 300);
    } else {
      setDealerHealFlash(true);
      setTimeout(() => setDealerHealFlash(false), 300);
    }

    setGame(prev => ({
      ...prev,
      [target]: {
        ...prev[target],
        hp: Math.min(prev[target].maxHp, prev[target].hp + amount),
      },
    }));
  }, []);

  // ========================================
  // ROUND & GAME END
  // ========================================

  const checkRoundEnd = useCallback((): boolean => {
    if (game.player.hp <= 0) {
      setGameOverData({ show: true, victory: false });
      return true;
    } else if (game.dealer.hp <= 0) {
      if (game.currentRound >= 3) {
        setGameOverData({ show: true, victory: true });
      } else {
        // Next round after delay
        setTimeout(() => startRound(game.currentRound + 1), 2000);
      }
      return true;
    }
    return false;
  }, [game.player.hp, game.dealer.hp, game.currentRound, startRound]);

  const handleRestart = useCallback(() => {
    setGameOverData(null);
    setGameStarted(false);
  }, []);

  // ========================================
  // SHOOTING
  // ========================================

  const performShot = useCallback((shooter: 'player' | 'dealer', target: 'player' | 'dealer') => {
    setGame(prev => ({ ...prev, actionInProgress: true }));

    setShotAnimation(currentShell);
    setTimeout(() => setShotAnimation(null), 600);

    const shell = currentShell;
    const sawedOff = game[shooter].sawedOff;
    const damage = sawedOff ? 2 : 1;

    // Track shell
    setPlayerLastShell(prev => ({
      ...prev,
      [shooter]: shell
    }));

    // Reset saw
    setGame(prev => ({
      ...prev,
      [shooter]: { ...prev[shooter], sawedOff: false },
    }));

    // Eject shell
    setGame(prev => ({
      ...prev,
      currentShellIndex: prev.currentShellIndex + 1,
      revealedShell: null,
      dealer: { ...prev.dealer, knownShell: null },
    }));

    setTimeout(() => {
      const shooterName = shooter === 'player' ? 'Você' : 'Dealer';
      const targetName = target === 'player' ? 'você' : 'Dealer';

      setLastShotResult({
        type: shell,
        shooter: shooterName,
        target: targetName,
        damage: shell === 'live' ? damage : 0,
      });
      setTimeout(() => setLastShotResult(null), 3000);

      if (shell === 'live') {
        applyDamage(target, damage);

        setTimeout(() => {
          setGame(prev => ({ ...prev, actionInProgress: false }));
          setGame(prev => {
            if (prev.player.hp <= 0) {
              setTimeout(() => setGameOverData({ show: true, victory: false }), 100);
              return prev;
            } else if (prev.dealer.hp <= 0) {
              if (prev.currentRound >= 3) {
                setTimeout(() => setGameOverData({ show: true, victory: true }), 100);
              } else {
                setTimeout(() => startRound(prev.currentRound + 1), 2000);
              }
              return prev;
            }
            const opponent = shooter === 'player' ? 'dealer' : 'player';
            if (prev[opponent].handcuffed) {
              return { ...prev, [opponent]: { ...prev[opponent], handcuffed: false } };
            }
            return { ...prev, currentTurn: opponent };
          });
          reloadIfNeeded();
        }, 3100);
      } else {
        setTimeout(() => {
          setGame(prev => ({ ...prev, actionInProgress: false }));
          if (target === shooter) {
            reloadIfNeeded();
          } else {
            setGame(prev => {
              const opponent = shooter === 'player' ? 'dealer' : 'player';
              if (prev[opponent].handcuffed) {
                return { ...prev, [opponent]: { ...prev[opponent], handcuffed: false } };
              }
              return { ...prev, currentTurn: opponent };
            });
            reloadIfNeeded();
          }
        }, 3100);
      }
    }, 400);
  }, [currentShell, game, applyDamage, reloadIfNeeded, startRound]);

  const shootDealer = useCallback(() => {
    if (game.currentTurn !== 'player' || game.actionInProgress || hasActiveOverlay) return;
    performShot('player', 'dealer');
  }, [game.currentTurn, game.actionInProgress, hasActiveOverlay, performShot]);

  const shootSelf = useCallback(() => {
    if (game.currentTurn !== 'player' || game.actionInProgress || hasActiveOverlay) return;
    performShot('player', 'player');
    setSelectedTarget(null);
  }, [game.currentTurn, game.actionInProgress, hasActiveOverlay, performShot]);

  const handleSelectTarget = useCallback((playerId: string) => {
    if (game.currentTurn !== 'player' || game.actionInProgress || hasActiveOverlay) return;
    setSelectedTarget(prev => prev === playerId ? null : playerId);
  }, [game.currentTurn, game.actionInProgress, hasActiveOverlay]);

  const handleShoot = useCallback((targetId: string) => {
    if (targetId === 'dealer') {
      shootDealer();
    }
    setSelectedTarget(null);
  }, [shootDealer]);

  // ========================================
  // ITEM USAGE
  // ========================================

  const useItem = useCallback((itemIndex: number, user: 'player' | 'dealer') => {
    const item = game[user].items[itemIndex];
    if (!item) return;

    setGame(prev => ({
      ...prev,
      actionInProgress: true,
      [user]: {
        ...prev[user],
        items: prev[user].items.filter((_, i) => i !== itemIndex),
      },
    }));

    switch (item.id) {
      case 'magnifying_glass': {
        const shell = currentShell;
        setGame(prev => ({
          ...prev,
          revealedShell: shell,
          dealer: user === 'dealer' ? { ...prev.dealer, knownShell: shell } : prev.dealer,
        }));
        const msg = user === 'player'
          ? `🔍 Cartucho atual: ${shell === 'live' ? 'LIVE' : 'BLANK'}`
          : '🔍 Dealer usou a Lupa';
        showMessage(msg, 2500);
        setTimeout(() => setGame(prev => ({ ...prev, actionInProgress: false })), 2600);
        break;
      }

      case 'beer': {
        const ejected = currentShell;
        setPlayerLastShell(prev => ({
          ...prev,
          [user]: ejected
        }));
        setGame(prev => ({
          ...prev,
          currentShellIndex: prev.currentShellIndex + 1,
          revealedShell: null,
          dealer: { ...prev.dealer, knownShell: null },
        }));
        showMessage(`🍺 Ejetado: ${ejected === 'live' ? 'LIVE' : 'BLANK'}`);
        setTimeout(() => {
          setGame(prev => ({ ...prev, actionInProgress: false }));
          reloadIfNeeded();
        }, 2100);
        break;
      }

      case 'cigarettes': {
        applyHealing(user, 1);
        showMessage(user === 'player' ? '🚬 +1 HP' : '🚬 Dealer fumou', 1000);
        setTimeout(() => setGame(prev => ({ ...prev, actionInProgress: false })), 1100);
        break;
      }

      case 'handcuffs': {
        const opponent = user === 'player' ? 'dealer' : 'player';
        setGame(prev => ({
          ...prev,
          [opponent]: { ...prev[opponent], handcuffed: true },
        }));
        showMessage(user === 'player' ? '⛓️ Dealer algemado!' : '⛓️ Você foi algemado!', 1200);
        setTimeout(() => setGame(prev => ({ ...prev, actionInProgress: false })), 1300);
        break;
      }

      case 'hand_saw': {
        setGame(prev => ({
          ...prev,
          [user]: { ...prev[user], sawedOff: true },
        }));
        showMessage(user === 'player' ? '🪚 Próximo tiro: 2x dano!' : '🪚 Dealer serrou o cano!', 1200);
        setTimeout(() => setGame(prev => ({ ...prev, actionInProgress: false })), 1300);
        break;
      }

      case 'phone': {
        const remaining = game.shells.length - game.currentShellIndex;
        if (remaining <= 1) {
          showMessage('📱 Sem informação útil', 2000);
          setTimeout(() => setGame(prev => ({ ...prev, actionInProgress: false })), 2100);
        } else {
          const randomOffset = Math.floor(Math.random() * (remaining - 1)) + 1;
          const position = game.currentShellIndex + randomOffset;
          const shell = game.shells[position];

          if (user === 'player') {
            setPhoneModal({ position, shell });
            setTimeout(() => {
              setPhoneModal(null);
              setGame(prev => ({ ...prev, actionInProgress: false }));
            }, 5000);
          } else {
            showMessage('📱 Dealer usou o Celular', 2000);
            setTimeout(() => setGame(prev => ({ ...prev, actionInProgress: false })), 2100);
          }
        }
        break;
      }

      case 'inverter': {
        setGame(prev => {
          const shells = [...prev.shells];
          shells[prev.currentShellIndex] = shells[prev.currentShellIndex] === 'live' ? 'blank' : 'live';
          return {
            ...prev,
            shells,
            revealedShell: null,
            dealer: { ...prev.dealer, knownShell: null },
          };
        });
        showMessage('🔄 Cartucho invertido!', 1200);
        setTimeout(() => setGame(prev => ({ ...prev, actionInProgress: false })), 1300);
        break;
      }

      case 'adrenaline': {
        const opponent = user === 'player' ? 'dealer' : 'player';
        if (game[opponent].items.length === 0) {
          showMessage('💉 Sem itens para roubar', 1000);
          setTimeout(() => setGame(prev => ({ ...prev, actionInProgress: false })), 1100);
        } else if (user === 'player') {
          setStealModalOpen(true);
        } else {
          const randomIdx = Math.floor(Math.random() * game.player.items.length);
          const stolenItem = game.player.items[randomIdx];
          setGame(prev => ({
            ...prev,
            player: {
              ...prev.player,
              items: prev.player.items.filter((_, i) => i !== randomIdx),
            },
            dealer: {
              ...prev.dealer,
              items: [...prev.dealer.items, stolenItem],
            },
          }));
          showMessage(`💉 Dealer roubou ${stolenItem.emoji}`, 1200);
          setTimeout(() => {
            setGame(prev => ({ ...prev, actionInProgress: false }));
          }, 1300);
        }
        break;
      }

      case 'expired_medicine': {
        const success = Math.random() < 0.5;
        if (success) {
          const oldHp = game[user].hp;
          const healed = Math.min(2, game[user].maxHp - oldHp);
          applyHealing(user, 2);
          showMessage(user === 'player' ? `💊 Funcionou! +${healed} HP` : '💊 Dealer curou!', 1200);
        } else {
          applyDamage(user, 1);
          showMessage(user === 'player' ? '💊 Vencido! -1 HP' : '💊 Dealer perdeu HP!', 1200);
        }
        setTimeout(() => {
          setGame(prev => ({ ...prev, actionInProgress: false }));
          checkRoundEnd();
        }, 1300);
        break;
      }

      case 'turn_reverser': {
        showMessage(user === 'player' ? '↩️ Inversor de Ordem (apenas multiplayer)' : '↩️ Dealer tentou usar Inversor de Ordem', 2000);
        setTimeout(() => setGame(prev => ({ ...prev, actionInProgress: false })), 2100);
        break;
      }
    }
  }, [game, currentShell, applyDamage, applyHealing, showMessage, reloadIfNeeded, checkRoundEnd]);

  const handlePlayerUseItem = useCallback((itemIndex: number) => {
    if (game.currentTurn !== 'player' || game.actionInProgress || hasActiveOverlay) return;
    useItem(itemIndex, 'player');
  }, [game.currentTurn, game.actionInProgress, hasActiveOverlay, useItem]);

  const handleStealItem = useCallback((itemIndex: number) => {
    const stolenItem = game.dealer.items[itemIndex];
    setStealModalOpen(false);

    setGame(prev => ({
      ...prev,
      dealer: {
        ...prev.dealer,
        items: prev.dealer.items.filter((_, i) => i !== itemIndex),
      },
      player: {
        ...prev.player,
        items: [...prev.player.items, stolenItem],
      },
    }));

    showMessage(`💉 Você roubou ${stolenItem.emoji} ${stolenItem.name}`, 1200);

    setTimeout(() => {
      setGame(prev => ({ ...prev, actionInProgress: false }));
      setTimeout(() => {
        const newIdx = game.player.items.length;
        useItem(newIdx, 'player');
      }, 500);
    }, 1300);
  }, [game.dealer.items, game.player.items.length, showMessage, useItem]);

  const cancelSteal = useCallback(() => {
    setStealModalOpen(false);
    setGame(prev => ({
      ...prev,
      actionInProgress: false,
      player: {
        ...prev.player,
        items: [...prev.player.items, { ...ITEMS.adrenaline }],
      },
    }));
  }, []);

  // ========================================
  // DEALER AI
  // ========================================

  const shouldDealerShootSelf = useCallback((): boolean => {
    const remaining = game.shells.length - game.currentShellIndex;
    if (remaining === 0) return false;

    let liveRemaining = 0;
    for (let i = game.currentShellIndex; i < game.shells.length; i++) {
      if (game.shells[i] === 'live') liveRemaining++;
    }
    const blankRemaining = remaining - liveRemaining;

    if (game.dealer.knownShell === 'blank') return true;
    if (game.dealer.knownShell === 'live') return false;

    return blankRemaining > liveRemaining;
  }, [game.shells, game.currentShellIndex, game.dealer.knownShell]);

  const dealerUseItems = useCallback((): boolean => {
    const items = game.dealer.items;
    if (items.length === 0) return false;

    if (game.dealer.knownShell === null) {
      const magIdx = items.findIndex(i => i.id === 'magnifying_glass');
      if (magIdx !== -1) {
        useItem(magIdx, 'dealer');
        return true;
      }
    }

    if (game.dealer.knownShell === 'live') {
      const beerIdx = items.findIndex(i => i.id === 'beer');
      if (beerIdx !== -1 && shouldDealerShootSelf()) {
        useItem(beerIdx, 'dealer');
        return true;
      }

      const sawIdx = items.findIndex(i => i.id === 'hand_saw');
      if (sawIdx !== -1 && !game.dealer.sawedOff) {
        useItem(sawIdx, 'dealer');
        return true;
      }

      const cuffIdx = items.findIndex(i => i.id === 'handcuffs');
      if (cuffIdx !== -1 && !game.player.handcuffed) {
        useItem(cuffIdx, 'dealer');
        return true;
      }
    }

    if (game.dealer.knownShell === 'blank') {
      const invIdx = items.findIndex(i => i.id === 'inverter');
      if (invIdx !== -1 && !shouldDealerShootSelf()) {
        useItem(invIdx, 'dealer');
        return true;
      }
    }

    if (game.dealer.hp < game.dealer.maxHp) {
      const cigIdx = items.findIndex(i => i.id === 'cigarettes');
      if (cigIdx !== -1) {
        useItem(cigIdx, 'dealer');
        return true;
      }
    }

    if (game.dealer.hp === 1) {
      const medIdx = items.findIndex(i => i.id === 'expired_medicine');
      if (medIdx !== -1 && Math.random() < 0.5) {
        useItem(medIdx, 'dealer');
        return true;
      }
    }

    return false;
  }, [game.dealer, game.player.handcuffed, shouldDealerShootSelf, useItem]);

  const dealerShoot = useCallback(() => {
    const shootSelf = shouldDealerShootSelf();

    if (shootSelf) {
      showMessage('Dealer atira em si...', 1000);
      setTimeout(() => performShot('dealer', 'dealer'), 1100);
    } else {
      showMessage('Dealer atira em você...', 1000);
      setTimeout(() => performShot('dealer', 'player'), 1100);
    }

    setGame(prev => ({
      ...prev,
      dealer: { ...prev.dealer, knownShell: null },
    }));
  }, [shouldDealerShootSelf, showMessage, performShot]);

  const dealerTurn = useCallback(() => {
    if (game.isGameOver || game.currentTurn !== 'dealer') return;

    setTimeout(() => {
      if (dealerUseItems()) {
        return;
      }
      dealerShoot();
    }, 1000);
  }, [game.isGameOver, game.currentTurn, dealerUseItems, dealerShoot]);

  useEffect(() => {
    if (gameStarted && game.currentTurn === 'dealer' && !game.actionInProgress && !hasActiveOverlay) {
      dealerTimeoutRef.current = window.setTimeout(() => {
        dealerTurn();
      }, 1500);
    }

    return () => {
      if (dealerTimeoutRef.current) {
        clearTimeout(dealerTimeoutRef.current);
      }
    };
  }, [gameStarted, game.currentTurn, game.actionInProgress, hasActiveOverlay, dealerTurn]);

  // ========================================
  // PREPARE GAMEBOARD PROPS
  // ========================================

  const dealerAsOpponent: GamePlayer = {
    id: 'dealer',
    name: '🤖 DEALER',
    hp: game.dealer.hp,
    maxHp: game.dealer.maxHp,
    items: game.dealer.items as GameItem[],
    handcuffed: game.dealer.handcuffed,
    sawedOff: game.dealer.sawedOff,
    alive: game.dealer.hp > 0,
  };

  const meAsPlayer: GamePlayer = {
    id: 'player',
    name: 'Você',
    hp: game.player.hp,
    maxHp: game.player.maxHp,
    items: game.player.items as GameItem[],
    handcuffed: game.player.handcuffed,
    sawedOff: game.player.sawedOff,
    alive: game.player.hp > 0,
  };

  const stealModalData: StealModalData | null = stealModalOpen ? {
    playerId: 'dealer',
    playerName: 'Dealer',
    items: game.dealer.items as GameItem[],
  } : null;

  // ========================================
  // RENDER
  // ========================================

  if (!gameStarted) {
    return (
      <div className="singleplayer-page">
        <div className="start-screen">
          <h1 className="start-title">BANGSHOT</h1>
          <p className="start-subtitle">Single Player vs Dealer</p>
          <button className="start-btn" onClick={startGame}>INICIAR JOGO</button>
          <button className="back-to-menu-btn" onClick={() => navigate('/')}>← Voltar ao Menu</button>
        </div>
      </div>
    );
  }

  return (
    <div className="singleplayer-page">
      <GameBoard
        round={game.currentRound}
        maxRounds={3}
        shells={{
          total: liveRemaining + blankRemaining,
          live: liveRemaining,
          blank: blankRemaining,
        }}
        currentPlayerId={game.currentTurn === 'player' ? 'player' : 'dealer'}
        myId="player"
        opponents={[dealerAsOpponent]}
        me={meAsPlayer}
        myItems={game.player.items as GameItem[]}
        isMyTurn={game.currentTurn === 'player'}
        selectedTarget={selectedTarget}
        revealedShell={game.revealedShell}
        message={message}
        roundAnnouncement={roundAnnouncement}
        lastShotResult={lastShotResult}
        stealModalData={stealModalData}
        itemActionModal={null}
        gameOverData={gameOverData ? (
          <div className="game-over-overlay">
            <div className="game-over-modal">
              <h1 className="game-over-title">
                {gameOverData.victory ? '🏆 VITÓRIA 🏆' : '💀 DERROTA 💀'}
              </h1>

              <div className="winner-section">
                <span className="crown">{gameOverData.victory ? '👑' : '☠️'}</span>
                <h2 className="winner-name">
                  {gameOverData.victory ? 'Você venceu!' : 'O Dealer venceu!'}
                </h2>
                <p className="winner-rounds">
                  {gameOverData.victory
                    ? 'Parabéns! Você derrotou o Dealer.'
                    : 'Tente novamente!'}
                </p>
              </div>

              <button className="back-to-lobby-btn" onClick={handleRestart}>
                JOGAR NOVAMENTE
              </button>
              <button
                className="back-to-menu-btn"
                style={{ marginTop: '1rem' }}
                onClick={() => navigate('/')}
              >
                Voltar ao Menu
              </button>
            </div>
          </div>
        ) : null}
        shotAnimation={shotAnimation}
        damagedPlayerId={playerDamageFlash ? 'player' : dealerDamageFlash ? 'dealer' : null}
        healedPlayerId={playerHealFlash ? 'player' : dealerHealFlash ? 'dealer' : null}
        playerLastShell={playerLastShell}
        onSelectTarget={handleSelectTarget}
        onShoot={handleShoot}
        onShootSelf={shootSelf}
        onUseItem={handlePlayerUseItem}
        onStealItem={handleStealItem}
        onCancelSteal={cancelSteal}
        onBack={() => navigate('/')}
      >
        {/* Phone Modal */}
        {phoneModal && (
          <div className="steal-modal-overlay" onClick={() => setPhoneModal(null)}>
            <div className="steal-modal" onClick={e => e.stopPropagation()}>
              <h3>📱 CELULAR</h3>
              <div className="phone-content">
                <p>Posição {phoneModal.position - game.currentShellIndex + 1}:</p>
                <div className={`phone-shell-result ${phoneModal.shell}`}>
                  {phoneModal.shell === 'live' ? '🔴 LIVE' : '🔵 BLANK'}
                </div>
              </div>
              <button className="steal-cancel-btn" onClick={() => setPhoneModal(null)}>
                Fechar
              </button>
            </div>
          </div>
        )}
      </GameBoard>
    </div>
  );
}
