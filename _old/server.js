const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());

// Servir arquivos estáticos da pasta pai
app.use(express.static(path.join(__dirname, '..')));

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// ========================================
// GERENCIAMENTO DE SALAS
// ========================================

const rooms = new Map();

// Constantes de reconexão
const RECONNECT_GRACE_PERIOD = 60000; // 60 segundos para reconectar

// Gerar token único para reconexão
function generateReconnectToken() {
    return Math.random().toString(36).substring(2, 15) +
           Math.random().toString(36).substring(2, 15);
}

// Encontrar sala pelo ID do jogador
function findRoomByPlayer(playerId) {
    for (const [code, room] of rooms) {
        if (room.players.find(p => p.id === playerId)) {
            return { code, room };
        }
    }
    return null;
}

function generateRoomCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

function createRoom(hostSocket, hostName, password = null) {
    let code = generateRoomCode();
    while (rooms.has(code)) {
        code = generateRoomCode();
    }

    const room = {
        code,
        host: hostSocket.id,
        hostName: hostName,
        password: password || null, // null = sala pública
        players: [{
            id: hostSocket.id,
            name: hostName,
            hp: 0,
            maxHp: 0,
            items: [],
            handcuffed: false,
            handcuffImmune: false,
            sawedOff: false,
            alive: true,
            hadZeroItems: false,
            roundWins: 0,  // Contador de rodadas vencidas
            // Campos de reconexão
            disconnected: false,
            disconnectTime: null,
            reconnectToken: null,
            originalSocketId: null
        }],
        gameState: null,
        started: false,
        currentRound: 1,
        turnDirection: 1, // 1 = horário, -1 = anti-horário
        currentPlayerIndex: 0,
        // Timer de turno
        turnTimeout: null,
        turnStartTime: null,
        TURN_DURATION: 120000 // 2 minutos em ms
    };

    rooms.set(code, room);
    return room;
}

function joinRoom(code, socket, playerName, password = null) {
    const room = rooms.get(code);
    if (!room) return { error: 'Sala não encontrada' };
    if (room.started) return { error: 'Jogo já iniciado' };
    if (room.players.length >= 4) return { error: 'Sala cheia (máx. 4 jogadores)' };
    if (room.players.find(p => p.id === socket.id)) return { error: 'Já está na sala' };

    // Verificar senha se a sala for protegida
    if (room.password && room.password !== password) {
        return { error: 'Senha incorreta' };
    }

    room.players.push({
        id: socket.id,
        name: playerName,
        hp: 0,
        maxHp: 0,
        items: [],
        handcuffed: false,
        handcuffImmune: false,
        sawedOff: false,
        alive: true,
        hadZeroItems: false,
        roundWins: 0,  // Contador de rodadas vencidas
        // Campos de reconexão
        disconnected: false,
        disconnectTime: null,
        reconnectToken: null,
        originalSocketId: null
    });

    return { room };
}

function leaveRoom(socket) {
    for (const [code, room] of rooms) {
        const playerIndex = room.players.findIndex(p => p.id === socket.id);
        if (playerIndex !== -1) {
            // Limpar timer se o jogador atual saiu
            if (room.started && room.players[room.currentPlayerIndex]?.id === socket.id) {
                clearTurnTimer(room);
            }

            room.players.splice(playerIndex, 1);

            // Se o host saiu, transferir ou fechar sala
            if (room.host === socket.id) {
                if (room.players.length > 0) {
                    room.host = room.players[0].id;
                    io.to(code).emit('hostChanged', { newHost: room.players[0].name });
                } else {
                    rooms.delete(code);
                    return { deleted: true, code };
                }
            }

            // Se jogo em andamento, marcar jogador como eliminado
            if (room.started) {
                io.to(code).emit('playerDisconnected', {
                    playerId: socket.id,
                    players: room.players
                });

                // Verificar se sobrou apenas 1 jogador
                const alivePlayers = room.players.filter(p => p.alive);
                if (alivePlayers.length <= 1) {
                    io.to(code).emit('gameOver', {
                        winner: alivePlayers[0] || null,
                        reason: 'Outros jogadores desconectaram'
                    });
                    // Deletar sala após game over
                    rooms.delete(code);
                }
            }

            return { code, room };
        }
    }
    return null;
}

// ========================================
// SISTEMA DE RECONEXÃO
// ========================================

// Verificar se timeout de reconexão expirou
function checkReconnectTimeout(room, player) {
    // Se jogador já reconectou, não fazer nada
    if (!player.disconnected) return;

    // Se sala não existe mais, não fazer nada
    if (!rooms.has(room.code)) return;

    // Se já passou o tempo, eliminar jogador
    if (Date.now() - player.disconnectTime >= RECONNECT_GRACE_PERIOD) {
        eliminateDisconnectedPlayer(room, player);
    }
}

