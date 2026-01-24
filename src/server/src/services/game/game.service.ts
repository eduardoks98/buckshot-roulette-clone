// ==========================================
// GAME SERVICE
// ==========================================

import { GAME_RULES, getRandomItem } from '../../../../shared/constants';
import {
  PlayerPublicState,
  Item,
  ItemId,
  ShellInfo,
  TurnDirection,
} from '../../../../shared/types';
import {
  getRandomInRange,
  getRandomHP,
  generateShells,
  getShellCounts,
  calculateDamage,
} from '../../../../shared/utils/gameUtils';

// ==========================================
// TYPES
// ==========================================

// Estatísticas do jogador durante a partida
interface PlayerStats {
  damageDealt: number;
  damageTaken: number;
  selfDamage: number;
  shotsFired: number;
  itemsUsed: number;
  kills: number;
  deaths: number;
}

interface Player {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  items: Item[];
  handcuffed: boolean;
  handcuffImmune: boolean;
  sawedOff: boolean;
  alive: boolean;
  hadZeroItems: boolean;
  roundWins: number;
  disconnected: boolean;
  disconnectTime: number | null;
  reconnectToken: string | null;
  originalSocketId: string | null;
  stats: PlayerStats; // Estatísticas da partida
}

interface Room {
  code: string;
  host: string;
  hostName: string;
  password: string | null;
  players: Player[];
  started: boolean;
  currentRound: number;
  turnDirection: TurnDirection;
  currentPlayerIndex: number;
  shells: ('live' | 'blank')[];
  currentShellIndex: number;
  revealedShell: 'live' | 'blank' | null;
  turnTimeout: NodeJS.Timeout | null;
  turnStartTime: number | null;
  firstToDie: number | null;
}

interface RoundStartResult {
  round: number;
  maxHp: number;
  players: PlayerPublicState[];
  currentPlayer: string;
  shells: ShellInfo;
  turnDirection: TurnDirection;
  itemsReceived: Item[];
}

interface ShotResult {
  shell: 'live' | 'blank';
  shooter: string;
  shooterName: string;
  target: string;
  targetName: string;
  damage: number;
  sawedOff: boolean;
  targetSelf: boolean;
  players: PlayerPublicState[];
  shellsRemaining: ShellInfo;
  nextPlayer?: string;
  roundOver: boolean;
  winner?: PlayerPublicState;
  reloaded?: boolean;
  newShells?: ShellInfo;
  itemsDistributed?: { playerId: string; items: Item[] }[]; // Itens distribuídos no reload
}

interface ItemResult {
  success: boolean;
  itemId: ItemId;
  playerId: string;
  playerName: string;
  message?: string;
  revealedShell?: 'live' | 'blank';
  ejectedShell?: 'live' | 'blank';
  healedAmount?: number;
  damagedAmount?: number;
  targetId?: string;
  targetName?: string;
  stolenItem?: Item;
  phonePosition?: number;
  phoneShell?: 'live' | 'blank';
  inverted?: boolean;
  directionChanged?: boolean;
  newDirection?: TurnDirection;
  failed?: boolean;
  failReason?: string;
  eliminated?: boolean;
  reloaded?: boolean;
  newShells?: ShellInfo;
  usedImmediately?: boolean; // Adrenalina - item roubado foi usado imediatamente
  players: PlayerPublicState[];
  shellsRemaining: ShellInfo;
}

interface ReloadResult {
  shells: ShellInfo;
  itemsDistributed: { playerId: string; items: Item[] }[];
}

// ==========================================
// GAME SERVICE CLASS
// ==========================================

export class GameService {
  // ==========================================
  // ROUND MANAGEMENT
  // ==========================================

