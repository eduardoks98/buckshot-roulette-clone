// ========================================
// BUCKSHOT ROULETTE - GAME LOGIC
// ========================================

// Tipos de itens com descrições
const ITEMS = {
    MAGNIFYING_GLASS: {
        id: 'magnifying_glass',
        emoji: '🔍',
        name: 'Lupa',
        description: 'Revela se o cartucho atual é LIVE ou BLANK'
    },
    BEER: {
        id: 'beer',
        emoji: '🍺',
        name: 'Cerveja',
        description: 'Ejeta o cartucho atual sem disparar'
    },
    CIGARETTES: {
        id: 'cigarettes',
        emoji: '🚬',
        name: 'Cigarro',
        description: 'Restaura 1 HP (não excede máximo)'
    },
    HANDCUFFS: {
        id: 'handcuffs',
        emoji: '⛓️',
        name: 'Algemas',
        description: 'Pula o próximo turno do oponente'
    },
    HAND_SAW: {
        id: 'hand_saw',
        emoji: '🪚',
        name: 'Serra',
        description: 'Próximo tiro causa 2x de dano'
    },
    PHONE: {
        id: 'phone',
        emoji: '📱',
        name: 'Celular',
        description: 'Revela a posição de um cartucho na arma'
    },
    INVERTER: {
        id: 'inverter',
        emoji: '🔄',
        name: 'Inversor',
        description: 'Inverte o cartucho atual (LIVE↔BLANK)'
    },
    ADRENALINE: {
        id: 'adrenaline',
        emoji: '💉',
        name: 'Adrenalina',
        description: 'Rouba e usa um item do oponente'
    },
    EXPIRED_MEDICINE: {
        id: 'expired_medicine',
        emoji: '💊',
        name: 'Remédio Vencido',
        description: '50% chance: +2 HP ou -1 HP'
    },
    TURN_REVERSER: {
        id: 'turn_reverser',
        emoji: '↩️',
        name: 'Inversor de Ordem',
        description: 'Inverte a direção dos turnos (só multiplayer)'
    }
};

// Estado do jogo
let GameState = {
    currentRound: 1,
    maxRounds: 3,

    player: {
        hp: 0,
        maxHp: 0,
        items: [],
        handcuffed: false,
        sawedOff: false
    },

    dealer: {
        hp: 0,
        maxHp: 0,
        items: [],
        handcuffed: false,
        sawedOff: false,
        knownShell: null // Para IA
    },

    shells: [],
    currentShellIndex: 0,
    totalLive: 0,
    totalBlank: 0,

    currentTurn: 'player',
    isGameOver: false,
    winner: null,
    actionInProgress: false,
    revealedShell: null,
    revealedPositions: [] // Posições reveladas pelo celular/lupa
};

// ========================================
// ELEMENTOS DOM
// ========================================

const elements = {
    startScreen: null,
    gameScreen: null,
    roundNum: null,
    liveCount: null,
    blankCount: null,
    dealerHp: null,
    dealerItems: null,
    dealerStatus: null,
    playerHp: null,
    playerItems: null,
    playerStatus: null,
    shellChamber: null,
    turnIndicator: null,
    btnShootDealer: null,
    btnShootSelf: null,
    messageOverlay: null,
    messageContent: null,
    itemSelectModal: null,
    stealItems: null,
    btnCancelSteal: null,
    roundEndScreen: null,
    roundEndTitle: null,
    roundEndMessage: null,
    btnNextRound: null,
    gameOverScreen: null,
    gameOverTitle: null,
    gameOverMessage: null,
    btnRestart: null,
    gameArea: null
};

// ========================================
// INICIALIZAÇÃO
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    initElements();
    initEventListeners();
});

