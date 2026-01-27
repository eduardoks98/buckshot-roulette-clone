// ==========================================
// BOT SERVICE - AI Players for Testing
// Development Mode Only
// ==========================================

import { TypedIOServer } from '../../socket';
import { RoomService, Player, Room } from '../game/room.service';
import { GameService } from '../game/game.service';
import { startTurnTimer } from '../../socket/game.handler';
import { ItemId, Item } from '../../../../shared/types';
import { GAME_RULES } from '../../../../shared/constants';
import { logger, LOG_CATEGORIES } from '../logger.service';

// ==========================================
// OVERLAY TIMING CONSTANTS
// Estes valores devem corresponder aos tempos de overlay no cliente
// ==========================================
const OVERLAY_DURATIONS = {
  SHOT_RESULT: 3000,       // Tempo que o overlay de resultado do tiro fica visível
  ITEM_ACTION: 2500,       // Tempo que o overlay de ação de item fica visível
  ROUND_ANNOUNCEMENT: 3000, // Tempo do anúncio de rodada
  BUFFER: 500,             // Buffer extra para garantir que o overlay fechou
};

// ==========================================
// TYPES
// ==========================================

export type BotDifficulty = 'easy' | 'medium' | 'hard';

interface BotPlayer {
  id: string;
  name: string;
  difficulty: BotDifficulty;
  roomCode: string;
}

interface BotAction {
  type: 'shoot' | 'useItem';
  targetId?: string;
  itemId?: ItemId;
  itemIndex?: number;
  stolenItemIndex?: number;  // Índice do item a roubar do alvo (para Adrenaline)
}

// ==========================================
// BOT SERVICE CLASS
// ==========================================

class BotService {
  private bots: Map<string, BotPlayer> = new Map();
  private turnTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private gameService: GameService;

  constructor() {
    this.gameService = new GameService();
  }

  // ==========================================
  // BOT MANAGEMENT
  // ==========================================

  /**
   * Verifica se o ambiente é de desenvolvimento
   */
  private isDevelopment(): boolean {
    return process.env.NODE_ENV !== 'production';
  }

