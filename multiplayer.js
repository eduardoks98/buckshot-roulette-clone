// ========================================
// BUCKSHOT ROULETTE - CLIENTE MULTIPLAYER
// ========================================

// Verificar se está abrindo via file://
if (window.location.protocol === 'file:') {
    alert('ERRO: O multiplayer só funciona via servidor!\n\nPassos:\n1. Abra o terminal na pasta "server"\n2. Execute: npm install\n3. Execute: node server.js\n4. Acesse pelo IP mostrado no terminal');
}

let socket = null;
let myPlayerId = null;
let myPlayerName = null;
let isHost = false;
let roomCode = null;
let multiplayerState = {
    players: [],
    currentPlayer: null,
    turnDirection: 1,
    shells: { total: 0, live: 0, blank: 0 },
    revealedShell: null,
    revealedPositions: [],
    round: 1
};

// ========================================
// CONEXÃO
// ========================================

function connectToServer() {
    // Usa a mesma origem do site (funciona com localhost ou IP da rede)
    const serverUrl = window.location.origin;
    console.log('Conectando ao servidor:', serverUrl);

    socket = io(serverUrl);

    socket.on('connect', () => {
        myPlayerId = socket.id;
        console.log('Conectado ao servidor:', myPlayerId);
    });

    socket.on('disconnect', () => {
        console.log('Desconectado do servidor');
        showMultiplayerMessage('Desconectado do servidor', 3000);
        showLobbyScreen();
    });

    // Eventos de sala
    socket.on('roomCreated', handleRoomCreated);
    socket.on('roomJoined', handleRoomJoined);
    socket.on('joinError', handleJoinError);
    socket.on('playerJoined', handlePlayerJoined);
    socket.on('playerLeft', handlePlayerLeft);
    socket.on('hostChanged', handleHostChanged);
    socket.on('startError', handleStartError);

    // Eventos de jogo
    socket.on('roundStarted', handleRoundStarted);
    socket.on('shotFired', handleShotFired);
    socket.on('itemUsed', handleItemUsed);
    socket.on('playerDisconnected', handlePlayerDisconnected);
    socket.on('gameOver', handleGameOver);
    socket.on('actionError', handleActionError);
}

// ========================================
// HANDLERS DE SALA
// ========================================

function handleRoomCreated(data) {
    roomCode = data.code;
    isHost = data.isHost;
    multiplayerState.players = data.players;

    showWaitingRoom();
    updatePlayerList();
}

function handleRoomJoined(data) {
    roomCode = data.code;
    isHost = data.isHost;
    multiplayerState.players = data.players;

    showWaitingRoom();
    updatePlayerList();
}

function handleJoinError(error) {
    showMultiplayerMessage(`Erro: ${error}`, 3000);
}

function handlePlayerJoined(data) {
    multiplayerState.players = data.players;
    updatePlayerList();
    showMultiplayerMessage(`${data.newPlayer} entrou na sala`, 2000);
}

function handlePlayerLeft(data) {
    multiplayerState.players = data.players;
    updatePlayerList();
}

function handleHostChanged(data) {
    showMultiplayerMessage(`${data.newHost} é o novo host`, 2500);
    // Atualizar estado de host
    isHost = multiplayerState.players[0]?.id === myPlayerId;
    updatePlayerList();
}

function handleStartError(error) {
    showMultiplayerMessage(`Erro: ${error}`, 3000);
}

// ========================================
// HANDLERS DE JOGO
// ========================================

function handleRoundStarted(data) {
    multiplayerState.round = data.round;
    multiplayerState.players = data.players;
    multiplayerState.shells = data.shells;
    multiplayerState.currentPlayer = data.currentPlayer;
    multiplayerState.turnDirection = data.turnDirection;
    multiplayerState.revealedShell = null;
    multiplayerState.revealedPositions = [];

    showMultiplayerGame();
    updateMultiplayerUI();

    showMultiplayerMessage(`RODADA ${data.round} - ${data.maxHp} HP`, 3000);
}

