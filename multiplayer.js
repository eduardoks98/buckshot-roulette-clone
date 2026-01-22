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
let availableRooms = [];
let multiplayerState = {
    players: [],
    currentPlayer: null,
    turnDirection: 1,
    shells: { total: 0, live: 0, blank: 0 },
    revealedShell: null,
    revealedPositions: [],
    round: 1
};

// Timer state
let turnTimerInterval = null;
let turnTimeRemaining = 0;

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
        showMultiplayerMessage('Desconectado do servidor');
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
    socket.on('roomList', handleRoomList);

    // Eventos de jogo
    socket.on('roundStarted', handleRoundStarted);
    socket.on('shotFired', handleShotFired);
    socket.on('itemUsed', handleItemUsed);
    socket.on('playerDisconnected', handlePlayerDisconnected);
    socket.on('gameOver', handleGameOver);
    socket.on('actionError', handleActionError);
    socket.on('playerItems', handlePlayerItems);  // Para seleção de item na Adrenalina

    // Eventos do timer
    socket.on('turnTimerStarted', handleTurnTimerStarted);
    socket.on('turnTimedOut', handleTurnTimedOut);
    socket.on('turnChanged', handleTurnChanged);
    socket.on('playerSkipped', handlePlayerSkipped);
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
    showMultiplayerMessage(`Erro: ${error}`);
}

function handlePlayerJoined(data) {
    multiplayerState.players = data.players;
    updatePlayerList();
    showMultiplayerMessage(`${data.newPlayer} entrou na sala`);
}

function handlePlayerLeft(data) {
    multiplayerState.players = data.players;
    updatePlayerList();
}

function handleHostChanged(data) {
    showMultiplayerMessage(`${data.newHost} é o novo host`);
    // Atualizar estado de host
    isHost = multiplayerState.players[0]?.id === myPlayerId;
    updatePlayerList();
}

function handleStartError(error) {
    showMultiplayerMessage(`Erro: ${error}`);
}

// ========================================
// HANDLERS DE JOGO
// ========================================

function handleRoundStarted(data) {
    multiplayerState.round = data.round;
    // Garantir que todos os jogadores têm alive definido
    multiplayerState.players = data.players.map(p => ({
        ...p,
        alive: p.alive !== undefined ? p.alive : true
    }));
    multiplayerState.shells = data.shells;
    multiplayerState.currentPlayer = data.currentPlayer;
    multiplayerState.turnDirection = data.turnDirection;
    multiplayerState.revealedShell = null;
    multiplayerState.revealedPositions = [];

    showMultiplayerGame();
    updateMultiplayerUI();

    // Pequeno delay para garantir que a tela está visível
    setTimeout(() => {
        // Mensagem de início de rodada estilo Buckshot Roulette
        const msg = `
            <div class="round-start-info">
                <h2>🎯 RODADA ${data.round}</h2>
                <div class="shell-announcement">
                    <span class="live-shells">🔴 ${data.shells.live} LIVE</span>
                    <span class="blank-shells">🔵 ${data.shells.blank} BLANK</span>
                </div>
                <p>⚡ ${data.maxHp} HP cada</p>
                <p class="total-shells">Total: ${data.shells.live + data.shells.blank} cartuchos</p>
            </div>
        `;
        showMultiplayerMessage(msg);
    }, 200);
}