// Eliminar jogador que não reconectou a tempo
function eliminateDisconnectedPlayer(room, player) {
    player.alive = false;
    player.disconnected = false;

    console.log(`[${new Date().toLocaleString('pt-BR')}] Jogador ${player.name} eliminado por timeout de reconexão`);

    io.to(room.code).emit('playerEliminated', {
        playerId: player.originalSocketId || player.id,
        playerName: player.name,
        reason: 'Tempo de reconexão expirado'
    });

    // Verificar se jogo deve acabar
    const alivePlayers = room.players.filter(p => p.alive && !p.disconnected);
    if (alivePlayers.length <= 1) {
        const winner = alivePlayers[0] || null;
        if (winner) {
            winner.roundWins = (winner.roundWins || 0) + 1;
        }

        const winsNeeded = 2;
        const winnerWins = winner?.roundWins || 0;

        if (winnerWins >= winsNeeded || room.currentRound >= 3) {
            io.to(room.code).emit('gameOver', {
                winner: winner,
                reason: winner
                    ? `${winner.name} é o último sobrevivente!`
                    : 'Todos os jogadores desconectaram'
            });
            rooms.delete(room.code);
        } else {
            // Próxima rodada
            room.currentRound++;
            setTimeout(() => {
                if (rooms.has(room.code)) {
                    startRound(room);
                }
            }, 3000);
        }
    }
}

// Pular turno de jogador desconectado
function skipDisconnectedPlayerTurn(room) {
    const code = room.code;

    // Limpar timer atual
    clearTurnTimer(room);

    // Encontrar próximo jogador válido (vivo e conectado)
    let attempts = 0;
    let nextIndex = room.currentPlayerIndex;

    do {
        nextIndex = (nextIndex + room.turnDirection + room.players.length) % room.players.length;
        attempts++;
        if (attempts > room.players.length) {
            // Nenhum jogador válido encontrado
            return;
        }
    } while (!room.players[nextIndex].alive || room.players[nextIndex].disconnected);

    // Verificar se próximo jogador está algemado
    const nextPlayer = room.players[nextIndex];
    if (nextPlayer.handcuffed) {
        nextPlayer.handcuffed = false;
        nextPlayer.handcuffImmune = true;

        io.to(code).emit('playerSkipped', {
            playerId: nextPlayer.id,
            playerName: nextPlayer.name,
            reason: 'handcuffs'
        });

        room.currentPlayerIndex = nextIndex;

        // Buscar o próximo após o algemado
        attempts = 0;
        do {
            nextIndex = (nextIndex + room.turnDirection + room.players.length) % room.players.length;
            attempts++;
            if (attempts > room.players.length) return;
        } while (!room.players[nextIndex].alive || room.players[nextIndex].disconnected);
    }

    room.currentPlayerIndex = nextIndex;

    // Notificar novo turno
    io.to(code).emit('turnChanged', {
        currentPlayer: room.players[nextIndex].id,
        reason: 'playerDisconnected',
        players: room.players.map(p => ({
            id: p.id,
            name: p.name,
            hp: p.hp,
            maxHp: p.maxHp,
            items: p.items,
            alive: p.alive,
            disconnected: p.disconnected,
            handcuffed: p.handcuffed,
            handcuffImmune: p.handcuffImmune || false,
            sawedOff: p.sawedOff
        }))
    });

    // Reiniciar timer para o novo jogador
    startTurnTimer(room, code);
}

// ========================================
// LÓGICA DO JOGO
// ========================================

const ITEMS = [
    { id: 'magnifying_glass', emoji: '🔍', name: 'Lupa', description: 'Revela se o cartucho atual é LIVE ou BLANK' },
    { id: 'beer', emoji: '🍺', name: 'Cerveja', description: 'Ejeta o cartucho atual sem disparar' },
    { id: 'cigarettes', emoji: '🚬', name: 'Cigarro', description: 'Restaura 1 HP (não excede máximo)' },
    { id: 'handcuffs', emoji: '⛓️', name: 'Algemas', description: 'Pula o próximo turno do oponente' },
    { id: 'hand_saw', emoji: '🪚', name: 'Serra', description: 'Próximo tiro causa 2x de dano' },
    { id: 'phone', emoji: '📱', name: 'Celular', description: 'Revela a posição de um cartucho na arma' },
    { id: 'inverter', emoji: '🔄', name: 'Inversor', description: 'Inverte o cartucho atual (LIVE↔BLANK)' },
    { id: 'adrenaline', emoji: '💉', name: 'Adrenalina', description: 'Rouba e usa um item do oponente' },
    { id: 'expired_medicine', emoji: '💊', name: 'Remédio Vencido', description: '50% chance: +2 HP ou -1 HP' },
    { id: 'turn_reverser', emoji: '↩️', name: 'Inversor de Ordem', description: 'Inverte a direção dos turnos' }
];

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function startGame(room) {
    room.started = true;
    room.currentRound = 1;
    room.turnDirection = 1;
    room.currentPlayerIndex = 0;

    startRound(room);
}