  /**
   * Gera um ID único para o bot
   */
  private generateBotId(botName: string): string {
    return `BOT_${botName}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  /**
   * Adiciona um bot à sala
   */
  addBotToRoom(
    io: TypedIOServer,
    roomService: RoomService,
    roomCode: string,
    botName: string,
    difficulty: BotDifficulty = 'medium'
  ): { success: boolean; error?: string; bot?: Player } {
    // Verificar modo de desenvolvimento
    if (!this.isDevelopment()) {
      return { success: false, error: 'Bots disponíveis apenas em modo de desenvolvimento' };
    }

    // Buscar sala
    const room = roomService.getRoom(roomCode);
    if (!room) {
      return { success: false, error: 'Sala não encontrada' };
    }

    // Verificar se jogo já começou
    if (room.started) {
      return { success: false, error: 'Jogo já iniciado' };
    }

    // Verificar limite de jogadores
    if (room.players.length >= GAME_RULES.MAX_PLAYERS) {
      return { success: false, error: 'Sala cheia' };
    }

    // Criar bot player
    const botId = this.generateBotId(botName);
    const displayName = `[BOT] ${botName}`;
    const initialHp = GAME_RULES.HP.MAX;

    const bot: Player = {
      id: botId,
      name: displayName,
      hp: initialHp,
      maxHp: initialHp,
      items: [],
      handcuffed: false,
      handcuffImmune: false,
      sawedOff: false,
      alive: true,
      hadZeroItems: false,
      roundWins: 0,
      disconnected: false,
      disconnectTime: null,
      reconnectToken: null,
      originalSocketId: null,
      odUserId: null, // Bots não têm conta
      stats: {
        damageDealt: 0,
        damageTaken: 0,
        selfDamage: 0,
        shotsFired: 0,
        itemsUsed: 0,
        kills: 0,
        deaths: 0,
        sawedShots: 0,
        liveHits: 0,
        expiredMedicineSurvived: 0,
        adrenalineUses: 0,
        handcuffUses: 0,
        infoItemUses: 0,
        itemsUsedBitmask: 0,
        firstBloodInGame: false,
        turnsAt1Hp: 0,
        maxConsecutiveTurnsAt1Hp: 0,
        killsPerRound: [],
        roundsSurvivedAsLast: 0,
        wonRoundWithZeroShots: false,
        wonRoundWithZeroItems: false,
        finalHp: 0,
        uniqueItemsUsedInGame: 0,
        adrenalineUsesInGame: 0,
        expiredMedicineSurvivedInGame: 0,
        liveHitsInGame: 0,
        allShotsLiveInGame: true,
        lostEarlyRounds: false,
        shotsInCurrentRound: 0,
        itemsInCurrentRound: 0,
        killsInCurrentRound: 0,
      },
    };

    // Adicionar à sala
    room.players.push(bot);

    // Registrar bot
    this.bots.set(botId, {
      id: botId,
      name: displayName,
      difficulty,
      roomCode,
    });

    // Broadcast para a sala (WaitingRoom format - simplified)
    const waitingRoomPlayers = room.players.map(p => ({
      id: p.id,
      name: p.name,
      isHost: p.id === room.host,
    }));

    // Emit playerJoined com formato de WaitingRoom
    io.to(roomCode).emit('playerJoined', {
      players: waitingRoomPlayers as never, // WaitingRoom usa formato simplificado
      newPlayer: displayName,
    });

    logger.info(LOG_CATEGORIES.ROOM, `Bot adicionado: ${displayName}`, {
      roomCode,
      botId,
      difficulty,
      playerCount: room.players.length,
    });

    return { success: true, bot };
  }

  /**
   * Remove um bot da sala
   */
  removeBotFromRoom(
    io: TypedIOServer,
    roomService: RoomService,
    roomCode: string,
    botId: string
  ): { success: boolean; error?: string } {
    const room = roomService.getRoom(roomCode);
    if (!room) {
      return { success: false, error: 'Sala não encontrada' };
    }

    const botIndex = room.players.findIndex(p => p.id === botId);
    if (botIndex === -1) {
      return { success: false, error: 'Bot não encontrado' };
    }

    const botName = room.players[botIndex].name;
    room.players.splice(botIndex, 1);
    this.bots.delete(botId);

    // Limpar timeout se existir
    const timeout = this.turnTimeouts.get(botId);
    if (timeout) {
      clearTimeout(timeout);
      this.turnTimeouts.delete(botId);
    }

    // Broadcast (WaitingRoom format)
    const waitingRoomPlayers = room.players.map(p => ({
      id: p.id,
      name: p.name,
      isHost: p.id === room.host,
    }));

    io.to(roomCode).emit('playerLeft', {
      players: waitingRoomPlayers as never, // WaitingRoom usa formato simplificado
    });

    logger.info(LOG_CATEGORIES.ROOM, `Bot removido: ${botName}`, {
      roomCode,
      botId,
    });

    return { success: true };
  }

  /**
   * Verifica se um player é bot
   */
  isBot(playerId: string): boolean {
    return playerId.startsWith('BOT_') || this.bots.has(playerId);
  }

  /**
   * Obtém dados do bot
   */
  getBot(botId: string): BotPlayer | undefined {
    return this.bots.get(botId);
  }

  // ==========================================
  // BOT AI LOGIC
  // ==========================================

  /**
   * Agenda a jogada do bot quando for seu turno
   * @param initialDelay - Delay adicional antes do "pensamento" (para aguardar overlays)
   */
  scheduleBotTurn(
    io: TypedIOServer,
    room: Room,
    roomCode: string,
    roomService: RoomService,
    initialDelay: number = 0
  ): void {
    const currentPlayer = room.players[room.currentPlayerIndex];
    if (!currentPlayer || !this.isBot(currentPlayer.id)) {
      return;
    }

    // Limpar timeout anterior
    const existingTimeout = this.turnTimeouts.get(currentPlayer.id);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Agendar jogada com delay aleatório (simula "pensamento")
    // O delay total é: initialDelay (overlay) + thinkingDelay (pensamento)
    const bot = this.bots.get(currentPlayer.id);
    const thinkingDelay = this.getThinkingDelay(bot?.difficulty || 'medium');
    const totalDelay = initialDelay + thinkingDelay;

    const timeout = setTimeout(() => {
      this.makeBotMove(io, room, roomCode, roomService);
    }, totalDelay);

    this.turnTimeouts.set(currentPlayer.id, timeout);

    logger.debug(LOG_CATEGORIES.GAME, `Bot turno agendado: ${currentPlayer.name}`, {
      roomCode,
      botId: currentPlayer.id,
      initialDelay,
      thinkingDelay,
      totalDelay,
    });
  }

  /**
   * Executa a jogada do bot
   */
  private makeBotMove(
    io: TypedIOServer,
    room: Room,
    roomCode: string,
    roomService: RoomService
  ): void {
    const currentPlayer = room.players[room.currentPlayerIndex];
    if (!currentPlayer || !currentPlayer.alive) {
      logger.warn(LOG_CATEGORIES.GAME, 'Bot makeBotMove: jogador inválido ou morto', {
        roomCode,
        currentPlayerIndex: room.currentPlayerIndex,
        currentPlayer: currentPlayer?.name,
        alive: currentPlayer?.alive,
      });
      return;
    }

    const bot = this.bots.get(currentPlayer.id);
    if (!bot) {
      logger.warn(LOG_CATEGORIES.GAME, 'Bot makeBotMove: bot não encontrado no Map', {
        roomCode,
        playerId: currentPlayer.id,
        playerName: currentPlayer.name,
        registeredBots: Array.from(this.bots.keys()),
      });
      return;
    }

    logger.info(LOG_CATEGORIES.GAME, `Bot ${currentPlayer.name} iniciando jogada`, {
      roomCode,
      botId: currentPlayer.id,
      difficulty: bot.difficulty,
    });

    // Decidir ação
    const action = this.decideAction(room, currentPlayer, bot.difficulty);

    logger.info(LOG_CATEGORIES.GAME, `Bot ação: ${currentPlayer.name}`, {
      roomCode,
      botId: currentPlayer.id,
      action: action.type,
      targetId: action.targetId,
      itemId: action.itemId,
    });

    // Executar ação
    if (action.type === 'useItem' && action.itemId !== undefined && action.itemIndex !== undefined) {
      this.executeBotItem(io, room, roomCode, currentPlayer, action, roomService);
    } else {
      this.executeBotShoot(io, room, roomCode, currentPlayer, action, roomService);
    }
  }

  /**
   * Decide a ação do bot baseado na dificuldade
   */
  private decideAction(room: Room, bot: Player, difficulty: BotDifficulty): BotAction {
    // Verificar se tem itens úteis
    const usableItems = this.getUsableItems(room, bot);

    // Probabilidade de usar item vs atirar
    let useItemChance = 0;
    switch (difficulty) {
      case 'easy':
        useItemChance = 0.2; // 20% chance de usar item
        break;
      case 'medium':
        useItemChance = 0.5; // 50% chance
        break;
      case 'hard':
        useItemChance = 0.7; // 70% chance (mais estratégico)
        break;
    }

    // Decidir se usa item
    if (usableItems.length > 0 && Math.random() < useItemChance) {
      const itemToUse = this.selectBestItem(room, bot, usableItems, difficulty);
      if (itemToUse) {
        const targetInfo = this.getItemTarget(room, bot, itemToUse.item.id as ItemId);
        return {
          type: 'useItem',
          itemId: itemToUse.item.id as ItemId,
          itemIndex: itemToUse.index,
          targetId: targetInfo.targetId,
          stolenItemIndex: targetInfo.stolenItemIndex,
        };
      }
    }

    // Atirar
    const targetId = this.getShootTarget(room, bot, difficulty);
    return {
      type: 'shoot',
      targetId,
    };
  }

  /**
   * Obtém itens que podem ser usados
   */
  private getUsableItems(room: Room, bot: Player): { item: Item; index: number }[] {
    return bot.items
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => {
        // Filtrar itens que precisam de condições especiais
        if (item.id === 'hand_saw' && bot.sawedOff) return false;
        if (item.id === 'cigarettes' && bot.hp >= bot.maxHp) return false;
        if (item.id === 'beer' && room.shells.length <= 1) return false;
        if (item.id === 'handcuffs') {
          // Verificar se há alvo válido
          const targets = room.players.filter(p => p.alive && p.id !== bot.id && !p.handcuffed && !p.handcuffImmune);
          if (targets.length === 0) return false;
        }
        if (item.id === 'adrenaline') {
          // Verificar se alguém tem itens (incluindo jogadores mortos)
          const hasItemsTarget = room.players.some(p => p.id !== bot.id && p.items.length > 0);
          if (!hasItemsTarget) return false;
        }
        return true;
      });
  }

  /**
   * Seleciona o melhor item para usar
   */
  private selectBestItem(
    room: Room,
    bot: Player,
    usableItems: { item: Item; index: number }[],
    difficulty: BotDifficulty
  ): { item: Item; index: number } | null {
    if (usableItems.length === 0) return null;

    if (difficulty === 'easy') {
      // Easy: escolhe aleatório
      return usableItems[Math.floor(Math.random() * usableItems.length)];
    }

    // Medium/Hard: prioriza por utilidade
    const priorityOrder: ItemId[] = [
      'magnifying_glass', // Ver shell atual
      'hand_saw',         // Dobrar dano
      'inverter',         // Inverter shell
      'beer',             // Ejetar shell
      'cigarettes',       // Curar
      'handcuffs',        // Pular turno do oponente
      'phone',            // Ver shell aleatório
      'turn_reverser',    // Inverter direção
      'expired_medicine', // Risco/recompensa
      'adrenaline',       // Roubar item
    ];

    // Se hard e sabe que é blank, prioriza items antes de atirar em si
    if (difficulty === 'hard' && room.revealedShell === 'blank') {
      // Usa hand_saw se tiver
      const saw = usableItems.find(i => i.item.id === 'hand_saw');
      if (saw) return saw;
    }

    // Ordenar por prioridade
    usableItems.sort((a, b) => {
      const aIndex = priorityOrder.indexOf(a.item.id as ItemId);
      const bIndex = priorityOrder.indexOf(b.item.id as ItemId);
      return aIndex - bIndex;
    });

    return usableItems[0];
  }

  /**
   * Obtém o alvo para usar item
   * Para Adrenaline, retorna também o índice do item a roubar
   */
  private getItemTarget(room: Room, bot: Player, itemId: ItemId): { targetId?: string; stolenItemIndex?: number } {
    const aliveOpponents = room.players.filter(p => p.alive && p.id !== bot.id);
    const allOpponents = room.players.filter(p => p.id !== bot.id);

    switch (itemId) {
      case 'handcuffs':
        // Alvo que não está handcuffed nem immune (apenas vivos)
        const validTargets = aliveOpponents.filter(p => !p.handcuffed && !p.handcuffImmune);
        return { targetId: validTargets[Math.floor(Math.random() * validTargets.length)]?.id };

      case 'adrenaline':
        // Alvo com mais itens (incluindo jogadores mortos)
        const withItems = allOpponents.filter(p => p.items.length > 0);
        if (withItems.length === 0) return {};

        withItems.sort((a, b) => b.items.length - a.items.length);
        const target = withItems[0];

        // Escolher item a roubar (não pode ser outra Adrenaline)
        const stealableItems = target.items
          .map((item, idx) => ({ item, idx }))
          .filter(({ item }) => item.id !== 'adrenaline');

        if (stealableItems.length === 0) return {};

        // Escolher aleatório dos itens roubáveis
        const stolen = stealableItems[Math.floor(Math.random() * stealableItems.length)];
        return { targetId: target.id, stolenItemIndex: stolen.idx };

      default:
        return {};
    }
  }

  /**
   * Decide em quem atirar
   */
  private getShootTarget(room: Room, bot: Player, difficulty: BotDifficulty): string {
    const opponents = room.players.filter(p => p.alive && p.id !== bot.id);

    // Se sabe que é blank, atira em si mesmo
    if (room.revealedShell === 'blank') {
      return bot.id;
    }

    // Se sabe que é live, atira no oponente
    if (room.revealedShell === 'live') {
      // Escolhe oponente com menos HP
      if (difficulty === 'hard') {
        opponents.sort((a, b) => a.hp - b.hp);
        return opponents[0]?.id || bot.id;
      }
      return opponents[Math.floor(Math.random() * opponents.length)]?.id || bot.id;
    }

    // Não sabe o shell
    switch (difficulty) {
      case 'easy':
        // 50/50 em si mesmo ou oponente
        if (Math.random() < 0.5) {
          return bot.id;
        }
        return opponents[Math.floor(Math.random() * opponents.length)]?.id || bot.id;

      case 'medium':
        // Considera probabilidade de live vs blank
        const liveCount = room.shells.filter(s => s === 'live').length;
        const blankCount = room.shells.length - liveCount;
        if (blankCount > liveCount) {
          return bot.id; // Mais blanks, arrisca em si
        }
        return opponents[Math.floor(Math.random() * opponents.length)]?.id || bot.id;

      case 'hard':
        // Mesma lógica do medium mas com preferência por oponente com menos HP
        const liveRatio = room.shells.filter(s => s === 'live').length / room.shells.length;
        if (liveRatio < 0.4) {
          return bot.id; // Arrisca se poucas lives
        }
        opponents.sort((a, b) => a.hp - b.hp);
        return opponents[0]?.id || bot.id;
    }

    return opponents[0]?.id || bot.id;
  }

  /**
   * Calcula delay de "pensamento" do bot
   */
  private getThinkingDelay(difficulty: BotDifficulty): number {
    switch (difficulty) {
      case 'easy':
        return 1000 + Math.random() * 2000; // 1-3s
      case 'medium':
        return 1500 + Math.random() * 2500; // 1.5-4s
      case 'hard':
        return 2000 + Math.random() * 3000; // 2-5s
    }
  }

  // ==========================================
  // BOT ACTION EXECUTION
  // ==========================================

  /**
   * Executa tiro do bot
   */
  private executeBotShoot(
    io: TypedIOServer,
    room: Room,
    roomCode: string,
    bot: Player,
    action: BotAction,
    roomService: RoomService
  ): void {
    const targetId = action.targetId || bot.id;

    // Processar tiro usando GameService
    const result = this.gameService.processShot(room as never, bot.id, targetId);

    if ('error' in result) {
      logger.error(LOG_CATEGORIES.SHOT, `Bot erro ao atirar: ${result.error}`, {
        roomCode,
        botId: bot.id,
        targetId,
      });
      return;
    }

    // Emitir resultado
    io.to(roomCode).emit('shotFired', result);

    // Log
    const targetPlayer = room.players.find(p => p.id === targetId);
    logger.info(LOG_CATEGORIES.SHOT, `${bot.name} atirou em ${targetPlayer?.name || targetId}`, {
      roomCode,
      socketId: bot.id,
      shooter: bot.name,
      target: targetPlayer?.name,
      shell: result.shell,
      damage: result.damage,
      targetSelf: bot.id === targetId,
    });

    // Verificar eliminação
    const target = room.players.find(p => p.id === targetId);
    if (target && !target.alive) {
      io.to(roomCode).emit('playerEliminated', {
        playerId: targetId,
        playerName: target.name,
        reason: 'Eliminado por tiro',
      });
    }

    // Verificar fim de round
    if (result.roundOver) {
      // Importar dinamicamente para evitar dependência circular
      import('../../socket/game.handler').then(({ handleRoundEnd }) => {
        handleRoundEnd(io, room as never, roomCode, roomService, result.winner?.id);
      });
      return;
    }

    // Verificar reload
    if (result.reloaded && result.newShells) {
      io.to(roomCode).emit('shellsReloaded', {
        shells: result.newShells,
        itemsDistributed: result.itemsDistributed || [],
      });
    }

    // Avançar turno
    const shotSelf = bot.id === targetId;
    const wasBlank = result.shell === 'blank';
    const nextPlayerId = this.gameService.advanceTurn(room as never, shotSelf, wasBlank);

    // Emitir mudança de turno
    io.to(roomCode).emit('turnChanged', {
      currentPlayer: nextPlayerId,
      reason: 'shot',
      players: room.players.map(p => this.gameService.toPublicPlayer(p as never)),
      turnElapsed: 0,
    });

    // Verificar se próximo jogador é bot ou humano
    const nextPlayer = room.players.find(p => p.id === nextPlayerId);
    const nextIsBot = nextPlayer && this.isBot(nextPlayer.id);

    if (nextIsBot) {
      // Próximo é bot: limpar timer atual e agendar turno do bot
      if (room.turnTimeout) {
        clearTimeout(room.turnTimeout);
        room.turnTimeout = null;
      }
      room.turnStartTime = Date.now();

      // Agendar turno APÓS o overlay de tiro terminar
      const overlayDelay = OVERLAY_DURATIONS.SHOT_RESULT + OVERLAY_DURATIONS.BUFFER;
      this.scheduleBotTurn(io, room, roomCode, roomService, overlayDelay);
    } else {
      // Próximo é humano: iniciar timer de turno para que expire se não jogar
      startTurnTimer(io, room as never, roomCode, roomService);
    }
  }

  /**
   * Executa uso de item do bot
   */
  private executeBotItem(
    io: TypedIOServer,
    room: Room,
    roomCode: string,
    bot: Player,
    action: BotAction,
    roomService: RoomService
  ): void {
    if (action.itemId === undefined || action.itemIndex === undefined) {
      // Fallback para atirar
      this.executeBotShoot(io, room, roomCode, bot, { type: 'shoot', targetId: bot.id }, roomService);
      return;
    }

    // Processar item usando GameService
    // Para Adrenaline, passar o índice do item a roubar (stolenItemIndex)
    // Para outros itens, não precisa de índice
    const result = this.gameService.processItem(
      room as never,
      bot.id,
      action.itemId,
      action.targetId,
      action.itemId === 'adrenaline' ? action.stolenItemIndex : undefined
    );

    if ('error' in result) {
      logger.error(LOG_CATEGORIES.ITEM, `Bot erro ao usar item: ${result.error}`, {
        roomCode,
        botId: bot.id,
        itemId: action.itemId,
      });
      // Fallback para atirar
      this.executeBotShoot(io, room, roomCode, bot, { type: 'shoot', targetId: bot.id }, roomService);
      return;
    }

    // Emitir resultado
    io.to(roomCode).emit('itemUsed', {
      ...result,
      players: room.players.map(p => this.gameService.toPublicPlayer(p as never)),
      shellsRemaining: {
        total: room.shells.length - room.currentShellIndex,
        live: room.shells.slice(room.currentShellIndex).filter(s => s === 'live').length,
        blank: room.shells.slice(room.currentShellIndex).filter(s => s === 'blank').length,
      },
    });

    // Log
    logger.info(LOG_CATEGORIES.ITEM, `${bot.name} usou ${action.itemId}`, {
      roomCode,
      socketId: bot.id,
      playerName: bot.name,
      itemId: action.itemId,
      targetId: action.targetId,
    });

    // Agendar próximo turno do bot se ainda for sua vez
    // Aguardar o overlay de item terminar antes de fazer próxima ação
    const overlayDelay = OVERLAY_DURATIONS.ITEM_ACTION + OVERLAY_DURATIONS.BUFFER;
    setTimeout(() => {
      const currentPlayer = room.players[room.currentPlayerIndex];
      if (currentPlayer && currentPlayer.id === bot.id && currentPlayer.alive) {
        this.makeBotMove(io, room, roomCode, roomService);
      }
    }, overlayDelay);
  }

  // ==========================================
  // CLEANUP
  // ==========================================

  /**
   * Limpa todos os bots de uma sala
   */
  cleanupRoom(roomCode: string): void {
    for (const [botId, bot] of this.bots) {
      if (bot.roomCode === roomCode) {
        const timeout = this.turnTimeouts.get(botId);
        if (timeout) {
          clearTimeout(timeout);
          this.turnTimeouts.delete(botId);
        }
        this.bots.delete(botId);
      }
    }
  }

  /**
   * Limpa todos os bots
   */
  cleanupAll(): void {
    for (const timeout of this.turnTimeouts.values()) {
      clearTimeout(timeout);
    }
    this.turnTimeouts.clear();
    this.bots.clear();
  }
}

// ==========================================
// SINGLETON EXPORT
// ==========================================

export const botService = new BotService();