function handleShotFired(data) {
    multiplayerState.players = data.players;
    multiplayerState.shells = data.shellsRemaining;
    multiplayerState.currentPlayer = data.nextPlayer;
    multiplayerState.turnDirection = data.turnDirection;
    multiplayerState.revealedShell = null;

    // Animação de tiro
    const shooterName = data.shooterId === myPlayerId ? 'Você' : data.shooterName;
    const targetName = data.targetId === myPlayerId ? 'você' : data.targetName;
    const selfShot = data.shooterId === data.targetId;

    let message = '';
    if (selfShot) {
        if (data.shell === 'live') {
            message = `💥 ${shooterName} atirou em si! LIVE! -${data.damage} HP`;
        } else {
            message = `💨 ${shooterName} atirou em si! BLANK! Joga novamente`;
        }
    } else {
        if (data.shell === 'live') {
            message = `💥 ${shooterName} atirou em ${targetName}! LIVE! -${data.damage} HP`;
        } else {
            message = `💨 ${shooterName} atirou em ${targetName}! BLANK!`;
        }
    }

    showMultiplayerMessage(message, 2500, () => {
        if (data.reloaded) {
            multiplayerState.shells = data.newShells;
            showMultiplayerMessage(`Recarregando: ${data.newShells.live} LIVE, ${data.newShells.blank} BLANK`, 2500);
        }
        if (data.skippedPlayer) {
            showMultiplayerMessage(`${data.skippedPlayerName} estava algemado! Turno pulado`, 2000);
        }
        updateMultiplayerUI();
    });

    // Verificar eliminação
    const targetPlayer = multiplayerState.players.find(p => p.id === data.targetId);
    if (targetPlayer && !targetPlayer.alive) {
        setTimeout(() => {
            showMultiplayerMessage(`☠️ ${data.targetName} foi eliminado!`, 2500);
        }, 2600);
    }
}

function handleItemUsed(data) {
    multiplayerState.players = data.players;
    multiplayerState.shells = data.shellsRemaining;
    multiplayerState.turnDirection = data.turnDirection;

    const userName = data.playerId === myPlayerId ? 'Você usou' : `${data.playerName} usou`;

    let message = `${data.item.emoji} ${userName} ${data.item.name}`;

    switch (data.item.id) {
        case 'magnifying_glass':
            if (data.playerId === myPlayerId) {
                multiplayerState.revealedShell = data.revealedShell;
                message += `: ${data.revealedShell === 'live' ? 'LIVE' : 'BLANK'}`;
            }
            break;

        case 'beer':
            message += `: Ejetado ${data.ejectedShell === 'live' ? 'LIVE' : 'BLANK'}`;
            multiplayerState.revealedShell = null;
            break;

        case 'cigarettes':
            if (data.healed) {
                message += `: +${data.healed} HP`;
            }
            break;

        case 'handcuffs':
            message += `: ${data.targetName} algemado!`;
            break;

        case 'hand_saw':
            message += `: Próximo tiro 2x dano!`;
            break;

        case 'phone':
            if (data.playerId === myPlayerId && data.revealedPosition !== undefined) {
                multiplayerState.revealedPositions.push({
                    index: data.revealedPosition,
                    type: data.revealedPositionShell
                });
                message += `: Posição ${data.relativePosition} é ${data.revealedPositionShell === 'live' ? 'LIVE' : 'BLANK'}`;
            }
            break;

        case 'inverter':
            message += `: Cartucho invertido!`;
            multiplayerState.revealedShell = null;
            break;

        case 'adrenaline':
            if (data.stolenItem) {
                message += `: Roubou ${data.stolenItem.emoji} de ${data.targetName}`;
            }
            break;

        case 'expired_medicine':
            if (data.success) {
                message += `: Funcionou! +${data.healed} HP`;
            } else {
                message += `: Vencido! -1 HP`;
                if (data.eliminated) {
                    message += ' ☠️ Eliminado!';
                }
            }
            break;

        case 'turn_reverser':
            const dir = data.newDirection === 1 ? 'HORÁRIO' : 'ANTI-HORÁRIO';
            message += `: Ordem agora é ${dir}`;
            break;
    }

    showMultiplayerMessage(message, 2500, () => {
        if (data.reloaded) {
            showMultiplayerMessage(`Recarregando espingarda...`, 2000);
        }
        updateMultiplayerUI();
    });
}