  startRound(room: Room): RoundStartResult {
    // Determine HP for this round (usando shared/utils/gameUtils)
    const maxHp = getRandomHP();

    // Reset all players
    room.players.forEach(player => {
      player.hp = maxHp;
      player.maxHp = maxHp;
      player.alive = true;
      player.handcuffed = false;
      player.handcuffImmune = false;
      player.sawedOff = false;
      player.items = [];
      player.hadZeroItems = false;

      // Inicializar estatísticas apenas no round 1
      if (room.currentRound === 1) {
        player.stats = {
          damageDealt: 0,
          damageTaken: 0,
          selfDamage: 0,
          shotsFired: 0,
          itemsUsed: 0,
          kills: 0,
          deaths: 0,
        };
      }
    });

    // Load shells
    this.loadShells(room);

    // Distribute initial items
    const itemsDistributed = this.distributeItems(room);

    // Set first player - aleatório no round 1, quem morreu primeiro nos rounds seguintes
    if (room.currentRound === 1) {
      // Round 1: jogador inicial aleatório
      room.currentPlayerIndex = Math.floor(Math.random() * room.players.length);
    } else if (room.firstToDie !== null) {
      // Rounds 2+: quem morreu primeiro no round anterior começa
      room.currentPlayerIndex = room.firstToDie;
    }
    // Se firstToDie é null (todos morreram ao mesmo tempo), mantém o índice atual
    room.revealedShell = null;
    room.firstToDie = null;

    // Get shell counts
    const shellCounts = this.getShellCountsForRoom(room);

    return {
      round: room.currentRound,
      maxHp,
      players: room.players.map(p => this.toPublicPlayer(p)),
      currentPlayer: room.players[room.currentPlayerIndex].id,
      shells: shellCounts,
      turnDirection: room.turnDirection,
      itemsReceived: itemsDistributed[0]?.items || [],
    };
  }

  private loadShells(room: Room): void {
    // Usando generateShells de shared/utils/gameUtils
    room.shells = generateShells();
    room.currentShellIndex = 0;
  }

  private distributeItems(room: Room): { playerId: string; items: Item[] }[] {
    const distribution: { playerId: string; items: Item[] }[] = [];

    // REGRA OFICIAL: Todos os jogadores recebem a MESMA quantidade de itens
    // A quantidade é aleatória, mas igual para todos (usando shared/utils/gameUtils)
    const itemCount = getRandomInRange(
      GAME_RULES.ITEMS.PER_RELOAD.MIN,
      GAME_RULES.ITEMS.PER_RELOAD.MAX
    );

    // REGRA OFICIAL: Serra (hand_saw) NÃO aparece quando HP máximo é 2
    // Porque dano dobrado (2) mataria instantaneamente com 2 HP
    const maxHp = room.players[0]?.maxHp || 4;
    const excludeIds: ItemId[] = maxHp <= 2 ? ['hand_saw'] : [];

    room.players.forEach(player => {
      if (!player.alive) return;

      const newItems: Item[] = [];

      for (let i = 0; i < itemCount; i++) {
        if (player.items.length >= GAME_RULES.ITEMS.MAX_PER_PLAYER) break;

        const item = getRandomItem(excludeIds);
        player.items.push(item);
        newItems.push(item);
      }

      distribution.push({ playerId: player.id, items: newItems });
    });

    return distribution;
  }

  // ==========================================
  // SHOOTING
  // ==========================================