function handleShotFired(data) {
    multiplayerState.players = data.players;
    multiplayerState.shells = data.shellsRemaining;
    multiplayerState.currentPlayer = data.nextPlayer;
    multiplayerState.turnDirection = data.turnDirection;
    multiplayerState.revealedShell = null;

    // Animação de tiro na espingarda
    const shotgun = document.getElementById('mp-shotgun');
    if (shotgun) {
        shotgun.classList.add('firing');
        setTimeout(() => {
            shotgun.classList.remove('firing');
            // Remover efeito de serra após o tiro
            shotgun.classList.remove('sawed-off');
        }, 500);
    }

    // Animação de dano no jogador alvo (se LIVE)
    if (data.shell === 'live') {
        setTimeout(() => {
            const targetElement = document.querySelector(`.mp-player[data-player-id="${data.target}"]`);
            if (targetElement) {
                targetElement.classList.add('taking-damage');
                setTimeout(() => targetElement.classList.remove('taking-damage'), 600);
            }
        }, 200);
    }

    // Atualizar UI imediatamente (não esperar callback)
    updateMultiplayerUI();

    // DEBUG: Ver dados recebidos
    console.log('DEBUG shotFired:', {
        shooter: data.shooter,
        target: data.target,
        shooterName: data.shooterName,
        targetName: data.targetName,
        myPlayerId: myPlayerId
    });

    // Animação de tiro
    const shooterId = data.shooter;
    const targetId = data.target;
    const shooterName = shooterId === myPlayerId ? 'Você' : data.shooterName;
    const targetName = targetId === myPlayerId ? 'você' : data.targetName;
    const selfShot = shooterId === targetId;

    console.log('DEBUG selfShot:', selfShot, 'shooterId:', shooterId, 'targetId:', targetId);

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

    showMultiplayerMessage(message, () => {
        if (data.reloaded) {
            multiplayerState.shells = data.newShells;
            showMultiplayerMessage(`🔫 Recarregando: ${data.newShells.live} LIVE, ${data.newShells.blank} BLANK`);
        }
        if (data.skippedPlayer) {
            showMultiplayerMessage(`${data.skippedPlayerName} estava algemado! Turno pulado`);
        }

        // Verificar eliminação
        const targetPlayer = multiplayerState.players.find(p => p.id === targetId);
        if (targetPlayer && !targetPlayer.alive) {
            showMultiplayerMessage(`☠️ ${data.targetName} foi eliminado!`, () => {
                updateMultiplayerUI();
            });
        } else {
            updateMultiplayerUI();
        }
    });
}

function handleItemUsed(data) {
    multiplayerState.players = data.players;
    multiplayerState.shells = data.shellsRemaining;
    multiplayerState.turnDirection = data.turnDirection;

    // Animações baseadas no item usado
    if (data.item.id === 'cigarettes' || (data.item.id === 'expired_medicine' && data.success)) {
        // Animação de cura
        setTimeout(() => {
            const playerElement = document.querySelector(`.mp-player[data-player-id="${data.playerId}"]`);
            if (playerElement) {
                playerElement.classList.add('healing');
                setTimeout(() => playerElement.classList.remove('healing'), 700);
            }
        }, 100);
    } else if (data.item.id === 'expired_medicine' && !data.success) {
        // Animação de dano (remédio falhou)
        setTimeout(() => {
            const playerElement = document.querySelector(`.mp-player[data-player-id="${data.playerId}"]`);
            if (playerElement) {
                playerElement.classList.add('taking-damage');
                setTimeout(() => playerElement.classList.remove('taking-damage'), 600);
            }
        }, 100);
    } else if (data.item.id === 'hand_saw') {
        // Adicionar efeito visual na espingarda para serra
        const shotgun = document.getElementById('mp-shotgun');
        if (shotgun) {
            shotgun.classList.add('sawed-off');
        }
    }

    // Atualizar UI imediatamente (não esperar callback)
    updateMultiplayerUI();

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
            if (data.failed && data.failReason === 'imune') {
                message += `: FALHOU! ${data.targetName} tem imunidade (foi algemado recentemente)`;
            } else {
                message += `: ${data.targetName} algemado!`;
            }
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

                // Mostrar efeito do item usado
                if (data.usedItemResult) {
                    const ur = data.usedItemResult;
                    switch (data.stolenItem.id) {
                        case 'magnifying_glass':
                            if (data.playerId === myPlayerId) {
                                multiplayerState.revealedShell = ur.revealedShell;
                                message += ` → ${ur.revealedShell === 'live' ? 'LIVE' : 'BLANK'}`;
                            }
                            break;
                        case 'beer':
                            message += ` → Ejetado ${ur.ejectedShell === 'live' ? 'LIVE' : 'BLANK'}`;
                            multiplayerState.revealedShell = null;
                            break;
                        case 'cigarettes':
                            if (ur.healed) message += ` → +${ur.healed} HP`;
                            break;
                        case 'handcuffs':
                            message += ` → ${data.targetName} algemado!`;
                            break;
                        case 'hand_saw':
                            message += ` → Próximo tiro 2x dano!`;
                            break;
                        case 'phone':
                            if (ur.revealedPosition !== undefined) {
                                message += ` → Posição ${ur.relativePosition}: ${ur.revealedPositionShell === 'live' ? 'LIVE' : 'BLANK'}`;
                            }
                            break;
                        case 'inverter':
                            message += ` → Cartucho invertido!`;
                            multiplayerState.revealedShell = null;
                            break;
                        case 'expired_medicine':
                            if (ur.success) {
                                message += ` → +${ur.healed} HP`;
                            } else {
                                message += ` → -1 HP`;
                                if (ur.eliminated) message += ' ☠️';
                            }
                            break;
                        case 'turn_reverser':
                            const usedDir = ur.newDirection === 1 ? 'HORÁRIO' : 'ANTI-HORÁRIO';
                            message += ` → Ordem: ${usedDir}`;
                            break;
                    }
                }
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

    showMultiplayerMessage(message, () => {
        if (data.reloaded) {
            showMultiplayerMessage(`Recarregando espingarda...`, () => {
                updateMultiplayerUI();
            });
        } else {
            updateMultiplayerUI();
        }
    });
}

