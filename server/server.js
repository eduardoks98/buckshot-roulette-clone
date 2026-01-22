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

function generateRoomCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

function createRoom(hostSocket, hostName) {
    let code = generateRoomCode();
    while (rooms.has(code)) {
        code = generateRoomCode();
    }

    const room = {
        code,
        host: hostSocket.id,
        players: [{
            id: hostSocket.id,
            name: hostName,
            hp: 0,
            maxHp: 0,
            items: [],
            handcuffed: false,
            sawedOff: false,
            alive: true
        }],
        gameState: null,
        started: false,
        currentRound: 1,
        turnDirection: 1, // 1 = horário, -1 = anti-horário
        currentPlayerIndex: 0
    };

    rooms.set(code, room);
    return room;
}

function joinRoom(code, socket, playerName) {
    const room = rooms.get(code);
    if (!room) return { error: 'Sala não encontrada' };
    if (room.started) return { error: 'Jogo já iniciado' };
    if (room.players.length >= 4) return { error: 'Sala cheia (máx. 4 jogadores)' };
    if (room.players.find(p => p.id === socket.id)) return { error: 'Já está na sala' };

    room.players.push({
        id: socket.id,
        name: playerName,
        hp: 0,
        maxHp: 0,
        items: [],
        handcuffed: false,
        sawedOff: false,
        alive: true
    });

    return { room };
}

function leaveRoom(socket) {
    for (const [code, room] of rooms) {
        const playerIndex = room.players.findIndex(p => p.id === socket.id);
        if (playerIndex !== -1) {
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
                    room.started = false;
                }
            }

            return { code, room };
        }
    }
    return null;
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

function startRound(room) {
    // HP aleatório (2-4)
    const maxHp = Math.floor(Math.random() * 3) + 2;

    // Resetar jogadores
    room.players.forEach(player => {
        player.hp = maxHp;
        player.maxHp = maxHp;
        player.items = [];
        player.handcuffed = false;
        player.sawedOff = false;
        player.alive = true;
    });

    // Carregar espingarda
    loadShotgun(room);

    // Distribuir itens
    const itemCount = room.currentRound === 1 ? 2 : (room.currentRound === 2 ? 3 : 4);
    distributeItems(room, itemCount);

    room.currentPlayerIndex = 0;
    room.revealedPositions = [];

    io.to(room.code).emit('roundStarted', {
        round: room.currentRound,
        maxHp,
        players: room.players.map(p => ({
            id: p.id,
            name: p.name,
            hp: p.hp,
            maxHp: p.maxHp,
            items: p.items,
            alive: p.alive
        })),
        shells: {
            total: room.shells.length,
            live: room.shells.filter(s => s === 'live').length,
            blank: room.shells.filter(s => s === 'blank').length
        },
        currentPlayer: room.players[0].id,
        turnDirection: room.turnDirection
    });
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

function distributeItems(room, count) {
    room.players.forEach(player => {
        for (let i = 0; i < count; i++) {
            if (player.items.length < 8) {
                const item = { ...ITEMS[Math.floor(Math.random() * ITEMS.length)] };
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
        }
    }

    // Limpar revelação
    room.revealedShell = null;

    // Verificar se precisa recarregar
    if (room.currentShellIndex >= room.shells.length) {
        loadShotgun(room);
        const itemCount = room.currentRound === 1 ? 2 : (room.currentRound === 2 ? 3 : 4);
        distributeItems(room, itemCount);
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

function processItem(room, playerId, itemId, targetId = null) {
    const player = room.players.find(p => p.id === playerId);
    if (!player) return null;

    const itemIndex = player.items.findIndex(i => i.id === itemId);
    if (itemIndex === -1) return null;

    const item = player.items[itemIndex];
    player.items.splice(itemIndex, 1);

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
                result.reloaded = true;
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
                    target.handcuffed = true;
                    result.targetId = targetId;
                    result.targetName = target.name;
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
                    const stolenIndex = Math.floor(Math.random() * target.items.length);
                    const stolen = target.items.splice(stolenIndex, 1)[0];
                    result.stolenItem = stolen;
                    result.targetId = targetId;
                    result.targetName = target.name;
                    // Usar item roubado imediatamente seria processado separadamente
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
    console.log(`Jogador conectado: ${socket.id}`);

    // Criar sala
    socket.on('createRoom', (playerName) => {
        const room = createRoom(socket, playerName);
        socket.join(room.code);
        socket.emit('roomCreated', {
            code: room.code,
            players: room.players.map(p => ({ id: p.id, name: p.name })),
            isHost: true
        });
        console.log(`Sala criada: ${room.code} por ${playerName}`);
    });

    // Entrar na sala
    socket.on('joinRoom', ({ code, playerName }) => {
        const result = joinRoom(code.toUpperCase(), socket, playerName);
        if (result.error) {
            socket.emit('joinError', result.error);
        } else {
            socket.join(code);
            const room = result.room;

            // Notificar todos na sala
            io.to(code).emit('playerJoined', {
                players: room.players.map(p => ({ id: p.id, name: p.name })),
                newPlayer: playerName
            });

            // Confirmar para o jogador que entrou
            socket.emit('roomJoined', {
                code: room.code,
                players: room.players.map(p => ({ id: p.id, name: p.name })),
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
                            // Verificar se foi a última rodada
                            if (room.currentRound >= 3) {
                                io.to(code).emit('gameOver', {
                                    winner: result.winner,
                                    reason: 'Venceu 3 rodadas'
                                });
                                room.started = false;
                            } else {
                                room.currentRound++;
                                setTimeout(() => {
                                    startRound(room);
                                }, 3000);
                            }
                        }
                    }
                }
                return;
            }
        }
    });

    // Usar item
    socket.on('useItem', ({ itemId, targetId }) => {
        for (const [code, room] of rooms) {
            const playerIndex = room.players.findIndex(p => p.id === socket.id);
            if (playerIndex !== -1 && room.started) {
                // Verificar se é o turno do jogador
                if (room.players[room.currentPlayerIndex].id !== socket.id) {
                    socket.emit('actionError', 'Não é seu turno');
                    return;
                }

                const result = processItem(room, socket.id, itemId, targetId);
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
                            sawedOff: p.sawedOff
                        })),
                        turnDirection: room.turnDirection
                    });
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
                players: result.room.players.map(p => ({ id: p.id, name: p.name }))
            });
        }
        console.log(`Jogador desconectado: ${socket.id}`);
    });

    // Sair da sala manualmente
    socket.on('leaveRoom', () => {
        const result = leaveRoom(socket);
        if (result && !result.deleted) {
            socket.leave(result.code);
            io.to(result.code).emit('playerLeft', {
                players: result.room.players.map(p => ({ id: p.id, name: p.name }))
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