function initElements() {
    elements.startScreen = document.getElementById('start-screen');
    elements.gameScreen = document.getElementById('game-screen');
    elements.roundNum = document.getElementById('round-num');
    elements.liveCount = document.getElementById('live-count');
    elements.blankCount = document.getElementById('blank-count');
    elements.dealerHp = document.getElementById('dealer-hp');
    elements.dealerItems = document.getElementById('dealer-items');
    elements.dealerStatus = document.getElementById('dealer-status');
    elements.playerHp = document.getElementById('player-hp');
    elements.playerItems = document.getElementById('player-items');
    elements.playerStatus = document.getElementById('player-status');
    elements.shellChamber = document.getElementById('shell-chamber');
    elements.turnIndicator = document.getElementById('turn-indicator');
    elements.btnShootDealer = document.getElementById('btn-shoot-dealer');
    elements.btnShootSelf = document.getElementById('btn-shoot-self');
    elements.messageOverlay = document.getElementById('message-overlay');
    elements.messageContent = document.getElementById('message-content');
    elements.itemSelectModal = document.getElementById('item-select-modal');
    elements.stealItems = document.getElementById('steal-items');
    elements.btnCancelSteal = document.getElementById('btn-cancel-steal');
    elements.roundEndScreen = document.getElementById('round-end-screen');
    elements.roundEndTitle = document.getElementById('round-end-title');
    elements.roundEndMessage = document.getElementById('round-end-message');
    elements.btnNextRound = document.getElementById('btn-next-round');
    elements.gameOverScreen = document.getElementById('game-over-screen');
    elements.gameOverTitle = document.getElementById('game-over-title');
    elements.gameOverMessage = document.getElementById('game-over-message');
    elements.btnRestart = document.getElementById('btn-restart');
    elements.gameArea = document.getElementById('game-area');
}

function initEventListeners() {
    document.getElementById('btn-start').addEventListener('click', startGame);
    elements.btnShootDealer.addEventListener('click', () => shootOpponent());
    elements.btnShootSelf.addEventListener('click', () => shootSelf());
    elements.btnNextRound.addEventListener('click', nextRound);
    elements.btnRestart.addEventListener('click', restartGame);
    elements.btnCancelSteal.addEventListener('click', cancelSteal);
}

// ========================================
// CONTROLE DO JOGO
// ========================================

function startGame() {
    elements.startScreen.classList.add('hidden');
    elements.gameScreen.classList.remove('hidden');

    GameState.currentRound = 1;
    GameState.isGameOver = false;
    GameState.winner = null;

    startRound(1);
}

function startRound(roundNumber) {
    GameState.currentRound = roundNumber;
    elements.roundNum.textContent = roundNumber;

    // HP aleatório (2-4)
    const maxHp = Math.floor(Math.random() * 3) + 2;
    GameState.player.hp = maxHp;
    GameState.player.maxHp = maxHp;
    GameState.player.handcuffed = false;
    GameState.player.sawedOff = false;
    GameState.player.items = [];

    GameState.dealer.hp = maxHp;
    GameState.dealer.maxHp = maxHp;
    GameState.dealer.handcuffed = false;
    GameState.dealer.sawedOff = false;
    GameState.dealer.items = [];
    GameState.dealer.knownShell = null;

    GameState.currentTurn = 'player';
    GameState.revealedShell = null;

    // Distribuir itens baseado na rodada
    const itemCount = roundNumber === 1 ? 2 : (roundNumber === 2 ? 3 : 4);
    distributeItems(itemCount);

    // Carregar espingarda
    loadShotgun();

    // Atualizar UI
    updateUI();
    updateTurnIndicator();
}