function startRound(room, firstPlayerIndex = null) {
    // HP aleatório (2-4)
    const maxHp = Math.floor(Math.random() * 3) + 2;

    // Resetar jogadores
    room.players.forEach(player => {
        player.hp = maxHp;
        player.maxHp = maxHp;
        player.items = [];
        player.handcuffed = false;
        player.handcuffImmune = false;
        player.sawedOff = false;
        player.alive = true;
        player.hadZeroItems = false;  // Resetar para nova rodada
    });

    // Carregar espingarda
    loadShotgun(room);

    // Distribuir itens - REGRA ORIGINAL: 1-5 aleatório
    const itemCount = Math.floor(Math.random() * 5) + 1;
    distributeItems(room, itemCount, maxHp);

    // Definir primeiro jogador: usar índice fornecido, senão aleatório
    if (firstPlayerIndex !== null && firstPlayerIndex >= 0 && firstPlayerIndex < room.players.length) {
        room.currentPlayerIndex = firstPlayerIndex;
    } else {
        // Aleatório entre todos os jogadores
        room.currentPlayerIndex = Math.floor(Math.random() * room.players.length);
    }

    room.revealedPositions = [];
    room.firstToDie = null; // Resetar para nova rodada

    io.to(room.code).emit('roundStarted', {
        round: room.currentRound,
        maxHp,
        players: room.players.map(p => ({
            id: p.id,
            name: p.name,
            hp: p.hp,
            maxHp: p.maxHp,
            items: p.items,
            alive: p.alive,
            handcuffed: p.handcuffed || false,
            handcuffImmune: p.handcuffImmune || false,
            sawedOff: p.sawedOff || false
        })),
        shells: {
            total: room.shells.length,
            live: room.shells.filter(s => s === 'live').length,
            blank: room.shells.filter(s => s === 'blank').length
        },
        currentPlayer: room.players[room.currentPlayerIndex].id,
        turnDirection: room.turnDirection
    });

    // Iniciar timer do primeiro turno
    startTurnTimer(room, room.code);
}

function loadShotgun(room) {
    const totalShells = Math.floor(Math.random() * 7) + 2;
    const minLive = 1;
    const minBlank = 1;
    const remaining = totalShells - minLive - minBlank;
    const extraLive = Math.floor(Math.random() * (remaining + 1));
    const extraBlank = remaining - extraLive;

    room.shells = [];
    for (let i = 0; i < minLive + extraLive; i++) {
        room.shells.push('live');
    }
    for (let i = 0; i < minBlank + extraBlank; i++) {
        room.shells.push('blank');
    }

    shuffleArray(room.shells);
    room.currentShellIndex = 0;
    room.revealedShell = null;
    room.revealedPositions = [];
}

function distributeItems(room, count, maxHp = 4) {
    room.players.forEach(player => {
        // Pular jogadores que zeraram itens durante a rodada (só recebem na próxima rodada)
        if (player.hadZeroItems) {
            return;
        }

        for (let i = 0; i < count; i++) {
            if (player.items.length < 8) {
                let item;
                do {
                    item = { ...ITEMS[Math.floor(Math.random() * ITEMS.length)] };
                    // REGRA ORIGINAL: Serra (hand_saw) NUNCA aparece quando HP = 2
                    // (para evitar morte instantânea com 2 de dano)
                } while (maxHp === 2 && item.id === 'hand_saw');

                player.items.push(item);
            }
        }
    });
}

function getNextPlayerIndex(room) {
    const alivePlayers = room.players.filter(p => p.alive);
    if (alivePlayers.length <= 1) return -1;

    let attempts = 0;
    let nextIndex = room.currentPlayerIndex;

    do {
        nextIndex = (nextIndex + room.turnDirection + room.players.length) % room.players.length;
        attempts++;
        if (attempts > room.players.length) return -1;
    } while (!room.players[nextIndex].alive);

    return nextIndex;
}

// ========================================
// TIMER DE TURNO (2 MINUTOS)
// ========================================

function startTurnTimer(room, code) {
    // Limpar timeout anterior
    if (room.turnTimeout) {
        clearTimeout(room.turnTimeout);
        room.turnTimeout = null;
    }

    room.turnStartTime = Date.now();

    // Notificar clientes do início do timer
    console.log(`[TIMER] Iniciando timer para sala ${code}, jogador: ${room.players[room.currentPlayerIndex].name}, duração: ${room.TURN_DURATION}ms`);
    io.to(code).emit('turnTimerStarted', {
        currentPlayer: room.players[room.currentPlayerIndex].id,
        duration: room.TURN_DURATION
    });

    // Definir timeout
    room.turnTimeout = setTimeout(() => {
        handleTurnTimeout(room, code);
    }, room.TURN_DURATION);
}

function clearTurnTimer(room) {
    if (room.turnTimeout) {
        clearTimeout(room.turnTimeout);
        room.turnTimeout = null;
    }
}