  processShot(
    room: Room,
    shooterId: string,
    targetId: string
  ): ShotResult | { error: string } {
    const shooter = room.players.find(p => p.id === shooterId);
    const target = room.players.find(p => p.id === targetId);

    if (!shooter || !target) {
      return { error: 'Jogador nao encontrado' };
    }

    if (!shooter.alive) {
      return { error: 'Voce esta eliminado' };
    }

    if (!target.alive) {
      return { error: 'Alvo ja eliminado' };
    }

    if (room.players[room.currentPlayerIndex].id !== shooterId) {
      return { error: 'Nao e seu turno' };
    }

    // Get current shell
    const shell = room.shells[room.currentShellIndex];
    room.currentShellIndex++;

    // Clear revealed shell
    room.revealedShell = null;

    // Calculate damage (usando calculateDamage de shared/utils/gameUtils)
    const sawedOff = shooter.sawedOff;
    const damage = calculateDamage(shell, sawedOff);

    // Apply damage
    target.hp -= damage;

    // ========== TRACK STATS ==========
    shooter.stats.shotsFired++;

    if (shell === 'live' && damage > 0) {
      shooter.stats.damageDealt += damage;
      target.stats.damageTaken += damage;

      // Self damage
      if (shooterId === targetId) {
        shooter.stats.selfDamage += damage;
      }
    }

    if (target.hp <= 0) {
      target.hp = 0;
      target.alive = false;
      target.stats.deaths++;

      // Kill tracking (only if not self)
      if (shooterId !== targetId) {
        shooter.stats.kills++;
      }

      // Track first to die for turn order
      if (room.firstToDie === null) {
        room.firstToDie = room.players.findIndex(p => p.id === targetId);
      }
    }
    // ========== END TRACK STATS ==========

    // Reset sawed off
    shooter.sawedOff = false;

    // Check round end
    const roundCheck = this.checkRoundEnd(room);
    let winner: PlayerPublicState | undefined;
    if (roundCheck.ended && roundCheck.winnerId) {
      const winnerPlayer = room.players.find(p => p.id === roundCheck.winnerId);
      if (winnerPlayer) {
        winner = this.toPublicPlayer(winnerPlayer);
      }
    }

    // Check if need to reload
    let reloaded = false;
    let newShells: ShellInfo | undefined;
    let itemsDistributed: { playerId: string; items: Item[] }[] | undefined;
    if (this.shouldReload(room) && !roundCheck.ended) {
      const reloadResult = this.reloadShells(room);
      reloaded = true;
      newShells = reloadResult.shells;
      itemsDistributed = reloadResult.itemsDistributed;
    }

    const result: ShotResult = {
      shell,
      shooter: shooterId,
      shooterName: shooter.name,
      target: targetId,
      targetName: target.name,
      damage,
      sawedOff,
      targetSelf: shooterId === targetId,
      players: room.players.map(p => this.toPublicPlayer(p)),
      shellsRemaining: this.getShellCountsForRoom(room),
      roundOver: roundCheck.ended,
      winner,
      reloaded,
      newShells,
      itemsDistributed,
    };

    return result;
  }

  // ==========================================
  // ITEMS
  // ==========================================