function handlePlayerDisconnected(data) {
    multiplayerState.players = data.players;
    showMultiplayerMessage('Um jogador desconectou');
    updateMultiplayerUI();
}

function handleGameOver(data) {
    // Limpar timer ao fim do jogo
    clearClientTimer();

    const winnerName = data.winner?.id === myPlayerId ? 'VOCÊ' : data.winner?.name;
    const isWinner = data.winner?.id === myPlayerId;

    const title = isWinner ? 'VOCÊ VENCEU!' : `${winnerName} VENCEU!`;
    showGameOverMultiplayer(title, data.reason, isWinner);
}

function handleActionError(error) {
    showMultiplayerMessage(`Erro: ${error}`);
}

// ========================================
// HANDLERS DO TIMER
// ========================================

function handleTurnTimerStarted(data) {
    console.log('DEBUG: Timer iniciado para:', data.currentPlayer, 'duração:', data.duration);
    startClientTimer(data.duration);
}

function handleTurnTimedOut(data) {
    console.log('DEBUG: Timeout para:', data.playerName);
    clearClientTimer();
    showMultiplayerMessage(`⏰ ${data.playerName} perdeu a vez por tempo!`);
}

function handleTurnChanged(data) {
    console.log('DEBUG: Turno mudou para:', data.currentPlayer, 'razão:', data.reason);
    multiplayerState.currentPlayer = data.currentPlayer;
    if (data.players) {
        multiplayerState.players = data.players;
    }
    updateMultiplayerUI();
}

function handlePlayerSkipped(data) {
    showMultiplayerMessage(`⛓️ ${data.skippedPlayerName} estava algemado! Turno pulado`);
}

// ========================================
// FUNÇÕES DO TIMER
// ========================================

function startClientTimer(duration) {
    // Limpar timer anterior se existir
    if (turnTimerInterval) {
        clearInterval(turnTimerInterval);
        turnTimerInterval = null;
    }

    turnTimeRemaining = duration;
    updateTimerDisplay();

    turnTimerInterval = setInterval(() => {
        turnTimeRemaining -= 1000;
        if (turnTimeRemaining < 0) turnTimeRemaining = 0;
        updateTimerDisplay();

        if (turnTimeRemaining <= 0) {
            clearInterval(turnTimerInterval);
            turnTimerInterval = null;
        }
    }, 1000);
}