function handleTurnTimeout(room, code) {
    // Verificar se a sala ainda existe e o jogo está ativo
    if (!rooms.has(code) || !room.started) return;

    const timedOutPlayer = room.players[room.currentPlayerIndex];
    if (!timedOutPlayer || !timedOutPlayer.alive) return;

    console.log(`[TIMEOUT] ${timedOutPlayer.name} perdeu a vez por tempo na sala ${code}`);

    // Emitir evento de timeout
    io.to(code).emit('turnTimedOut', {
        playerId: timedOutPlayer.id,
        playerName: timedOutPlayer.name
    });

    // Avançar para próximo jogador
    let nextIndex = getNextPlayerIndex(room);
    if (nextIndex === -1) {
        // Sem jogadores válidos - não fazer nada
        return;
    }

    // Verificar se próximo jogador está algemado
    const nextPlayer = room.players[nextIndex];
    if (nextPlayer.handcuffed) {
        nextPlayer.handcuffed = false;
        nextPlayer.handcuffImmune = true;

        io.to(code).emit('playerSkipped', {
            playerId: nextPlayer.id,
            playerName: nextPlayer.name,
            reason: 'handcuffs'
        });

        room.currentPlayerIndex = nextIndex;
        nextIndex = getNextPlayerIndex(room);

        if (nextIndex === -1) return;
    }

    room.currentPlayerIndex = nextIndex;

    // Notificar novo turno
    io.to(code).emit('turnChanged', {
        currentPlayer: room.players[nextIndex].id,
        reason: 'timeout',
        players: room.players.map(p => ({
            id: p.id,
            name: p.name,
            hp: p.hp,
            maxHp: p.maxHp,
            items: p.items,
            alive: p.alive,
            handcuffed: p.handcuffed,
            handcuffImmune: p.handcuffImmune || false,
            sawedOff: p.sawedOff
        }))
    });

    // Iniciar timer para novo jogador
    startTurnTimer(room, code);
}

function processShot(room, shooterId, targetId) {
    const shooter = room.players.find(p => p.id === shooterId);
    const target = room.players.find(p => p.id === targetId);
    if (!shooter || !target) return null;

    const shell = room.shells[room.currentShellIndex];
    room.currentShellIndex++;

    const damage = shooter.sawedOff ? 2 : 1;
    shooter.sawedOff = false;

    let result = {
        shell,
        shooter: shooterId,
        target: targetId,
        damage: shell === 'live' ? damage : 0,
        shooterName: shooter.name,
        targetName: target.name
    };

    if (shell === 'live') {
        target.hp = Math.max(0, target.hp - damage);

        if (target.hp <= 0) {
            target.alive = false;
            // Rastrear quem MORREU primeiro na rodada (para próxima rodada começar com ele)
            if (room.firstToDie === null || room.firstToDie === undefined) {
                room.firstToDie = room.players.findIndex(p => p.id === targetId);
            }
        }
    }

    // Limpar revelação
    room.revealedShell = null;

    // Verificar se precisa recarregar
    if (room.currentShellIndex >= room.shells.length) {
        loadShotgun(room);

        // CORREÇÃO: Resetar hadZeroItems para todos antes de distribuir
        // Isso permite que jogadores que usaram todos os itens recebam novos no reload
        room.players.forEach(p => p.hadZeroItems = false);

        // REGRA ORIGINAL: 1-5 itens aleatórios no reload
        const itemCount = Math.floor(Math.random() * 5) + 1;
        const maxHp = room.players[0]?.maxHp || 4;
        distributeItems(room, itemCount, maxHp);
        result.reloaded = true;
        result.newShells = {
            total: room.shells.length,
            live: room.shells.filter(s => s === 'live').length,
            blank: room.shells.filter(s => s === 'blank').length
        };
    }

    // Determinar próximo turno
    const shootSelf = shooterId === targetId;
    const isBlank = shell === 'blank';

    if (shootSelf && isBlank) {
        // Atira em si com blank - joga novamente
        result.nextPlayer = shooterId;
    } else {
        // Verificar algemas do próximo jogador
        let nextIndex = getNextPlayerIndex(room);
        if (nextIndex === -1) {
            result.roundOver = true;
        } else {
            const nextPlayer = room.players[nextIndex];
            if (nextPlayer.handcuffed) {
                nextPlayer.handcuffed = false;
                nextPlayer.handcuffImmune = true; // Imunidade: não pode ser algemado de novo imediatamente
                result.skippedPlayer = nextPlayer.id;
                result.skippedPlayerName = nextPlayer.name;
                // Próximo jogador depois do algemado
                room.currentPlayerIndex = nextIndex;
                nextIndex = getNextPlayerIndex(room);
            }
            room.currentPlayerIndex = nextIndex;
            result.nextPlayer = room.players[nextIndex]?.id;
        }
    }

    // Verificar fim de rodada
    const alivePlayers = room.players.filter(p => p.alive);
    if (alivePlayers.length <= 1) {
        result.roundOver = true;
        result.winner = alivePlayers[0] || null;
    }

    return result;
}