  processItem(
    room: Room,
    userId: string,
    itemId: ItemId,
    targetId?: string,
    itemIndex?: number
  ): ItemResult | { error: string } {
    const user = room.players.find(p => p.id === userId);
    if (!user || !user.alive) {
      return { error: 'Jogador nao encontrado ou eliminado' };
    }

    if (room.players[room.currentPlayerIndex].id !== userId) {
      return { error: 'Nao e seu turno' };
    }

    // Find item in inventory by itemId (ignore itemIndex to avoid desync issues)
    const idx = user.items.findIndex(i => i.id === itemId);

    if (idx === -1) {
      return { error: 'Item nao encontrado' };
    }

    const item = user.items[idx];

    // Base result
    const baseResult: Partial<ItemResult> = {
      success: true,
      itemId,
      playerId: userId,
      playerName: user.name,
    };

    // Process item effect
    switch (itemId) {
      case 'magnifying_glass': {
        const currentShell = room.shells[room.currentShellIndex];
        room.revealedShell = currentShell;
        baseResult.revealedShell = currentShell;
        baseResult.message = `Cartucho atual: ${currentShell === 'live' ? 'LIVE' : 'BLANK'}`;
        break;
      }

      case 'beer': {
        // Verificar se há cartuchos para ejetar
        if (room.currentShellIndex >= room.shells.length) {
          return { error: 'Nao ha cartuchos para ejetar!' };
        }
        const ejectedShell = room.shells[room.currentShellIndex];
        room.currentShellIndex++;
        room.revealedShell = null;
        baseResult.ejectedShell = ejectedShell;
        baseResult.message = `Cartucho ejetado: ${ejectedShell === 'live' ? 'LIVE' : 'BLANK'}`;
        break;
      }

      case 'cigarettes': {
        if (user.hp < user.maxHp) {
          user.hp++;
          baseResult.healedAmount = 1;
          baseResult.message = `Recuperou 1 HP`;
        } else {
          baseResult.message = `HP ja esta no maximo`;
        }
        break;
      }

      case 'handcuffs': {
        if (!targetId) {
          return { error: 'Selecione um alvo' };
        }
        const target = room.players.find(p => p.id === targetId);
        if (!target || !target.alive || target.id === userId) {
          return { error: 'Alvo invalido' };
        }
        // Não pode algemar quem já está algemado
        if (target.handcuffed) {
          return { error: 'Alvo ja esta algemado!' };
        }
        if (target.handcuffImmune) {
          return { error: 'Alvo imune a algemas' };
        }
        target.handcuffed = true;
        target.handcuffImmune = true;
        baseResult.targetId = targetId;
        baseResult.targetName = target.name;
        baseResult.message = `${target.name} foi algemado!`;
        break;
      }

      case 'hand_saw': {
        // Não pode usar se já está serrado
        if (user.sawedOff) {
          return { error: 'Cano ja esta serrado!' };
        }
        user.sawedOff = true;
        baseResult.message = `Proximo tiro causa dano dobrado!`;
        break;
      }

      case 'phone': {
        // Revelar qualquer posição do pente COMPLETO (1 a N), incluindo já disparadas
        // Comportamento igual ao jogo original Buckshot Roulette
        const totalShells = room.shells.length;
        const randomPosition = Math.floor(Math.random() * totalShells); // 0-indexed
        const shellAtPosition = room.shells[randomPosition];
        const displayPosition = randomPosition + 1; // 1-indexed para display

        baseResult.phonePosition = displayPosition;
        baseResult.phoneShell = shellAtPosition;
        const shellType = shellAtPosition === 'live' ? '🔴 LIVE' : '🔵 BLANK';

        // Indicar se já foi disparada ou se é a atual/futura
        const alreadyFired = randomPosition < room.currentShellIndex;
        const statusHint = alreadyFired ? ' (já disparada)' : '';

        baseResult.message = `Cartucho #${displayPosition}: ${shellType}${statusHint}`;
        break;
      }

      case 'inverter': {
        if (room.currentShellIndex < room.shells.length) {
          const current = room.shells[room.currentShellIndex];
          room.shells[room.currentShellIndex] = current === 'live' ? 'blank' : 'live';
          room.revealedShell = null;
          baseResult.inverted = true;
          baseResult.message = `Cartucho invertido!`;
        }
        break;
      }

      case 'adrenaline': {
        if (!targetId) {
          return { error: 'Selecione um alvo' };
        }
        const target = room.players.find(p => p.id === targetId);
        if (!target || !target.alive || target.id === userId) {
          return { error: 'Alvo invalido' };
        }
        if (target.items.length === 0) {
          return { error: 'Alvo nao tem itens' };
        }

        // itemIndex deve ser fornecido para completar o roubo
        if (itemIndex === undefined || itemIndex < 0 || itemIndex >= target.items.length) {
          return { error: 'Selecione um item valido para roubar' };
        }

        // NAO pode roubar outra Adrenalina (regra oficial)
        const itemToSteal = target.items[itemIndex];
        if (itemToSteal.id === 'adrenaline') {
          return { error: 'Nao pode roubar outra Adrenalina!' };
        }

        // Roubar o item do alvo
        const stolenItem = target.items.splice(itemIndex, 1)[0];

        // Adicionar temporariamente ao inventario para poder usar
        user.items.push(stolenItem);

        baseResult.targetId = targetId;
        baseResult.targetName = target.name;
        baseResult.stolenItem = stolenItem;
        baseResult.message = `Roubou ${stolenItem.emoji} ${stolenItem.name} de ${target.name}!`;

        // USAR O ITEM IMEDIATAMENTE (regra oficial)
        // O item roubado sera processado e o resultado combinado
        baseResult.usedImmediately = true;
        break;
      }

      case 'expired_medicine': {
        const success = Math.random() >= 0.5;
        if (success) {
          const healed = Math.min(2, user.maxHp - user.hp);
          user.hp += healed;
          baseResult.healedAmount = healed;
          baseResult.message = `Remedio funcionou! +${healed} HP`;
        } else {
          user.hp--;
          baseResult.damagedAmount = 1;
          baseResult.failed = true;
          baseResult.failReason = 'Remedio vencido causou dano!';
          if (user.hp <= 0) {
            user.hp = 0;
            user.alive = false;
            baseResult.eliminated = true;
          }
          baseResult.message = `Remedio vencido! -1 HP`;
        }
        break;
      }

      case 'turn_reverser': {
        room.turnDirection = (room.turnDirection * -1) as TurnDirection;
        baseResult.directionChanged = true;
        baseResult.newDirection = room.turnDirection;
        baseResult.message = `Direcao dos turnos invertida!`;
        break;
      }

      default:
        return { error: 'Item desconhecido' };
    }

    // Remove item from inventory
    user.items.splice(idx, 1);

    // Track item usage
    user.stats.itemsUsed++;

    // Check if need to reload
    if (this.shouldReload(room)) {
      const reloadResult = this.reloadShells(room);
      baseResult.reloaded = true;
      baseResult.newShells = reloadResult.shells;
    }

    return {
      ...baseResult,
      players: room.players.map(p => this.toPublicPlayer(p)),
      shellsRemaining: this.getShellCountsForRoom(room),
    } as ItemResult;
  }