function handlePlayerDisconnected(data) {
    multiplayerState.players = data.players;
    showMultiplayerMessage('Um jogador desconectou', 2500);
    updateMultiplayerUI();
}

function handleGameOver(data) {
    const winnerName = data.winner?.id === myPlayerId ? 'VOCÊ' : data.winner?.name;
    const isWinner = data.winner?.id === myPlayerId;

    const title = isWinner ? 'VOCÊ VENCEU!' : `${winnerName} VENCEU!`;
    showGameOverMultiplayer(title, data.reason, isWinner);
}

function handleActionError(error) {
    showMultiplayerMessage(`Erro: ${error}`, 2000);
}

// ========================================
// AÇÕES DO JOGADOR
// ========================================

function createRoom() {
    const nameInput = document.getElementById('player-name');
    myPlayerName = nameInput.value.trim() || `Jogador${Math.floor(Math.random() * 1000)}`;

    if (!socket?.connected) {
        connectToServer();
        setTimeout(() => {
            socket.emit('createRoom', myPlayerName);
        }, 500);
    } else {
        socket.emit('createRoom', myPlayerName);
    }
}

function joinRoom() {
    const nameInput = document.getElementById('player-name');
    const codeInput = document.getElementById('room-code');

    myPlayerName = nameInput.value.trim() || `Jogador${Math.floor(Math.random() * 1000)}`;
    const code = codeInput.value.trim().toUpperCase();

    if (!code) {
        showMultiplayerMessage('Digite o código da sala', 2000);
        return;
    }

    if (!socket?.connected) {
        connectToServer();
        setTimeout(() => {
            socket.emit('joinRoom', { code, playerName: myPlayerName });
        }, 500);
    } else {
        socket.emit('joinRoom', { code, playerName: myPlayerName });
    }
}

function startMultiplayerGame() {
    if (isHost && socket?.connected) {
        socket.emit('startGame');
    }
}

function leaveCurrentRoom() {
    if (socket?.connected) {
        socket.emit('leaveRoom');
    }
    showLobbyScreen();
}

function shootPlayer(targetId) {
    if (socket?.connected && multiplayerState.currentPlayer === myPlayerId) {
        socket.emit('shoot', { targetId });
    }
}

function useMultiplayerItem(itemId, targetId = null) {
    if (socket?.connected && multiplayerState.currentPlayer === myPlayerId) {
        socket.emit('useItem', { itemId, targetId });
    }
}

// ========================================
// UI MULTIPLAYER
// ========================================

function showLobbyScreen() {
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.add('hidden');
    document.getElementById('multiplayer-lobby').classList.remove('hidden');
    document.getElementById('waiting-room').classList.add('hidden');
    document.getElementById('multiplayer-game').classList.add('hidden');
}

function showWaitingRoom() {
    document.getElementById('multiplayer-lobby').classList.add('hidden');
    document.getElementById('waiting-room').classList.remove('hidden');
    document.getElementById('room-code-display').textContent = roomCode;
}

function showMultiplayerGame() {
    document.getElementById('waiting-room').classList.add('hidden');
    document.getElementById('multiplayer-game').classList.remove('hidden');
}

function updatePlayerList() {
    const container = document.getElementById('players-list');
    container.innerHTML = '';

    multiplayerState.players.forEach((player, index) => {
        const div = document.createElement('div');
        div.className = 'player-item';
        const hostBadge = index === 0 ? ' 👑' : '';
        const youBadge = player.id === myPlayerId ? ' (você)' : '';
        div.textContent = `${player.name}${hostBadge}${youBadge}`;
        container.appendChild(div);
    });

    // Mostrar/esconder botão de iniciar
    const startBtn = document.getElementById('btn-start-multiplayer');
    if (isHost && multiplayerState.players.length >= 2) {
        startBtn.classList.remove('hidden');
        startBtn.textContent = 'INICIAR JOGO';
    } else if (isHost && multiplayerState.players.length < 2) {
        startBtn.classList.remove('hidden');
        startBtn.textContent = 'AGUARDANDO JOGADORES... (mín. 2)';
        startBtn.disabled = true;
    } else {
        startBtn.classList.add('hidden');
    }

    // Habilitar botão quando tiver jogadores suficientes
    if (multiplayerState.players.length >= 2) {
        startBtn.disabled = false;
    }

    // Atualizar contagem
    document.getElementById('player-count').textContent =
        `${multiplayerState.players.length}/4 jogadores`;
}