function processItem(room, playerId, itemId, targetId = null, stealItemIndex = null) {
    const player = room.players.find(p => p.id === playerId);
    if (!player) return null;

    const itemIndex = player.items.findIndex(i => i.id === itemId);
    if (itemIndex === -1) return null;

    const item = player.items[itemIndex];
    player.items.splice(itemIndex, 1);

    // Marcar se jogador zerou itens (não recebe mais itens até próxima rodada)
    if (player.items.length === 0) {
        player.hadZeroItems = true;
    }

    let result = {
        item,
        playerId,
        playerName: player.name
    };

    switch (itemId) {
        case 'magnifying_glass':
            room.revealedShell = room.shells[room.currentShellIndex];
            result.revealedShell = room.revealedShell;
            break;

        case 'beer':
            const ejected = room.shells[room.currentShellIndex];
            room.currentShellIndex++;
            room.revealedShell = null;
            result.ejectedShell = ejected;

            if (room.currentShellIndex >= room.shells.length) {
                loadShotgun(room);

                // CORREÇÃO: Resetar hadZeroItems para todos antes de distribuir
                room.players.forEach(p => p.hadZeroItems = false);

                // REGRA ORIGINAL: 1-5 itens aleatórios no reload
                const itemCount = Math.floor(Math.random() * 5) + 1;
                const maxHp = room.players[0]?.maxHp || 4;
                distributeItems(room, itemCount, maxHp);
                result.reloaded = true;
                result.newShells = {
                    total: room.shells.length,
                    live: room.shells.filter(s => s === 'live').length,
                    blank: room.shells.filter(s => s === 'blank').length
                };
            }
            break;

        case 'cigarettes':
            if (player.hp < player.maxHp) {
                player.hp++;
                result.healed = 1;
            }
            break;

        case 'handcuffs':
            if (targetId) {
                const target = room.players.find(p => p.id === targetId);
                if (target) {
                    // SEMPRE definir targetId e targetName (mesmo quando falha)
                    result.targetId = targetId;
                    result.targetName = target.name;

                    // Verificar se o jogador tem imunidade (foi algemado recentemente)
                    if (target.handcuffImmune) {
                        result.failed = true;
                        result.failReason = 'imune';
                        // Devolver o item
                        player.items.push(item);
                    } else {
                        target.handcuffed = true;
                    }
                }
            }
            break;

        case 'hand_saw':
            player.sawedOff = true;
            break;

        case 'phone':
            const remaining = room.shells.length - room.currentShellIndex;
            if (remaining > 1) {
                const randomOffset = Math.floor(Math.random() * (remaining - 1)) + 1;
                const position = room.currentShellIndex + randomOffset;
                result.revealedPosition = position;
                result.revealedPositionShell = room.shells[position];
                result.relativePosition = randomOffset + 1;
            }
            break;

        case 'inverter':
            const idx = room.currentShellIndex;
            if (idx < room.shells.length) {
                room.shells[idx] = room.shells[idx] === 'live' ? 'blank' : 'live';
                room.revealedShell = null;
                result.inverted = true;
            }
            break;

        case 'adrenaline':
            if (targetId) {
                const target = room.players.find(p => p.id === targetId);
                if (target && target.items.length > 0) {
                    // Usar o índice fornecido ou aleatório como fallback
                    const stolenIndex = (typeof stealItemIndex === 'number' && stealItemIndex >= 0 && stealItemIndex < target.items.length)
                        ? stealItemIndex
                        : Math.floor(Math.random() * target.items.length);
                    const stolen = target.items.splice(stolenIndex, 1)[0];
                    result.stolenItem = stolen;
                    result.targetId = targetId;
                    result.targetName = target.name;

                    // ✅ USAR o item roubado DIRETAMENTE (sem adicionar ao inventário)
                    // Isso evita o bug de ficar com 2 serras se o jogador já tinha uma
                    result.usedItemResult = { item: stolen, playerId, playerName: player.name };

                    // Aplicar efeito do item roubado
                    switch (stolen.id) {
                        case 'magnifying_glass':
                            room.revealedShell = room.shells[room.currentShellIndex];
                            result.usedItemResult.revealedShell = room.revealedShell;
                            break;

                        case 'beer':
                            const ejected = room.shells[room.currentShellIndex];
                            room.currentShellIndex++;
                            room.revealedShell = null;
                            result.usedItemResult.ejectedShell = ejected;
                            if (room.currentShellIndex >= room.shells.length) {
                                loadShotgun(room);
                                room.players.forEach(p => p.hadZeroItems = false);
                                const itemCount = Math.floor(Math.random() * 5) + 1;
                                const maxHp = room.players[0]?.maxHp || 4;
                                distributeItems(room, itemCount, maxHp);
                                result.usedItemResult.reloaded = true;
                                result.usedItemResult.newShells = {
                                    total: room.shells.length,
                                    live: room.shells.filter(s => s === 'live').length,
                                    blank: room.shells.filter(s => s === 'blank').length
                                };
                            }
                            break;

                        case 'cigarettes':
                            if (player.hp < player.maxHp) {
                                player.hp++;
                                result.usedItemResult.healed = 1;
                            }
                            break;

                        case 'handcuffs':
                            // Usar no mesmo alvo da adrenalina
                            if (!target.handcuffImmune && !target.handcuffed) {
                                target.handcuffed = true;
                                result.usedItemResult.targetId = targetId;
                                result.usedItemResult.targetName = target.name;
                            } else {
                                result.usedItemResult.failed = true;
                                result.usedItemResult.failReason = target.handcuffImmune ? 'imune' : 'ja_algemado';
                            }
                            break;

                        case 'hand_saw':
                            player.sawedOff = true;
                            break;

                        case 'phone':
                            const remaining = room.shells.length - room.currentShellIndex;
                            if (remaining > 1) {
                                const randomOffset = Math.floor(Math.random() * (remaining - 1)) + 1;
                                const position = room.currentShellIndex + randomOffset;
                                result.usedItemResult.revealedPosition = position;
                                result.usedItemResult.revealedPositionShell = room.shells[position];
                            }
                            break;

                        case 'inverter':
                            const currentIdx = room.currentShellIndex;
                            room.shells[currentIdx] = room.shells[currentIdx] === 'live' ? 'blank' : 'live';
                            room.revealedShell = null;
                            result.usedItemResult.inverted = true;
                            break;

                        case 'expired_medicine':
                            const medSuccess = Math.random() < 0.5;
                            if (medSuccess) {
                                const healed = Math.min(2, player.maxHp - player.hp);
                                player.hp += healed;
                                result.usedItemResult.healed = healed;
                                result.usedItemResult.success = true;
                            } else {
                                player.hp = Math.max(0, player.hp - 1);
                                result.usedItemResult.damage = 1;
                                result.usedItemResult.success = false;
                                if (player.hp <= 0) {
                                    player.alive = false;
                                    result.usedItemResult.eliminated = true;
                                }
                            }
                            break;

                        case 'turn_reverser':
                            room.turnDirection = room.turnDirection === 1 ? -1 : 1;
                            result.usedItemResult.newDirection = room.turnDirection === 1 ? 'horario' : 'anti-horario';
                            break;
                    }

                    result.shellsRemaining = room.shells.length - room.currentShellIndex;
                }
            }
            break;

        case 'expired_medicine':
            const success = Math.random() < 0.5;
            if (success) {
                const healed = Math.min(2, player.maxHp - player.hp);
                player.hp += healed;
                result.healed = healed;
                result.success = true;
            } else {
                player.hp = Math.max(0, player.hp - 1);
                result.damage = 1;
                result.success = false;
                if (player.hp <= 0) {
                    player.alive = false;
                    result.eliminated = true;
                }
            }
            break;

        case 'turn_reverser':
            room.turnDirection *= -1;
            result.newDirection = room.turnDirection;
            break;
    }

    // Atualizar contagem de shells
    result.shellsRemaining = {
        total: room.shells.length - room.currentShellIndex,
        live: room.shells.slice(room.currentShellIndex).filter(s => s === 'live').length,
        blank: room.shells.slice(room.currentShellIndex).filter(s => s === 'blank').length
    };

    return result;
}