function clearClientTimer() {
    if (turnTimerInterval) {
        clearInterval(turnTimerInterval);
        turnTimerInterval = null;
    }
    turnTimeRemaining = 0;
    updateTimerDisplay();
}

function updateTimerDisplay() {
    const timerEl = document.getElementById('mp-turn-timer');
    const display = document.getElementById('timer-display');

    console.log('DEBUG updateTimerDisplay:', { timerEl: !!timerEl, display: !!display, turnTimeRemaining });

    if (!timerEl || !display) {
        console.error('ERRO: Elementos do timer não encontrados!');
        return;
    }

    const minutes = Math.floor(turnTimeRemaining / 60000);
    const seconds = Math.floor((turnTimeRemaining % 60000) / 1000);
    display.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    // Mudar estilo baseado no tempo restante
    timerEl.classList.remove('low-time', 'critical-time');

    if (turnTimeRemaining <= 10000) {
        // Menos de 10 segundos - crítico
        timerEl.classList.add('critical-time');
    } else if (turnTimeRemaining <= 30000) {
        // Menos de 30 segundos - alerta
        timerEl.classList.add('low-time');
    }
}

// ========================================
// AÇÕES DO JOGADOR
// ========================================

function createRoom() {
    const nameInput = document.getElementById('player-name');
    const passwordInput = document.getElementById('room-password');

    myPlayerName = nameInput.value.trim() || `Jogador${Math.floor(Math.random() * 1000)}`;
    const password = passwordInput?.value.trim() || null;

    if (!socket?.connected) {
        connectToServer();
        setTimeout(() => {
            socket.emit('createRoom', { playerName: myPlayerName, password });
        }, 500);
    } else {
        socket.emit('createRoom', { playerName: myPlayerName, password });
    }
}

function joinRoom() {
    const nameInput = document.getElementById('player-name');
    const codeInput = document.getElementById('room-code');
    const passwordInput = document.getElementById('join-room-password');

    myPlayerName = nameInput.value.trim() || `Jogador${Math.floor(Math.random() * 1000)}`;
    const code = codeInput.value.trim().toUpperCase();
    const password = passwordInput?.value.trim() || null;

    if (!code) {
        showMultiplayerMessage('Digite o código da sala');
        return;
    }

    if (!socket?.connected) {
        connectToServer();
        setTimeout(() => {
            socket.emit('joinRoom', { code, playerName: myPlayerName, password });
        }, 500);
    } else {
        socket.emit('joinRoom', { code, playerName: myPlayerName, password });
    }
}

function startMultiplayerGame() {
    if (isHost && socket?.connected) {
        socket.emit('startGame');
    }
}