function updateMultiplayerUI() {
    // Atualizar rodada e shells
    document.getElementById('mp-round').textContent = multiplayerState.round;
    document.getElementById('mp-live-count').textContent = multiplayerState.shells.live;
    document.getElementById('mp-blank-count').textContent = multiplayerState.shells.blank;

    // Atualizar direção
    const dirText = multiplayerState.turnDirection === 1 ? '→ Horário' : '← Anti-horário';
    document.getElementById('turn-direction').textContent = dirText;

    // Atualizar jogadores
    const playersContainer = document.getElementById('mp-players');
    playersContainer.innerHTML = '';

    multiplayerState.players.forEach(player => {
        const isCurrentTurn = player.id === multiplayerState.currentPlayer;
        const isMe = player.id === myPlayerId;

        const div = document.createElement('div');
        div.className = `mp-player ${!player.alive ? 'eliminated' : ''} ${isCurrentTurn ? 'current-turn' : ''} ${isMe ? 'is-me' : ''}`;

        // HP
        let hpHTML = '<div class="mp-hp">';
        for (let i = 0; i < player.maxHp; i++) {
            hpHTML += `<span class="hp-icon ${i >= player.hp ? 'empty' : ''}"></span>`;
        }
        hpHTML += '</div>';

        // Itens (só mostrar detalhes dos seus itens)
        let itemsHTML = '<div class="mp-items">';
        if (isMe) {
            player.items.forEach(item => {
                itemsHTML += `<div class="item" onclick="selectItemToUse('${item.id}')" title="${item.name}: ${item.description}">${item.emoji}</div>`;
            });
        } else {
            player.items.forEach(item => {
                itemsHTML += `<div class="item disabled">${item.emoji}</div>`;
            });
        }
        itemsHTML += '</div>';

        // Status
        let statusHTML = '';
        if (player.handcuffed) statusHTML += '⛓️ ';
        if (player.sawedOff) statusHTML += '🪚 ';
        if (!player.alive) statusHTML = '☠️ ELIMINADO';

        div.innerHTML = `
            <div class="mp-player-name">${player.name}${isMe ? ' (você)' : ''}</div>
            ${hpHTML}
            ${itemsHTML}
            <div class="mp-player-status">${statusHTML}</div>
        `;

        playersContainer.appendChild(div);
    });

    // Atualizar botões de ação
    updateActionButtons();

    // Atualizar indicador de turno
    const currentPlayer = multiplayerState.players.find(p => p.id === multiplayerState.currentPlayer);
    const turnText = currentPlayer?.id === myPlayerId
        ? 'SEU TURNO'
        : `TURNO DE ${currentPlayer?.name?.toUpperCase() || '...'}`;
    document.getElementById('mp-turn-indicator').textContent = turnText;
    document.getElementById('mp-turn-indicator').className = currentPlayer?.id === myPlayerId ? 'your-turn' : 'other-turn';

    // Mostrar shell revelado
    const chamber = document.getElementById('mp-shell-chamber');
    if (multiplayerState.revealedShell) {
        chamber.textContent = multiplayerState.revealedShell === 'live' ? 'L' : 'B';
        chamber.className = multiplayerState.revealedShell;
    } else {
        chamber.textContent = '?';
        chamber.className = '';
    }
}