// ========================================
// SOCKET.IO EVENTS
// ========================================

io.on('connection', (socket) => {
    // Obter IP do jogador (funciona com proxy também)
    const playerIP = socket.handshake.headers['x-forwarded-for'] ||
                     socket.handshake.address ||
                     socket.request.connection.remoteAddress ||
                     'IP desconhecido';

    console.log(`[${new Date().toLocaleString('pt-BR')}] Jogador conectado: ${socket.id} | IP: ${playerIP}`);

    // Criar sala
    socket.on('createRoom', (data) => {
        console.log('createRoom recebido:', JSON.stringify(data), 'tipo:', typeof data);

        let playerName, password;

        if (typeof data === 'string') {
            playerName = data;
            password = null;
        } else if (data && typeof data === 'object') {
            // Verificar se playerName existe e é string
            if (typeof data.playerName === 'string' && data.playerName.trim()) {
                playerName = data.playerName.trim();
            } else {
                playerName = `Jogador${Math.floor(Math.random() * 1000)}`;
            }
            password = (typeof data.password === 'string' && data.password.trim()) ? data.password.trim() : null;
        } else {
            playerName = `Jogador${Math.floor(Math.random() * 1000)}`;
            password = null;
        }

        console.log('playerName extraído:', playerName, 'password:', password ? 'sim' : 'não');

        const room = createRoom(socket, playerName, password);
        socket.join(room.code);
        socket.emit('roomCreated', {
            code: room.code,
            players: room.players.map(p => ({
                id: p.id,
                name: p.name,
                alive: p.alive || true
            })),
            isHost: true,
            hasPassword: !!room.password
        });
        console.log(`Sala criada: ${room.code} por ${playerName}${password ? ' (com senha)' : ''}`);
    });

    // Listar salas disponíveis
    socket.on('listRooms', () => {
        const availableRooms = [];
        for (const [code, room] of rooms) {
            if (!room.started) {
                availableRooms.push({
                    code: code,
                    hostName: room.hostName,
                    playerCount: room.players.length,
                    maxPlayers: 4,
                    hasPassword: !!room.password
                });
            }
        }
        socket.emit('roomList', availableRooms);
    });

    // Obter itens de um jogador (para Adrenalina)
    socket.on('getPlayerItems', ({ targetId }) => {
        for (const [code, room] of rooms) {
            if (room.players.find(p => p.id === socket.id) && room.started) {
                const target = room.players.find(p => p.id === targetId);
                if (target && target.items.length > 0) {
                    // Filtrar Adrenalina - não pode roubar Adrenalina com Adrenalina
                    // Filtrar Algemas se não há alvo válido para usar
                    const stealableItems = target.items
                        .map((item, index) => ({ ...item, index }))
                        .filter(item => item.id !== 'adrenaline')
                        .filter(item => {
                            if (item.id === 'handcuffs') {
                                // Verificar se há pelo menos 1 jogador que pode ser algemado
                                const hasValidTarget = room.players.some(p =>
                                    p.id !== socket.id &&  // Não é o jogador atual
                                    p.alive &&              // Está vivo
                                    !p.handcuffed &&        // Não está algemado
                                    !p.handcuffImmune       // Não tem imunidade
                                );
                                return hasValidTarget;
                            }
                            return true;
                        });

                    socket.emit('playerItems', {
                        targetId,
                        targetName: target.name,
                        items: stealableItems
                    });
                } else {
                    socket.emit('playerItems', {
                        targetId,
                        targetName: target?.name || 'Jogador',
                        items: []
                    });
                }
                return;
            }
        }
    });

    // Entrar na sala
    socket.on('joinRoom', ({ code, playerName, password }) => {
        const result = joinRoom(code.toUpperCase(), socket, playerName, password);
        if (result.error) {
            socket.emit('joinError', result.error);
        } else {
            socket.join(code);
            const room = result.room;

            // Notificar todos na sala
            io.to(code).emit('playerJoined', {
                players: room.players.map(p => ({
                    id: p.id,
                    name: p.name,
                    alive: p.alive || true
                })),
                newPlayer: playerName
            });

            // Confirmar para o jogador que entrou
            socket.emit('roomJoined', {
                code: room.code,
                players: room.players.map(p => ({
                    id: p.id,
                    name: p.name,
                    alive: p.alive || true
                })),
                isHost: room.host === socket.id
            });

            console.log(`${playerName} entrou na sala ${code}`);
        }
    });

    // Iniciar jogo (só host)
    socket.on('startGame', () => {
        for (const [code, room] of rooms) {
            if (room.host === socket.id && !room.started) {
                if (room.players.length < 2) {
                    socket.emit('startError', 'Mínimo 2 jogadores para iniciar');
                    return;
                }
                startGame(room);
                console.log(`Jogo iniciado na sala ${code}`);
                return;
            }
        }
    });

    // Atirar
    socket.on('shoot', ({ targetId }) => {
        for (const [code, room] of rooms) {
            const playerIndex = room.players.findIndex(p => p.id === socket.id);
            if (playerIndex !== -1 && room.started) {
                // Verificar se é o turno do jogador
                if (room.players[room.currentPlayerIndex].id !== socket.id) {
                    socket.emit('actionError', 'Não é seu turno');
                    return;
                }

                // Limpar timer do turno atual
                clearTurnTimer(room);

                // Limpar imunidade às algemas quando o jogador faz uma ação
                const currentPlayer = room.players[playerIndex];
                if (currentPlayer.handcuffImmune) {
                    currentPlayer.handcuffImmune = false;
                }

                const result = processShot(room, socket.id, targetId);
                if (result) {
                    io.to(code).emit('shotFired', {
                        ...result,
                        players: room.players.map(p => ({
                            id: p.id,
                            name: p.name,
                            hp: p.hp,
                            maxHp: p.maxHp,
                            items: p.items,
                            alive: p.alive,
                            handcuffed: p.handcuffed,
                            handcuffImmune: p.handcuffImmune || false,
                            sawedOff: p.sawedOff
                        })),
                        shellsRemaining: {
                            total: room.shells.length - room.currentShellIndex,
                            live: room.shells.slice(room.currentShellIndex).filter(s => s === 'live').length,
                            blank: room.shells.slice(room.currentShellIndex).filter(s => s === 'blank').length
                        },
                        turnDirection: room.turnDirection
                    });

                    // Verificar fim de rodada/jogo
                    if (result.roundOver) {
                        if (result.winner) {
                            // Incrementar vitórias do vencedor da rodada
                            const winnerPlayer = room.players.find(p => p.id === result.winner.id);
                            if (winnerPlayer) {
                                winnerPlayer.roundWins = (winnerPlayer.roundWins || 0) + 1;
                            }

                            // Calcular vitórias necessárias (2 para 2-3 jogadores, 2 para 4 jogadores)
                            const winsNeeded = 2;
                            const winnerWins = winnerPlayer?.roundWins || 0;

                            // Verificar se alguém ganhou o jogo (atingiu vitórias necessárias OU é a última rodada)
                            if (winnerWins >= winsNeeded || room.currentRound >= 3) {
                                io.to(code).emit('gameOver', {
                                    winner: result.winner,
                                    reason: `Venceu ${winnerWins} rodada${winnerWins > 1 ? 's' : ''}!`
                                });
                                // Deletar sala após game over (não aparece mais na lista)
                                rooms.delete(code);
                            } else {
                                room.currentRound++;
                                // Próxima rodada começa por quem MORREU primeiro
                                const firstPlayer = room.firstToDie;
                                setTimeout(() => {
                                    startRound(room, firstPlayer);
                                }, 3000);
                            }
                        }
                    } else {
                        // Rodada não acabou - iniciar timer para próximo jogador
                        startTurnTimer(room, code);
                    }
                }
                return;
            }
        }
    });

    // Usar item
    socket.on('useItem', ({ itemId, targetId, itemIndex }) => {
        for (const [code, room] of rooms) {
            const playerIndex = room.players.findIndex(p => p.id === socket.id);
            if (playerIndex !== -1 && room.started) {
                // Verificar se é o turno do jogador
                if (room.players[room.currentPlayerIndex].id !== socket.id) {
                    socket.emit('actionError', 'Não é seu turno');
                    return;
                }

                // Limpar timer do turno atual (usar item reinicia o timer)
                clearTurnTimer(room);

                const result = processItem(room, socket.id, itemId, targetId, itemIndex);
                if (result) {
                    io.to(code).emit('itemUsed', {
                        ...result,
                        players: room.players.map(p => ({
                            id: p.id,
                            name: p.name,
                            hp: p.hp,
                            maxHp: p.maxHp,
                            items: p.items,
                            alive: p.alive,
                            handcuffed: p.handcuffed,
                            handcuffImmune: p.handcuffImmune || false,
                            sawedOff: p.sawedOff
                        })),
                        turnDirection: room.turnDirection
                    });

                    // ✅ CORREÇÃO: Verificar se jogador morreu (ex: remédio vencido)
                    if (result.eliminated) {
                        const alivePlayers = room.players.filter(p => p.alive);
                        if (alivePlayers.length <= 1) {
                            const winner = alivePlayers[0] || null;

                            // Incrementar vitórias do vencedor da rodada
                            if (winner) {
                                winner.roundWins = (winner.roundWins || 0) + 1;
                            }

                            // Calcular vitórias necessárias
                            const winsNeeded = 2;
                            const winnerWins = winner?.roundWins || 0;

                            // Verificar se alguém ganhou o jogo
                            if (winnerWins >= winsNeeded || room.currentRound >= 3) {
                                io.to(code).emit('gameOver', {
                                    winner: winner,
                                    reason: winner
                                        ? `Venceu ${winnerWins} rodada${winnerWins > 1 ? 's' : ''}!`
                                        : 'Todos foram eliminados'
                                });
                                rooms.delete(code);
                            } else {
                                // Próxima rodada
                                room.currentRound++;
                                const firstPlayer = room.firstToDie;
                                setTimeout(() => {
                                    startRound(room, firstPlayer);
                                }, 3000);
                            }
                        } else {
                            // Jogador morreu mas ainda há 2+ jogadores - reiniciar timer
                            startTurnTimer(room, code);
                        }
                    } else {
                        // Jogador usou item e continua vivo - reiniciar timer (mesmo jogador continua)
                        startTurnTimer(room, code);
                    }
                }
                return;
            }
        }
    });

    // Desconexão
    socket.on('disconnect', () => {
        const result = leaveRoom(socket);
        if (result && !result.deleted) {
            io.to(result.code).emit('playerLeft', {
                players: result.room.players.map(p => ({
                    id: p.id,
                    name: p.name,
                    alive: p.alive || true
                }))
            });
        }
        console.log(`[${new Date().toLocaleString('pt-BR')}] Jogador desconectado: ${socket.id} | IP: ${playerIP}`);
    });

    // Sair da sala manualmente
    socket.on('leaveRoom', () => {
        const result = leaveRoom(socket);
        if (result && !result.deleted) {
            socket.leave(result.code);
            io.to(result.code).emit('playerLeft', {
                players: result.room.players.map(p => ({
                    id: p.id,
                    name: p.name,
                    alive: p.alive || true
                }))
            });
        }
        socket.emit('leftRoom');
    });
});

// ========================================
// INICIAR SERVIDOR
// ========================================

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0'; // 0.0.0.0 = aceita conexões de qualquer IP

// Obter IP local para mostrar no console
const os = require('os');
function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return 'localhost';
}

server.listen(PORT, HOST, () => {
    const localIP = getLocalIP();
    console.log(`
╔══════════════════════════════════════════════════╗
║       BUCKSHOT ROULETTE - SERVIDOR               ║
╠══════════════════════════════════════════════════╣
║  Local:    http://localhost:${PORT}                   ║
║  Rede:     http://${localIP}:${PORT}                 ║
║  Multiplayer: 2-4 jogadores                      ║
╠══════════════════════════════════════════════════╣
║  Seus amigos acessam pelo IP da Rede!            ║
╚══════════════════════════════════════════════════╝
    `);
});