function leaveCurrentRoom() {
    // Limpar timer ao sair da sala
    clearClientTimer();

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

function useMultiplayerItem(itemId, targetId = null, stealItemIndex = null) {
    if (socket?.connected && multiplayerState.currentPlayer === myPlayerId) {
        socket.emit('useItem', { itemId, targetId, itemIndex: stealItemIndex });
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

    // Atualizar lista de salas automaticamente
    setTimeout(() => refreshRoomList(), 300);
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

// Calcula as posições dos jogadores no layout de mesa
// O jogador atual (você) sempre fica na posição "bottom"
function getPlayerPositions(players, myId) {
    const numPlayers = players.length;
    const positions = [];

    // Encontrar índice do jogador atual
    const myIndex = players.findIndex(p => p.id === myId);

    // Posições disponíveis baseadas no número de jogadores
    // 2 jogadores: top, bottom
    // 3 jogadores: top, left, bottom ou top, right, bottom
    // 4 jogadores: top, left, right, bottom
    const positionMaps = {
        2: ['top', 'bottom'],
        3: ['top', 'left', 'bottom'],
        4: ['top', 'left', 'right', 'bottom']
    };

    const availablePositions = positionMaps[numPlayers] || positionMaps[4];

    // Reorganizar para que o jogador atual fique em "bottom"
    for (let i = 0; i < numPlayers; i++) {
        // Calcular offset para que myIndex vá para a última posição (bottom)
        const offset = (i - myIndex + numPlayers) % numPlayers;
        // Mapear para posição baseada no offset
        const posIndex = offset === 0 ? availablePositions.length - 1 : offset - 1;
        positions[i] = availablePositions[Math.min(posIndex, availablePositions.length - 1)];
    }

    // Garantir que eu estou em bottom
    if (myIndex >= 0) {
        positions[myIndex] = 'bottom';

        // Reordenar os outros
        let posCounter = 0;
        for (let i = 0; i < numPlayers; i++) {
            if (i !== myIndex) {
                positions[i] = availablePositions[posCounter];
                posCounter++;
                if (posCounter >= availablePositions.length - 1) posCounter = 0;
            }
        }
    }

    return positions;
}

function updateMultiplayerUI() {
    // Atualizar rodada
    document.getElementById('mp-round').textContent = multiplayerState.round;

    // Mostrar apenas total de cartuchos (não revelar LIVE/BLANK)
    const total = (typeof multiplayerState.shells.total === 'number')
        ? multiplayerState.shells.total
        : (multiplayerState.shells.live + multiplayerState.shells.blank);
    document.getElementById('mp-shell-count').innerHTML = `<span class="shells-remaining">${total} CARTUCHOS</span>`;

    // Atualizar direção
    const dirText = multiplayerState.turnDirection === 1 ? '→ Horário' : '← Anti-horário';
    document.getElementById('turn-direction').textContent = dirText;

    // Atualizar jogadores
    const playersContainer = document.getElementById('mp-players');
    playersContainer.innerHTML = '';

    // Definir classe baseada no número de jogadores
    const numPlayers = multiplayerState.players.length;
    playersContainer.className = '';
    if (numPlayers === 2) playersContainer.classList.add('two-players');
    else if (numPlayers === 3) playersContainer.classList.add('three-players');

    // Posições para layout de mesa (eu sempre fico embaixo)
    const positions = getPlayerPositions(multiplayerState.players, myPlayerId);

    multiplayerState.players.forEach((player, index) => {
        const isCurrentTurn = player.id === multiplayerState.currentPlayer;
        const isMe = player.id === myPlayerId;
        const position = positions[index];

        const div = document.createElement('div');
        div.className = `mp-player ${!player.alive ? 'eliminated' : ''} ${isCurrentTurn ? 'current-turn' : ''} ${isMe ? 'is-me' : ''}`;
        div.setAttribute('data-position', position);
        div.setAttribute('data-player-id', player.id);

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
    const isMyTurnNow = multiplayerState.currentPlayer === myPlayerId;
    let turnText;
    if (isMyTurnNow) {
        turnText = 'SEU TURNO';
    } else if (currentPlayer) {
        const name = (typeof currentPlayer.name === 'string' && currentPlayer.name)
            ? currentPlayer.name.toUpperCase()
            : 'OUTRO JOGADOR';
        turnText = `TURNO DE ${name}`;
    } else {
        turnText = 'AGUARDANDO...';
    }
    document.getElementById('mp-turn-indicator').textContent = turnText;
    document.getElementById('mp-turn-indicator').className = isMyTurnNow ? 'your-turn' : 'other-turn';

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

    // DEBUG DETALHADO
    console.log('DEBUG updateActionButtons:', {
        isMyTurn,
        myPlayerId,
        currentPlayer: multiplayerState.currentPlayer,
        totalPlayers: multiplayerState.players.length,
        players: multiplayerState.players.map(p => ({
            id: p.id,
            name: p.name,
            alive: p.alive,
            isMe: p.id === myPlayerId
        }))
    });

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
    let otherPlayersCount = 0;
    multiplayerState.players.forEach(player => {
        console.log('DEBUG player check:', player.id, 'name:', player.name, 'isMe:', player.id === myPlayerId, 'alive:', player.alive);

        if (player.id !== myPlayerId && player.alive) {
            otherPlayersCount++;
            const btn = document.createElement('button');
            btn.className = 'action-btn';
            // Garantir que name é uma string válida
            const playerName = (typeof player.name === 'string' && player.name)
                ? player.name.toUpperCase()
                : `JOGADOR`;
            btn.textContent = `ATIRAR EM ${playerName}`;
            btn.onclick = () => shootPlayer(player.id);
            container.appendChild(btn);
        }
    });

    console.log('DEBUG: Botões criados para outros jogadores:', otherPlayersCount);
}

let selectedItemId = null;

function selectItemToUse(itemId) {
    if (multiplayerState.currentPlayer !== myPlayerId) {
        showMultiplayerMessage('Não é seu turno');
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

let pendingAdrenalineTarget = null;

function showTargetSelection(itemId) {
    const modal = document.getElementById('target-select-modal');
    const container = document.getElementById('target-options');
    container.innerHTML = '';

    const itemName = itemId === 'handcuffs' ? 'Algemar' : 'Roubar item de';

    // Filtrar jogadores válidos
    let validTargets = multiplayerState.players.filter(player =>
        player.id !== myPlayerId && player.alive
    );

    // Para algemas: excluir jogadores com imunidade OU já algemados
    if (itemId === 'handcuffs') {
        validTargets = validTargets.filter(player =>
            !player.handcuffImmune && !player.handcuffed
        );
    }

    // Se não há alvos válidos, mostrar mensagem
    if (validTargets.length === 0) {
        showMultiplayerMessage('Nenhum jogador válido para usar este item!');
        return;
    }

    validTargets.forEach(player => {
        const btn = document.createElement('button');
        btn.className = 'action-btn';
        btn.textContent = player.name;
        btn.onclick = () => {
            modal.classList.add('hidden');
            if (itemId === 'adrenaline') {
                // Para Adrenalina: primeiro mostrar itens do alvo
                pendingAdrenalineTarget = player.id;
                console.log('DEBUG: Emitindo getPlayerItems para:', player.id);
                socket.emit('getPlayerItems', { targetId: player.id });
            } else {
                useMultiplayerItem(itemId, player.id);
            }
        };
        container.appendChild(btn);
    });

    document.getElementById('target-select-title').textContent = itemName + ':';
    modal.classList.remove('hidden');
}

function cancelTargetSelection() {
    document.getElementById('target-select-modal').classList.add('hidden');
    selectedItemId = null;
    pendingAdrenalineTarget = null;
}

// Handler para receber itens do alvo (Adrenalina)
function handlePlayerItems(data) {
    console.log('DEBUG: handlePlayerItems recebido:', data);

    if (data.items.length === 0) {
        showMultiplayerMessage('Jogador não tem itens para roubar!');
        pendingAdrenalineTarget = null;
        return;
    }
    showItemStealModal(data.targetId, data.targetName, data.items);
}

// Modal para escolher qual item roubar
function showItemStealModal(targetId, targetName, items) {
    console.log('DEBUG: showItemStealModal chamado:', { targetId, targetName, items });

    const modal = document.getElementById('item-steal-modal');
    const container = document.getElementById('steal-item-options');

    if (!modal) {
        console.error('DEBUG: Modal item-steal-modal não encontrado!');
        return;
    }

    container.innerHTML = '';

    document.getElementById('steal-target-name').textContent = targetName;

    items.forEach((item, index) => {
        const btn = document.createElement('button');
        btn.className = 'steal-item-btn';
        btn.innerHTML = `<span class="item-emoji">${item.emoji}</span><span class="item-name">${item.name}</span>`;
        btn.onclick = () => {
            modal.classList.add('hidden');
            // Usar o índice do item para roubar
            useMultiplayerItem('adrenaline', targetId, item.index !== undefined ? item.index : index);
            pendingAdrenalineTarget = null;
        };
        container.appendChild(btn);
    });

    modal.classList.remove('hidden');
    console.log('DEBUG: Modal mostrado, classe atual:', modal.className);
}

function cancelItemSteal() {
    document.getElementById('item-steal-modal').classList.add('hidden');
    pendingAdrenalineTarget = null;
}

function showMultiplayerMessage(text, callback = null) {
    const overlay = document.getElementById('mp-message-overlay');
    const content = document.getElementById('mp-message-content');

    content.innerHTML = text + '<br><span class="msg-hint">(clique para continuar)</span>';
    overlay.classList.remove('hidden');

    let closed = false;
    const closeMsg = () => {
        if (closed) return;
        closed = true;
        overlay.classList.add('hidden');
        overlay.removeEventListener('click', closeMsg);
        if (callback) callback();
    };

    // SÓ fecha com click, sem timeout automático
    overlay.addEventListener('click', closeMsg);
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
// LISTA DE SALAS E SENHA
// ========================================

function handleRoomList(rooms) {
    availableRooms = rooms;
    renderRoomList();
}

function refreshRoomList() {
    if (!socket?.connected) {
        connectToServer();
        setTimeout(() => {
            if (socket?.connected) {
                socket.emit('listRooms');
            }
        }, 500);
    } else {
        socket.emit('listRooms');
    }
}

function renderRoomList() {
    const container = document.getElementById('room-list');
    if (!container) return;

    container.innerHTML = '';

    if (availableRooms.length === 0) {
        container.innerHTML = '<p class="no-rooms">Nenhuma sala disponível</p>';
        return;
    }

    availableRooms.forEach(room => {
        const div = document.createElement('div');
        div.className = 'room-item';
        div.innerHTML = `
            <span class="room-host">${room.hostName}</span>
            <span class="room-code">${room.code}</span>
            <span class="room-players">${room.playerCount}/4</span>
            ${room.hasPassword ? '<span class="room-lock">🔒</span>' : '<span class="room-lock"></span>'}
            <button onclick="joinRoomFromList('${room.code}', ${room.hasPassword})" class="main-btn small">ENTRAR</button>
        `;
        container.appendChild(div);
    });
}

function joinRoomFromList(code, hasPassword) {
    const nameInput = document.getElementById('player-name');
    myPlayerName = nameInput.value.trim() || `Jogador${Math.floor(Math.random() * 1000)}`;

    if (hasPassword) {
        showPasswordModal(code);
    } else {
        if (!socket?.connected) {
            connectToServer();
            setTimeout(() => {
                socket.emit('joinRoom', { code, playerName: myPlayerName, password: null });
            }, 500);
        } else {
            socket.emit('joinRoom', { code, playerName: myPlayerName, password: null });
        }
    }
}

function showPasswordModal(code) {
    const modal = document.getElementById('password-modal');
    document.getElementById('password-room-code').value = code;
    document.getElementById('join-password').value = '';
    modal.classList.remove('hidden');
}

function submitPassword() {
    const code = document.getElementById('password-room-code').value;
    const password = document.getElementById('join-password').value;
    const nameInput = document.getElementById('player-name');

    myPlayerName = nameInput.value.trim() || `Jogador${Math.floor(Math.random() * 1000)}`;

    document.getElementById('password-modal').classList.add('hidden');
    document.getElementById('join-password').value = '';

    if (!socket?.connected) {
        connectToServer();
        setTimeout(() => {
            socket.emit('joinRoom', { code, playerName: myPlayerName, password });
        }, 500);
    } else {
        socket.emit('joinRoom', { code, playerName: myPlayerName, password });
    }
}

function cancelPasswordModal() {
    document.getElementById('password-modal').classList.add('hidden');
    document.getElementById('join-password').value = '';
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