function updateActionButtons() {
    const container = document.getElementById('mp-action-buttons');
    container.innerHTML = '';

    const isMyTurn = multiplayerState.currentPlayer === myPlayerId;
    const myPlayer = multiplayerState.players.find(p => p.id === myPlayerId);

    if (!isMyTurn || !myPlayer?.alive) {
        container.innerHTML = '<p class="waiting-msg">Aguardando...</p>';
        return;
    }

    // Botão de atirar em si
    const selfBtn = document.createElement('button');
    selfBtn.className = 'action-btn secondary';
    selfBtn.textContent = 'ATIRAR EM SI';
    selfBtn.onclick = () => shootPlayer(myPlayerId);
    container.appendChild(selfBtn);

    // Botões para atirar em outros jogadores
    multiplayerState.players.forEach(player => {
        if (player.id !== myPlayerId && player.alive) {
            const btn = document.createElement('button');
            btn.className = 'action-btn';
            btn.textContent = `ATIRAR EM ${player.name.toUpperCase()}`;
            btn.onclick = () => shootPlayer(player.id);
            container.appendChild(btn);
        }
    });
}

let selectedItemId = null;

function selectItemToUse(itemId) {
    if (multiplayerState.currentPlayer !== myPlayerId) {
        showMultiplayerMessage('Não é seu turno', 1500);
        return;
    }

    // Itens que precisam de alvo
    const needsTarget = ['handcuffs', 'adrenaline'];

    if (needsTarget.includes(itemId)) {
        selectedItemId = itemId;
        showTargetSelection(itemId);
    } else {
        useMultiplayerItem(itemId);
    }
}

function showTargetSelection(itemId) {
    const modal = document.getElementById('target-select-modal');
    const container = document.getElementById('target-options');
    container.innerHTML = '';

    const itemName = itemId === 'handcuffs' ? 'Algemar' : 'Roubar item de';

    multiplayerState.players.forEach(player => {
        if (player.id !== myPlayerId && player.alive) {
            const btn = document.createElement('button');
            btn.className = 'action-btn';
            btn.textContent = player.name;
            btn.onclick = () => {
                modal.classList.add('hidden');
                useMultiplayerItem(itemId, player.id);
            };
            container.appendChild(btn);
        }
    });

    document.getElementById('target-select-title').textContent = itemName + ':';
    modal.classList.remove('hidden');
}

function cancelTargetSelection() {
    document.getElementById('target-select-modal').classList.add('hidden');
    selectedItemId = null;
}

function showMultiplayerMessage(text, duration = 2500, callback = null) {
    const overlay = document.getElementById('mp-message-overlay');
    const content = document.getElementById('mp-message-content');

    content.innerHTML = text + '<br><span class="msg-hint">(clique para fechar)</span>';
    overlay.classList.remove('hidden');

    let closed = false;
    const closeMsg = () => {
        if (closed) return;
        closed = true;
        overlay.classList.add('hidden');
        overlay.removeEventListener('click', closeMsg);
        if (callback) callback();
    };

    overlay.addEventListener('click', closeMsg);
    setTimeout(closeMsg, duration);
}

function showGameOverMultiplayer(title, reason, isWinner) {
    const screen = document.getElementById('mp-game-over');
    const titleEl = document.getElementById('mp-game-over-title');
    const msgEl = document.getElementById('mp-game-over-message');

    titleEl.textContent = title;
    titleEl.className = isWinner ? 'victory' : 'defeat';
    msgEl.textContent = reason;

    screen.classList.remove('hidden');
}

function restartMultiplayer() {
    document.getElementById('mp-game-over').classList.add('hidden');
    document.getElementById('multiplayer-game').classList.add('hidden');
    showLobbyScreen();
}

// ========================================
// INICIALIZAÇÃO
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    // Adicionar botão de multiplayer na tela inicial
    const startScreen = document.getElementById('start-screen');
    const multiplayerBtn = document.createElement('button');
    multiplayerBtn.id = 'btn-multiplayer';
    multiplayerBtn.className = 'main-btn';
    multiplayerBtn.style.marginTop = '1rem';
    multiplayerBtn.textContent = 'MULTIPLAYER';
    multiplayerBtn.onclick = showLobbyScreen;
    startScreen.appendChild(multiplayerBtn);
});