  // ==========================================
  // TURN MANAGEMENT
  // ==========================================

  advanceTurn(room: Room, shotSelf: boolean, wasBlank: boolean): string {
    const currentPlayer = room.players[room.currentPlayerIndex];

    // If shot self with blank, keep turn
    if (shotSelf && wasBlank) {
      return currentPlayer.id;
    }

    // Jogador atual completou seu turno - remover imunidade e algemas
    currentPlayer.handcuffed = false;
    currentPlayer.handcuffImmune = false;

    // Find next alive player
    let nextIndex = room.currentPlayerIndex;
    let attempts = 0;
    const maxAttempts = room.players.length;

    do {
      nextIndex = (nextIndex + room.turnDirection + room.players.length) % room.players.length;
      attempts++;
    } while (
      (!room.players[nextIndex].alive || room.players[nextIndex].disconnected) &&
      attempts < maxAttempts
    );

    // Check if next player is handcuffed
    const nextPlayer = room.players[nextIndex];
    if (nextPlayer.handcuffed) {
      nextPlayer.handcuffed = false;
      // NÃO resetar handcuffImmune aqui! O jogador ainda está imune até jogar um turno real.
      // Isso impede que ele seja algemado novamente imediatamente.

      // Skip to next
      do {
        nextIndex = (nextIndex + room.turnDirection + room.players.length) % room.players.length;
        attempts++;
      } while (
        (!room.players[nextIndex].alive || room.players[nextIndex].disconnected) &&
        attempts < maxAttempts
      );
    }

    room.currentPlayerIndex = nextIndex;
    return room.players[nextIndex].id;
  }

  shouldReload(room: Room): boolean {
    return room.currentShellIndex >= room.shells.length;
  }

  reloadShells(room: Room): ReloadResult {
    this.loadShells(room);
    const itemsDistributed = this.distributeItems(room);

    return {
      shells: this.getShellCountsForRoom(room),
      itemsDistributed,
    };
  }

  // ==========================================
  // GAME STATE CHECKS
  // ==========================================

  checkRoundEnd(room: Room): { ended: boolean; winnerId?: string } {
    const alivePlayers = room.players.filter(p => p.alive && !p.disconnected);

    if (alivePlayers.length <= 1) {
      const winner = alivePlayers[0];
      if (winner) {
        winner.roundWins++;
        return { ended: true, winnerId: winner.id };
      }
      return { ended: true };
    }

    return { ended: false };
  }

  checkGameEnd(room: Room): { ended: boolean; winnerId?: string } {
    // Jogo só termina quando todos os rounds forem jogados
    if (room.currentRound < GAME_RULES.MAX_ROUNDS) {
      return { ended: false };
    }

    // Após 3 rounds, determinar vencedor pelo maior número de vitórias
    const sortedPlayers = [...room.players].sort((a, b) => b.roundWins - a.roundWins);
    const winner = sortedPlayers[0];

    return { ended: true, winnerId: winner.id };
  }

  // ==========================================
  // HELPERS
  // ==========================================

  toPublicPlayer(player: Player): PlayerPublicState {
    return {
      id: player.id,
      name: player.name,
      hp: player.hp,
      maxHp: player.maxHp,
      items: player.items,
      alive: player.alive,
      handcuffed: player.handcuffed,
      handcuffImmune: player.handcuffImmune,
      sawedOff: player.sawedOff,
      disconnected: player.disconnected,
      roundWins: player.roundWins,
    };
  }

  private getShellCountsForRoom(room: Room): ShellInfo {
    // Usando getShellCounts de shared/utils/gameUtils
    return getShellCounts(room.shells, room.currentShellIndex);
  }

  // NOTA: As funções utilitárias (getRandomHP, getRandomInRange, shuffle)
  // foram movidas para shared/utils/gameUtils e são importadas diretamente
}
