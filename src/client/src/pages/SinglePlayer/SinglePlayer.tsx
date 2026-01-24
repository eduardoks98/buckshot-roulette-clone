import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  generateShells as generateShellsUtil,
  getRandomHP,
  ITEMS as SHARED_ITEMS,
  getRandomItem as getRandomItemUtil,
} from '../../../../shared';
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

interface Message {
  text: string;
  isHtml?: boolean;
}

// ========================================
// ITEMS (usando shared/constants/items)
// ========================================

// Referência às definições compartilhadas
const ITEMS = SHARED_ITEMS;

// ========================================
// HELPERS (usando shared/utils/gameUtils)
// ========================================

// generateShellsUtil é importado de shared/utils/gameUtils

// Wrapper para getRandomItem que exclui turn_reverser no solo
function getRandomItem(): Item {
  // No modo solo, excluir turn_reverser (só funciona em multiplayer)
  const item = getRandomItemUtil(['turn_reverser']);
  return item;
}

function createInitialState(round: number): GameState {
  // Usar getRandomHP de shared/utils/gameUtils
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

// Usar generateShells de shared/utils/gameUtils
const generateShells = generateShellsUtil;

// ========================================
// COMPONENT
// ========================================

export default function SinglePlayer() {
  const navigate = useNavigate();
  const [gameStarted, setGameStarted] = useState(false);
  const [game, setGame] = useState<GameState>(() => createInitialState(1));
  const [message, setMessage] = useState<Message | null>(null);
  const [stealModalOpen, setStealModalOpen] = useState(false);
  const [roundEndScreen, setRoundEndScreen] = useState<{ show: boolean; victory: boolean } | null>(null);
  const [gameOverScreen, setGameOverScreen] = useState<{ show: boolean; victory: boolean } | null>(null);
  const [phoneModal, setPhoneModal] = useState<{ position: number; shell: 'live' | 'blank' } | null>(null);
  const [shotgunShaking, setShotgunShaking] = useState(false);
  const [dealerDamageFlash, setDealerDamageFlash] = useState(false);
  const [playerDamageFlash, setPlayerDamageFlash] = useState(false);
  const [dealerHealFlash, setDealerHealFlash] = useState(false);
  const [playerHealFlash, setPlayerHealFlash] = useState(false);

  const dealerTimeoutRef = useRef<number | null>(null);

  // ========================================
  // COMPUTED VALUES
  // ========================================

  const liveRemaining = game.shells.slice(game.currentShellIndex).filter(s => s === 'live').length;
  const blankRemaining = game.shells.slice(game.currentShellIndex).filter(s => s === 'blank').length;
  const currentShell = game.shells[game.currentShellIndex];
  const canAct = gameStarted && game.currentTurn === 'player' && !game.actionInProgress && !message && !roundEndScreen && !gameOverScreen;

  // ========================================
  // GAME LIFECYCLE
  // ========================================

  const startGame = useCallback(() => {
    const initialState = createInitialState(1);
    const shells = generateShells();
    const itemCount = 2;

    // Distribute items
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

    // Show loading message
    const liveCount = shells.filter(s => s === 'live').length;
    const blankCount = shells.filter(s => s === 'blank').length;
    showMessage(`Carregando: ${liveCount} LIVE, ${blankCount} BLANK`);
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

    const liveCount = shells.filter(s => s === 'live').length;
    const blankCount = shells.filter(s => s === 'blank').length;
    showMessage(`Rodada ${roundNumber} - Carregando: ${liveCount} LIVE, ${blankCount} BLANK`);
  }, []);

  // ========================================
  // MESSAGE SYSTEM
  // ========================================

  const showMessage = useCallback((text: string, duration = 2000, isHtml = false) => {
    setMessage({ text, isHtml });
    setTimeout(() => setMessage(null), duration);
  }, []);

  const closeMessage = useCallback(() => {
    setMessage(null);
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
      setGameOverScreen({ show: true, victory: false });
      return true;
    } else if (game.dealer.hp <= 0) {
      if (game.currentRound >= 3) {
        setGameOverScreen({ show: true, victory: true });
      } else {
        setRoundEndScreen({ show: true, victory: true });
      }
      return true;
    }
    return false;
  }, [game.player.hp, game.dealer.hp, game.currentRound]);

  const handleNextRound = useCallback(() => {
    setRoundEndScreen(null);
    startRound(game.currentRound + 1);
  }, [game.currentRound, startRound]);

  const handleRestart = useCallback(() => {
    setGameOverScreen(null);
    setGameStarted(false);
  }, []);

  // ========================================
  // SHOOTING
  // ========================================

  const performShot = useCallback((shooter: 'player' | 'dealer', target: 'player' | 'dealer') => {
    setGame(prev => ({ ...prev, actionInProgress: true }));

    setShotgunShaking(true);
    setTimeout(() => setShotgunShaking(false), 400);

    const shell = currentShell;
    const sawedOff = game[shooter].sawedOff;
    const damage = sawedOff ? 2 : 1;

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
      if (shell === 'live') {
        applyDamage(target, damage);
        const msg = target === shooter
          ? `💥 LIVE! -${damage} HP`
          : `💥 LIVE! ${target === 'dealer' ? 'Dealer' : 'Você'}: -${damage} HP`;

        showMessage(msg, 1200);

        setTimeout(() => {
          setGame(prev => ({ ...prev, actionInProgress: false }));
          // Check game state after damage
          setGame(prev => {
            if (prev.player.hp <= 0) {
              setTimeout(() => setGameOverScreen({ show: true, victory: false }), 100);
              return prev;
            } else if (prev.dealer.hp <= 0) {
              if (prev.currentRound >= 3) {
                setTimeout(() => setGameOverScreen({ show: true, victory: true }), 100);
              } else {
                setTimeout(() => setRoundEndScreen({ show: true, victory: true }), 100);
              }
              return prev;
            }
            // End turn
            const opponent = shooter === 'player' ? 'dealer' : 'player';
            if (prev[opponent].handcuffed) {
              return { ...prev, [opponent]: { ...prev[opponent], handcuffed: false } };
            }
            return { ...prev, currentTurn: opponent };
          });
          reloadIfNeeded();
        }, 1300);
      } else {
        // Blank
        const msg = target === shooter
          ? '💨 BLANK! Jogue novamente'
          : '💨 BLANK!';

        showMessage(msg, 1000);

        setTimeout(() => {
          setGame(prev => ({ ...prev, actionInProgress: false }));
          if (target === shooter) {
            // Shot self with blank - play again
            reloadIfNeeded();
          } else {
            // Shot opponent with blank - end turn
            setGame(prev => {
              const opponent = shooter === 'player' ? 'dealer' : 'player';
              if (prev[opponent].handcuffed) {
                return { ...prev, [opponent]: { ...prev[opponent], handcuffed: false } };
              }
              return { ...prev, currentTurn: opponent };
            });
            reloadIfNeeded();
          }
        }, 1100);
      }
    }, 400);
  }, [currentShell, game, applyDamage, showMessage, reloadIfNeeded]);

  const shootDealer = useCallback(() => {
    if (!canAct) return;
    performShot('player', 'dealer');
  }, [canAct, performShot]);

  const shootSelf = useCallback(() => {
    if (!canAct) return;
    performShot('player', 'player');
  }, [canAct, performShot]);

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
          ? `🔍 Cartucho atual: <span class="${shell}">${shell === 'live' ? 'LIVE' : 'BLANK'}</span>`
          : '🔍 Dealer usou a Lupa';
        showMessage(msg, 2500, true);
        setTimeout(() => setGame(prev => ({ ...prev, actionInProgress: false })), 2600);
        break;
      }

      case 'beer': {
        const ejected = currentShell;
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
          // Dealer steals random item
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
            // Dealer uses the stolen item
            setTimeout(() => {
              setGame(prev => {
                const idx = prev.dealer.items.findIndex(i => i.id === stolenItem.id);
                if (idx !== -1) {
                  // Will be used in dealer AI
                }
                return prev;
              });
            }, 500);
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
    if (!canAct) return;
    useItem(itemIndex, 'player');
  }, [canAct, useItem]);

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
      // Use the stolen item
      setTimeout(() => {
        const newIdx = game.player.items.length; // It was just added
        useItem(newIdx, 'player');
      }, 500);
    }, 1300);
  }, [game.dealer.items, game.player.items.length, showMessage, useItem]);

  const cancelSteal = useCallback(() => {
    setStealModalOpen(false);
    // Give back the adrenaline item
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

    // 1. If doesn't know shell, use magnifying glass
    if (game.dealer.knownShell === null) {
      const magIdx = items.findIndex(i => i.id === 'magnifying_glass');
      if (magIdx !== -1) {
        useItem(magIdx, 'dealer');
        return true;
      }
    }

    // 2. If knows it's live and would shoot self, use beer
    if (game.dealer.knownShell === 'live') {
      const beerIdx = items.findIndex(i => i.id === 'beer');
      if (beerIdx !== -1 && shouldDealerShootSelf()) {
        useItem(beerIdx, 'dealer');
        return true;
      }

      // Use saw before shooting player
      const sawIdx = items.findIndex(i => i.id === 'hand_saw');
      if (sawIdx !== -1 && !game.dealer.sawedOff) {
        useItem(sawIdx, 'dealer');
        return true;
      }

      // Use handcuffs
      const cuffIdx = items.findIndex(i => i.id === 'handcuffs');
      if (cuffIdx !== -1 && !game.player.handcuffed) {
        useItem(cuffIdx, 'dealer');
        return true;
      }
    }

    // 3. If knows it's blank and would shoot player, use inverter
    if (game.dealer.knownShell === 'blank') {
      const invIdx = items.findIndex(i => i.id === 'inverter');
      if (invIdx !== -1 && !shouldDealerShootSelf()) {
        useItem(invIdx, 'dealer');
        return true;
      }
    }

    // 4. Use cigarettes if low HP
    if (game.dealer.hp < game.dealer.maxHp) {
      const cigIdx = items.findIndex(i => i.id === 'cigarettes');
      if (cigIdx !== -1) {
        useItem(cigIdx, 'dealer');
        return true;
      }
    }

    // 5. Use medicine if very low HP
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

    // Clear knowledge
    setGame(prev => ({
      ...prev,
      dealer: { ...prev.dealer, knownShell: null },
    }));
  }, [shouldDealerShootSelf, showMessage, performShot]);

  const dealerTurn = useCallback(() => {
    if (game.isGameOver || game.currentTurn !== 'dealer') return;

    setTimeout(() => {
      if (dealerUseItems()) {
        return; // Will continue after item use
      }
      dealerShoot();
    }, 1000);
  }, [game.isGameOver, game.currentTurn, dealerUseItems, dealerShoot]);

  // Trigger dealer turn when it becomes their turn
  useEffect(() => {
    if (gameStarted && game.currentTurn === 'dealer' && !game.actionInProgress && !message) {
      dealerTimeoutRef.current = window.setTimeout(() => {
        dealerTurn();
      }, 1500);
    }

    return () => {
      if (dealerTimeoutRef.current) {
        clearTimeout(dealerTimeoutRef.current);
      }
    };
  }, [gameStarted, game.currentTurn, game.actionInProgress, message, dealerTurn]);

  // ========================================
  // RENDER
  // ========================================

  if (!gameStarted) {
    return (
      <div className="singleplayer-container">
        <div className="game-area" style={{ justifyContent: 'center', alignItems: 'center' }}>
          <h1 style={{ color: 'var(--red-live)', textShadow: '0 0 20px rgba(230, 57, 70, 0.5)', marginBottom: '2rem' }}>
            BUCKSHOT ROULETTE
          </h1>
          <p style={{ color: 'var(--text-dim)', marginBottom: '2rem' }}>Single Player vs Dealer</p>
          <button className="action-btn" onClick={startGame}>INICIAR JOGO</button>
          <button className="back-btn" style={{ marginTop: '1rem' }} onClick={() => navigate('/')}>← Voltar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="singleplayer-container">
      <header className="game-header">
        <button className="back-btn" onClick={() => navigate('/')}>← Voltar</button>
        <div className="round-display">RODADA {game.currentRound}/3</div>
        <div className="shell-count">
          <span className="live">LIVE: {liveRemaining}</span>
          <span className="blank">BLANK: {blankRemaining}</span>
        </div>
      </header>

      <main className="game-area">
        {/* Dealer Area */}
        <section className={`dealer-area ${dealerDamageFlash ? 'damage-flash' : ''} ${dealerHealFlash ? 'heal-flash' : ''}`}>
          <div className="character-label dealer">O DEALER</div>
          <div className="hp-display">
            {Array.from({ length: game.dealer.maxHp }).map((_, i) => (
              <span key={i} className={`hp-icon ${i < game.dealer.hp ? 'full' : 'empty'}`}>⚡</span>
            ))}
          </div>
          <div className="status-indicator">
            {game.dealer.handcuffed && '⛓️ Algemado '}
            {game.dealer.sawedOff && '🪚 2x Dano '}
          </div>
          <div className="items-display">
            {game.dealer.items.map((item, i) => (
              <div key={i} className="item disabled">
                {item.emoji}
                <div className="item-tooltip">
                  <strong>{item.name}</strong>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Center Area - Shotgun */}
        <section className="center-area">
          <div className={`shotgun ${shotgunShaking ? 'shake' : ''} ${game.player.sawedOff || game.dealer.sawedOff ? 'sawed-off' : ''}`}>
            <div className={`shell-chamber ${game.revealedShell || ''}`}>
              {game.revealedShell ? (game.revealedShell === 'live' ? 'L' : 'B') : '?'}
            </div>
          </div>
          <div className={`turn-indicator ${game.currentTurn === 'dealer' ? 'dealer-turn' : ''}`}>
            {game.currentTurn === 'player' ? 'SEU TURNO' : 'TURNO DO DEALER'}
          </div>
          <div className="action-buttons">
            <button className="action-btn" onClick={shootDealer} disabled={!canAct}>
              ATIRAR NO DEALER
            </button>
            <button className="action-btn secondary" onClick={shootSelf} disabled={!canAct}>
              ATIRAR EM SI
            </button>
          </div>
        </section>

        {/* Player Area */}
        <section className={`player-area ${playerDamageFlash ? 'damage-flash' : ''} ${playerHealFlash ? 'heal-flash' : ''}`}>
          <div className="items-display">
            {game.player.items.map((item, i) => (
              <div
                key={i}
                className={`item ${!canAct ? 'disabled' : ''}`}
                onClick={() => handlePlayerUseItem(i)}
              >
                {item.emoji}
                <div className="item-tooltip">
                  <strong>{item.name}</strong>
                  <span className="tooltip-desc">{item.description}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="hp-display">
            {Array.from({ length: game.player.maxHp }).map((_, i) => (
              <span key={i} className={`hp-icon ${i < game.player.hp ? 'full' : 'empty'}`}>⚡</span>
            ))}
          </div>
          <div className="status-indicator">
            {game.player.handcuffed && '⛓️ Algemado '}
            {game.player.sawedOff && '🪚 2x Dano '}
          </div>
          <div className="character-label player">VOCÊ</div>
        </section>
      </main>

      {/* Message Overlay */}
      {message && (
        <div className="message-overlay" onClick={closeMessage}>
          <div
            className="message-content"
            dangerouslySetInnerHTML={{ __html: message.text + '<br><span class="msg-hint">(clique para fechar)</span>' }}
          />
        </div>
      )}

      {/* Phone Modal */}
      {phoneModal && (
        <div className="message-overlay" onClick={() => setPhoneModal(null)}>
          <div className="phone-modal">
            <div className="phone-header">📱 CELULAR - POSIÇÕES</div>
            <div className="phone-shells">
              {game.shells.map((_, i) => {
                const isUsed = i < game.currentShellIndex;
                const isCurrent = i === game.currentShellIndex;
                const isRevealed = i === phoneModal.position || (isCurrent && game.revealedShell);

                let shellClass = 'phone-shell';
                if (isUsed) shellClass += ' used';
                if (isCurrent) shellClass += ' current';
                if (isRevealed && !isUsed) shellClass += ` ${i === phoneModal.position ? phoneModal.shell : game.revealedShell}`;

                return (
                  <div key={i} className={shellClass}>
                    <span className="shell-num">{i + 1}</span>
                    <span className="shell-type">
                      {isUsed ? '✕' : (isRevealed ? (i === phoneModal.position ? (phoneModal.shell === 'live' ? 'L' : 'B') : (game.revealedShell === 'live' ? 'L' : 'B')) : '?')}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="phone-info">
              Posição {phoneModal.position - game.currentShellIndex + 1}: <span className={phoneModal.shell}>{phoneModal.shell === 'live' ? 'LIVE' : 'BLANK'}</span>
            </div>
            <div className="phone-legend">
              <span className="current">◆ Atual</span>
              <span className="live">● LIVE</span>
              <span className="blank">● BLANK</span>
            </div>
          </div>
        </div>
      )}

      {/* Steal Modal */}
      {stealModalOpen && (
        <div className="item-select-modal">
          <div className="modal-content">
            <h3>💉 ADRENALINA</h3>
            <p>Escolha um item para roubar:</p>
            <div className="steal-items">
              {game.dealer.items.map((item, i) => (
                <div
                  key={i}
                  className="item"
                  onClick={() => handleStealItem(i)}
                >
                  {item.emoji}
                  <div className="item-tooltip">
                    <strong>{item.name}</strong>
                  </div>
                </div>
              ))}
            </div>
            <button className="cancel-btn" onClick={cancelSteal}>Cancelar</button>
          </div>
        </div>
      )}

      {/* Round End Screen */}
      {roundEndScreen && (
        <div className="round-end-screen">
          <h2 className={`end-title ${roundEndScreen.victory ? 'victory' : 'defeat'}`}>
            {roundEndScreen.victory ? 'RODADA VENCIDA' : 'RODADA PERDIDA'}
          </h2>
          <p className="end-message">Rodada {game.currentRound} completa!</p>
          <button className="action-btn" onClick={handleNextRound}>PRÓXIMA RODADA</button>
        </div>
      )}

      {/* Game Over Screen */}
      {gameOverScreen && (
        <div className="game-over-screen">
          <h2 className={`end-title ${gameOverScreen.victory ? 'victory' : 'defeat'}`}>
            {gameOverScreen.victory ? 'VOCÊ VENCEU' : 'VOCÊ PERDEU'}
          </h2>
          <p className="end-message">
            {gameOverScreen.victory ? 'O Dealer foi derrotado.' : 'O Dealer venceu.'}
          </p>
          <button className="action-btn" onClick={handleRestart}>JOGAR NOVAMENTE</button>
          <button className="back-btn" style={{ marginTop: '1rem' }} onClick={() => navigate('/')}>Voltar ao Menu</button>
        </div>
      )}
    </div>
  );
}