function loadShotgun() {
    // Gerar número de cartuchos (2-8)
    const totalShells = Math.floor(Math.random() * 7) + 2;

    // Pelo menos 1 live e 1 blank
    const minLive = 1;
    const minBlank = 1;
    const remaining = totalShells - minLive - minBlank;

    // Distribuir o restante aleatoriamente
    const extraLive = Math.floor(Math.random() * (remaining + 1));
    const extraBlank = remaining - extraLive;

    GameState.totalLive = minLive + extraLive;
    GameState.totalBlank = minBlank + extraBlank;

    // Criar array de cartuchos
    GameState.shells = [];
    for (let i = 0; i < GameState.totalLive; i++) {
        GameState.shells.push('live');
    }
    for (let i = 0; i < GameState.totalBlank; i++) {
        GameState.shells.push('blank');
    }

    // Embaralhar
    shuffleArray(GameState.shells);
    GameState.currentShellIndex = 0;

    // Resetar revelações
    GameState.revealedShell = null;
    GameState.revealedPositions = [];
    elements.shellChamber.textContent = '?';
    elements.shellChamber.className = '';

    // Atualizar contagem
    updateShellCount();

    // Mostrar mensagem
    showMessage(`Carregando: ${GameState.totalLive} LIVE, ${GameState.totalBlank} BLANK`, 1500);
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// ========================================
// SISTEMA DE ITENS
// ========================================

function distributeItems(count) {
    const allItems = Object.values(ITEMS);

    for (let i = 0; i < count; i++) {
        if (GameState.player.items.length < 8) {
            const item = allItems[Math.floor(Math.random() * allItems.length)];
            GameState.player.items.push({ ...item });
        }
        if (GameState.dealer.items.length < 8) {
            const item = allItems[Math.floor(Math.random() * allItems.length)];
            GameState.dealer.items.push({ ...item });
        }
    }
}

function useItem(itemIndex, user = 'player') {
    if (GameState.actionInProgress) return;
    if (GameState.currentTurn !== user && user === 'player') return;

    const actor = GameState[user];
    const item = actor.items[itemIndex];
    if (!item) return;

    GameState.actionInProgress = true;

    // Remover item
    actor.items.splice(itemIndex, 1);

    // Aplicar efeito
    switch (item.id) {
        case 'magnifying_glass':
            useMagnifyingGlass(user);
            break;
        case 'beer':
            useBeer(user);
            break;
        case 'cigarettes':
            useCigarettes(user);
            break;
        case 'handcuffs':
            useHandcuffs(user);
            break;
        case 'hand_saw':
            useHandSaw(user);
            break;
        case 'phone':
            usePhone(user);
            break;
        case 'inverter':
            useInverter(user);
            break;
        case 'adrenaline':
            useAdrenaline(user);
            break;
        case 'expired_medicine':
            useExpiredMedicine(user);
            break;
        case 'turn_reverser':
            useTurnReverser(user);
            break;
    }
}

function useTurnReverser(user) {
    // No modo single-player, não faz nada útil
    const msg = user === 'player'
        ? '↩️ Inversor de Ordem (apenas multiplayer)'
        : '↩️ Dealer tentou usar Inversor de Ordem';

    showMessage(msg, 2000, () => {
        GameState.actionInProgress = false;
        updateUI();
        if (user === 'dealer') dealerContinue();
    });
}

function useMagnifyingGlass(user) {
    const shell = getCurrentShell();
    GameState.revealedShell = shell;

    // Guardar posição revelada
    const currentPos = GameState.currentShellIndex;
    if (!GameState.revealedPositions.find(p => p.index === currentPos)) {
        GameState.revealedPositions.push({ index: currentPos, type: shell });
    }

    if (user === 'dealer') {
        GameState.dealer.knownShell = shell;
    }

    elements.shellChamber.textContent = shell === 'live' ? 'L' : 'B';
    elements.shellChamber.className = shell;

    const msg = user === 'player'
        ? `🔍 Cartucho atual: <span class="${shell}">${shell === 'live' ? 'LIVE' : 'BLANK'}</span>`
        : '🔍 Dealer usou a Lupa';

    showMessage(msg, 2500, () => {
        GameState.actionInProgress = false;
        updateUI();
        if (user === 'dealer') dealerContinue();
    });
}

function useBeer(user) {
    const ejected = ejectShell();

    const msg = `🍺 Ejetado: ${ejected === 'live' ? 'LIVE' : 'BLANK'}`;
    showMessage(msg, 1200, () => {
        GameState.actionInProgress = false;
        checkReload();
        updateUI();
        if (user === 'dealer') dealerContinue();
    });
}

function useCigarettes(user) {
    const actor = GameState[user];

    if (actor.hp < actor.maxHp) {
        actor.hp++;
        const area = user === 'player' ? elements.playerHp.parentElement : elements.dealerHp.parentElement;
        area.classList.add('heal-flash');
        setTimeout(() => area.classList.remove('heal-flash'), 300);
    }

    const msg = user === 'player' ? '🚬 +1 HP' : '🚬 Dealer fumou';
    showMessage(msg, 1000, () => {
        GameState.actionInProgress = false;
        updateUI();
        if (user === 'dealer') dealerContinue();
    });
}

function useHandcuffs(user) {
    const opponent = user === 'player' ? 'dealer' : 'player';
    GameState[opponent].handcuffed = true;

    const msg = user === 'player' ? '⛓️ Dealer algemado!' : '⛓️ Você foi algemado!';
    showMessage(msg, 1200, () => {
        GameState.actionInProgress = false;
        updateUI();
        if (user === 'dealer') dealerContinue();
    });
}

function useHandSaw(user) {
    GameState[user].sawedOff = true;

    if (user === 'player') {
        elements.gameArea.classList.add('sawed-off');
    }

    const msg = user === 'player' ? '🪚 Próximo tiro: 2x dano!' : '🪚 Dealer serrou o cano!';
    showMessage(msg, 1200, () => {
        GameState.actionInProgress = false;
        updateUI();
        if (user === 'dealer') dealerContinue();
    });
}

function usePhone(user) {
    // Revela um cartucho aleatório (não o atual)
    const remaining = GameState.shells.length - GameState.currentShellIndex;
    if (remaining <= 1) {
        showMessage('📱 Sem informação útil', 2000, () => {
            GameState.actionInProgress = false;
            if (user === 'dealer') dealerContinue();
        });
        return;
    }

    const randomOffset = Math.floor(Math.random() * (remaining - 1)) + 1;
    const position = GameState.currentShellIndex + randomOffset;
    const shell = GameState.shells[position];

    // Guardar posição revelada
    if (!GameState.revealedPositions.find(p => p.index === position)) {
        GameState.revealedPositions.push({ index: position, type: shell });
    }

    if (user === 'player') {
        // Mostrar visualização para o jogador
        showPhoneVisualization(position, shell);
    } else {
        const msg = `📱 Dealer usou o Celular`;
        showMessage(msg, 2000, () => {
            GameState.actionInProgress = false;
            updateUI();
            dealerContinue();
        });
    }
}

function showPhoneVisualization(revealedPosition, revealedShell) {
    const remaining = GameState.shells.length - GameState.currentShellIndex;
    const totalShells = GameState.shells.length;

    let shellsHTML = '<div class="phone-shells">';

    for (let i = 0; i < totalShells; i++) {
        const isUsed = i < GameState.currentShellIndex;
        const isCurrent = i === GameState.currentShellIndex;
        const isRevealed = i === revealedPosition ||
            GameState.revealedPositions.find(p => p.index === i) ||
            (isCurrent && GameState.revealedShell);

        let shellClass = 'phone-shell';
        let shellContent = '?';

        if (isUsed) {
            shellClass += ' used';
            shellContent = '✕';
        } else if (isRevealed) {
            const type = i === revealedPosition ? revealedShell :
                (isCurrent && GameState.revealedShell ? GameState.revealedShell :
                    GameState.revealedPositions.find(p => p.index === i)?.type);
            if (type === 'live') {
                shellClass += ' live';
                shellContent = 'L';
            } else {
                shellClass += ' blank';
                shellContent = 'B';
            }
        }

        if (isCurrent && !isUsed) {
            shellClass += ' current';
        }

        shellsHTML += `<div class="${shellClass}">
            <span class="shell-num">${i + 1}</span>
            <span class="shell-type">${shellContent}</span>
        </div>`;
    }

    shellsHTML += '</div>';

    const positionNum = revealedPosition - GameState.currentShellIndex + 1;
    const msg = `
        <div class="phone-modal">
            <div class="phone-header">📱 CELULAR - POSIÇÕES</div>
            ${shellsHTML}
            <div class="phone-info">
                Posição ${positionNum}: <span class="${revealedShell}">${revealedShell === 'live' ? 'LIVE' : 'BLANK'}</span>
            </div>
            <div class="phone-legend">
                <span class="current">◆ Atual</span>
                <span class="live">● LIVE</span>
                <span class="blank">● BLANK</span>
            </div>
        </div>
    `;

    showMessage(msg, 5000, () => {
        GameState.actionInProgress = false;
        updateUI();
    });
}

function useInverter(user) {
    const currentIdx = GameState.currentShellIndex;
    if (currentIdx < GameState.shells.length) {
        GameState.shells[currentIdx] = GameState.shells[currentIdx] === 'live' ? 'blank' : 'live';

        // Recalcular contagem
        GameState.totalLive = GameState.shells.filter(s => s === 'live').length -
            GameState.shells.slice(0, currentIdx).filter(s => s === 'live').length;
        GameState.totalBlank = GameState.shells.filter(s => s === 'blank').length -
            GameState.shells.slice(0, currentIdx).filter(s => s === 'blank').length;
    }

    // Limpar conhecimento do shell
    GameState.revealedShell = null;
    GameState.dealer.knownShell = null;
    elements.shellChamber.textContent = '?';
    elements.shellChamber.className = '';

    const msg = '🔄 Cartucho invertido!';
    showMessage(msg, 1200, () => {
        GameState.actionInProgress = false;
        updateShellCount();
        updateUI();
        if (user === 'dealer') dealerContinue();
    });
}

function useAdrenaline(user) {
    const opponent = user === 'player' ? 'dealer' : 'player';
    const opponentItems = GameState[opponent].items;

    if (opponentItems.length === 0) {
        showMessage('💉 Sem itens para roubar', 1000, () => {
            GameState.actionInProgress = false;
            if (user === 'dealer') dealerContinue();
        });
        return;
    }

    if (user === 'player') {
        // Mostrar modal para escolher item
        showStealModal(opponentItems);
    } else {
        // Dealer escolhe item aleatório
        const randomIdx = Math.floor(Math.random() * opponentItems.length);
        const stolenItem = opponentItems[randomIdx];
        opponentItems.splice(randomIdx, 1);

        showMessage(`💉 Dealer roubou ${stolenItem.emoji}`, 1200, () => {
            // Usar item roubado
            GameState.dealer.items.push(stolenItem);
            GameState.actionInProgress = false;
            updateUI();
            // Dealer usa o item roubado
            setTimeout(() => {
                const idx = GameState.dealer.items.findIndex(i => i.id === stolenItem.id);
                if (idx !== -1) {
                    useItem(idx, 'dealer');
                } else {
                    dealerContinue();
                }
            }, 500);
        });
    }
}

function showStealModal(items) {
    elements.stealItems.innerHTML = '';

    items.forEach((item, idx) => {
        const itemEl = document.createElement('div');
        itemEl.className = 'item';
        itemEl.textContent = item.emoji;
        itemEl.title = item.name;
        itemEl.addEventListener('click', () => stealItem(idx));
        elements.stealItems.appendChild(itemEl);
    });

    elements.itemSelectModal.classList.remove('hidden');
}

function stealItem(idx) {
    elements.itemSelectModal.classList.add('hidden');

    const stolenItem = GameState.dealer.items[idx];
    GameState.dealer.items.splice(idx, 1);

    showMessage(`💉 Você roubou ${stolenItem.emoji} ${stolenItem.name}`, 1200, () => {
        // Adicionar e usar imediatamente
        GameState.player.items.push(stolenItem);
        GameState.actionInProgress = false;
        updateUI();

        // Usar item roubado automaticamente
        setTimeout(() => {
            const newIdx = GameState.player.items.findIndex(i => i.id === stolenItem.id);
            if (newIdx !== -1) {
                useItem(newIdx, 'player');
            }
        }, 500);
    });
}

function cancelSteal() {
    elements.itemSelectModal.classList.add('hidden');
    // Devolver o item de adrenalina
    GameState.player.items.push({ ...ITEMS.ADRENALINE });
    GameState.actionInProgress = false;
    updateUI();
}

function useExpiredMedicine(user) {
    const actor = GameState[user];
    const success = Math.random() < 0.5;

    if (success) {
        // Cura 2 HP
        const oldHp = actor.hp;
        actor.hp = Math.min(actor.hp + 2, actor.maxHp);
        const healed = actor.hp - oldHp;

        const area = user === 'player' ? elements.playerHp.parentElement : elements.dealerHp.parentElement;
        area.classList.add('heal-flash');
        setTimeout(() => area.classList.remove('heal-flash'), 300);

        const msg = user === 'player' ? `💊 Funcionou! +${healed} HP` : '💊 Dealer curou!';
        showMessage(msg, 1200, () => {
            GameState.actionInProgress = false;
            updateUI();
            if (user === 'dealer') dealerContinue();
        });
    } else {
        // Perde 1 HP
        applyDamage(user, 1);

        const msg = user === 'player' ? '💊 Vencido! -1 HP' : '💊 Dealer perdeu HP!';
        showMessage(msg, 1200, () => {
            GameState.actionInProgress = false;
            updateUI();
            if (!checkRoundEnd() && user === 'dealer') dealerContinue();
        });
    }
}

// ========================================
// AÇÕES DE TIRO
// ========================================

function getCurrentShell() {
    return GameState.shells[GameState.currentShellIndex];
}

function ejectShell() {
    const shell = GameState.shells[GameState.currentShellIndex];
    GameState.currentShellIndex++;

    if (shell === 'live') {
        GameState.totalLive--;
    } else {
        GameState.totalBlank--;
    }

    updateShellCount();

    // Limpar revelação
    GameState.revealedShell = null;
    GameState.dealer.knownShell = null;
    elements.shellChamber.textContent = '?';
    elements.shellChamber.className = '';

    return shell;
}

function shootSelf() {
    if (GameState.actionInProgress) return;
    if (GameState.currentTurn !== 'player') return;

    performShot('player', 'player');
}

function shootOpponent() {
    if (GameState.actionInProgress) return;
    if (GameState.currentTurn !== 'player') return;

    performShot('player', 'dealer');
}

function performShot(shooter, target) {
    GameState.actionInProgress = true;
    disableActions();

    // Animação da espingarda
    const shotgun = document.getElementById('shotgun');
    shotgun.classList.add('shake');
    setTimeout(() => shotgun.classList.remove('shake'), 400);

    const shell = ejectShell();
    const damage = GameState[shooter].sawedOff ? 2 : 1;

    // Resetar serra
    GameState[shooter].sawedOff = false;
    elements.gameArea.classList.remove('sawed-off');

    setTimeout(() => {
        if (shell === 'live') {
            // Dano
            applyDamage(target, damage);

            const msg = target === shooter
                ? `💥 LIVE! -${damage} HP`
                : `💥 LIVE! Dealer: -${damage} HP`;

            showMessage(msg, 1200, () => {
                GameState.actionInProgress = false;
                if (!checkRoundEnd()) {
                    endTurn(shooter);
                }
            });
        } else {
            // Blank
            const msg = target === shooter
                ? '💨 BLANK! Jogue novamente'
                : '💨 BLANK!';

            showMessage(msg, 1000, () => {
                GameState.actionInProgress = false;

                if (target === shooter) {
                    // Atirou em si com blank - joga novamente
                    checkReload();
                    updateUI();
                    enableActions();

                    if (shooter === 'dealer') {
                        dealerTurn();
                    }
                } else {
                    // Atirou no oponente - passa turno
                    endTurn(shooter);
                }
            });
        }
    }, 400);
}

function applyDamage(target, amount) {
    GameState[target].hp = Math.max(0, GameState[target].hp - amount);

    const area = target === 'player' ? elements.playerHp.parentElement : elements.dealerHp.parentElement;
    area.classList.add('damage-flash');
    setTimeout(() => area.classList.remove('damage-flash'), 600);

    updateUI();
}

function endTurn(currentPlayer) {
    const opponent = currentPlayer === 'player' ? 'dealer' : 'player';

    // Verificar algemas
    if (GameState[opponent].handcuffed) {
        GameState[opponent].handcuffed = false;

        const msg = opponent === 'player' ? 'Você está algemado! Turno pulado' : 'Dealer algemado! Turno pulado';
        showMessage(msg, 1200, () => {
            // Mesmo jogador continua
            checkReload();
            updateUI();
            enableActions();

            if (currentPlayer === 'dealer') {
                dealerTurn();
            }
        });
    } else {
        // Trocar turno
        GameState.currentTurn = opponent;
        checkReload();
        updateUI();
        updateTurnIndicator();

        if (opponent === 'dealer') {
            setTimeout(() => dealerTurn(), 1500);
        } else {
            enableActions();
        }
    }
}

function checkReload() {
    if (GameState.currentShellIndex >= GameState.shells.length) {
        loadShotgun();

        // Distribuir novos itens
        const itemCount = GameState.currentRound === 1 ? 2 : (GameState.currentRound === 2 ? 3 : 4);
        distributeItems(itemCount);
    }
}

function checkRoundEnd() {
    if (GameState.player.hp <= 0) {
        endRound('dealer');
        return true;
    } else if (GameState.dealer.hp <= 0) {
        endRound('player');
        return true;
    }
    return false;
}

function endRound(winner) {
    if (winner === 'dealer') {
        // Jogador perdeu - Game Over
        endGame('dealer');
    } else {
        // Jogador venceu rodada
        if (GameState.currentRound >= 3) {
            endGame('player');
        } else {
            // Mostrar tela de vitória de rodada
            elements.roundEndTitle.textContent = 'RODADA VENCIDA';
            elements.roundEndTitle.className = 'victory';
            elements.roundEndMessage.textContent = `Rodada ${GameState.currentRound} completa!`;
            elements.roundEndScreen.classList.remove('hidden');
        }
    }
}

function nextRound() {
    elements.roundEndScreen.classList.add('hidden');
    startRound(GameState.currentRound + 1);
}

function endGame(winner) {
    GameState.isGameOver = true;
    GameState.winner = winner;

    if (winner === 'player') {
        elements.gameOverTitle.textContent = 'VOCÊ VENCEU';
        elements.gameOverTitle.className = 'victory';
        elements.gameOverMessage.textContent = 'O Dealer foi derrotado.';
    } else {
        elements.gameOverTitle.textContent = 'VOCÊ PERDEU';
        elements.gameOverTitle.className = 'defeat';
        elements.gameOverMessage.textContent = 'O Dealer venceu.';
    }

    elements.gameOverScreen.classList.remove('hidden');
}

function restartGame() {
    elements.gameOverScreen.classList.add('hidden');
    elements.gameScreen.classList.add('hidden');
    elements.startScreen.classList.remove('hidden');
}

// ========================================
// IA DO DEALER
// ========================================

function dealerTurn() {
    if (GameState.isGameOver || GameState.currentTurn !== 'dealer') return;

    disableActions();

    // Delay para parecer que está pensando
    setTimeout(() => {
        // Usar itens estrategicamente
        if (dealerUseItems()) {
            return; // dealerContinue será chamado após usar item
        }

        dealerShoot();
    }, 1000);
}

function dealerContinue() {
    if (GameState.isGameOver || GameState.currentTurn !== 'dealer') return;

    setTimeout(() => {
        // Tentar usar mais itens
        if (dealerUseItems()) {
            return;
        }

        dealerShoot();
    }, 800);
}

function dealerUseItems() {
    const items = GameState.dealer.items;
    if (items.length === 0) return false;

    // 1. Se não sabe o shell, usar lupa
    if (GameState.dealer.knownShell === null) {
        const magIdx = items.findIndex(i => i.id === 'magnifying_glass');
        if (magIdx !== -1) {
            useItem(magIdx, 'dealer');
            return true;
        }
    }

    // 2. Se sabe que é live e vai atirar em si, usar cerveja
    if (GameState.dealer.knownShell === 'live') {
        const beerIdx = items.findIndex(i => i.id === 'beer');
        if (beerIdx !== -1 && shouldDealerShootSelf()) {
            useItem(beerIdx, 'dealer');
            return true;
        }

        // Usar serra antes de atirar no jogador
        const sawIdx = items.findIndex(i => i.id === 'hand_saw');
        if (sawIdx !== -1 && !GameState.dealer.sawedOff) {
            useItem(sawIdx, 'dealer');
            return true;
        }

        // Usar algemas se vai atirar no jogador
        const cuffIdx = items.findIndex(i => i.id === 'handcuffs');
        if (cuffIdx !== -1 && !GameState.player.handcuffed) {
            useItem(cuffIdx, 'dealer');
            return true;
        }
    }

    // 3. Se sabe que é blank e vai atirar no jogador, usar inversor
    if (GameState.dealer.knownShell === 'blank') {
        const invIdx = items.findIndex(i => i.id === 'inverter');
        if (invIdx !== -1 && !shouldDealerShootSelf()) {
            useItem(invIdx, 'dealer');
            return true;
        }
    }

    // 4. Usar cigarro se HP baixo
    if (GameState.dealer.hp < GameState.dealer.maxHp) {
        const cigIdx = items.findIndex(i => i.id === 'cigarettes');
        if (cigIdx !== -1) {
            useItem(cigIdx, 'dealer');
            return true;
        }
    }

    // 5. Usar remédio se HP muito baixo (arriscado)
    if (GameState.dealer.hp === 1) {
        const medIdx = items.findIndex(i => i.id === 'expired_medicine');
        if (medIdx !== -1 && Math.random() < 0.5) {
            useItem(medIdx, 'dealer');
            return true;
        }
    }

    return false;
}

function shouldDealerShootSelf() {
    // Calcular probabilidade
    const remaining = GameState.shells.length - GameState.currentShellIndex;
    if (remaining === 0) return false;

    let liveRemaining = 0;
    for (let i = GameState.currentShellIndex; i < GameState.shells.length; i++) {
        if (GameState.shells[i] === 'live') liveRemaining++;
    }
    const blankRemaining = remaining - liveRemaining;

    // Se sabe o shell
    if (GameState.dealer.knownShell === 'blank') return true;
    if (GameState.dealer.knownShell === 'live') return false;

    // Probabilidade
    return blankRemaining > liveRemaining;
}

function dealerShoot() {
    if (GameState.isGameOver) return;

    const shootSelf = shouldDealerShootSelf();

    if (shootSelf) {
        showMessage('Dealer atira em si...', 1000, () => {
            performShot('dealer', 'dealer');
        });
    } else {
        showMessage('Dealer atira em você...', 1000, () => {
            performShot('dealer', 'player');
        });
    }

    // Limpar conhecimento
    GameState.dealer.knownShell = null;
}

// ========================================
// UI UPDATES
// ========================================

function updateUI() {
    updateHP();
    updateItems();
    updateShellCount();
    updateStatus();
}

function updateHP() {
    // Player HP
    elements.playerHp.innerHTML = '';
    for (let i = 0; i < GameState.player.maxHp; i++) {
        const icon = document.createElement('span');
        icon.className = 'hp-icon' + (i >= GameState.player.hp ? ' empty' : '');
        elements.playerHp.appendChild(icon);
    }

    // Dealer HP
    elements.dealerHp.innerHTML = '';
    for (let i = 0; i < GameState.dealer.maxHp; i++) {
        const icon = document.createElement('span');
        icon.className = 'hp-icon' + (i >= GameState.dealer.hp ? ' empty' : '');
        elements.dealerHp.appendChild(icon);
    }
}

function updateItems() {
    // Player items
    elements.playerItems.innerHTML = '';
    GameState.player.items.forEach((item, idx) => {
        const itemEl = document.createElement('div');
        itemEl.className = 'item';
        if (GameState.currentTurn !== 'player' || GameState.actionInProgress) {
            itemEl.classList.add('disabled');
        }
        itemEl.textContent = item.emoji;

        const tooltip = document.createElement('div');
        tooltip.className = 'item-tooltip';
        tooltip.innerHTML = `<strong>${item.name}</strong><br><span class="tooltip-desc">${item.description}</span>`;
        itemEl.appendChild(tooltip);

        itemEl.addEventListener('click', () => useItem(idx, 'player'));
        elements.playerItems.appendChild(itemEl);
    });

    // Dealer items
    elements.dealerItems.innerHTML = '';
    GameState.dealer.items.forEach((item) => {
        const itemEl = document.createElement('div');
        itemEl.className = 'item disabled';
        itemEl.textContent = item.emoji;

        const tooltip = document.createElement('div');
        tooltip.className = 'item-tooltip';
        tooltip.innerHTML = `<strong>${item.name}</strong>`;
        itemEl.appendChild(tooltip);

        elements.dealerItems.appendChild(itemEl);
    });
}

function updateShellCount() {
    // Contar shells restantes
    let liveRemaining = 0;
    let blankRemaining = 0;

    for (let i = GameState.currentShellIndex; i < GameState.shells.length; i++) {
        if (GameState.shells[i] === 'live') liveRemaining++;
        else blankRemaining++;
    }

    elements.liveCount.textContent = liveRemaining;
    elements.blankCount.textContent = blankRemaining;
}

function updateStatus() {
    // Player status
    let playerStatus = '';
    if (GameState.player.handcuffed) playerStatus += '⛓️ Algemado ';
    if (GameState.player.sawedOff) playerStatus += '🪚 2x Dano ';
    elements.playerStatus.textContent = playerStatus;

    // Dealer status
    let dealerStatus = '';
    if (GameState.dealer.handcuffed) dealerStatus += '⛓️ Algemado ';
    if (GameState.dealer.sawedOff) dealerStatus += '🪚 2x Dano ';
    elements.dealerStatus.textContent = dealerStatus;
}

function updateTurnIndicator() {
    if (GameState.currentTurn === 'player') {
        elements.turnIndicator.textContent = 'SEU TURNO';
        elements.turnIndicator.className = '';
        enableActions();
    } else {
        elements.turnIndicator.textContent = 'TURNO DO DEALER';
        elements.turnIndicator.className = 'dealer-turn';
        disableActions();
    }
}

function enableActions() {
    elements.btnShootDealer.disabled = false;
    elements.btnShootSelf.disabled = false;
}

function disableActions() {
    elements.btnShootDealer.disabled = true;
    elements.btnShootSelf.disabled = true;
}

function showMessage(text, duration = 2500, callback = null) {
    elements.messageContent.innerHTML = text + '<br><span class="msg-hint">(clique para fechar)</span>';
    elements.messageOverlay.classList.remove('hidden');

    let closed = false;
    const closeMessage = () => {
        if (closed) return;
        closed = true;
        elements.messageOverlay.classList.add('hidden');
        elements.messageOverlay.removeEventListener('click', closeMessage);
        if (callback) callback();
    };

    // Permite fechar clicando
    elements.messageOverlay.addEventListener('click', closeMessage);

    // Fecha automaticamente após a duração
    setTimeout(closeMessage, duration);
}
