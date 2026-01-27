// ==========================================
// LOGGER SERVICE - Persistent logging to database
// ==========================================

import { PrismaClient, LogLevel } from '@prisma/client';

const prisma = new PrismaClient();

// ==========================================
// TYPES
// ==========================================

export interface LogContext {
  roomCode?: string;
  userId?: string;
  socketId?: string;
  [key: string]: unknown;
}

interface QueuedLog {
  level: LogLevel;
  category: string;
  message: string;
  context?: LogContext;
}

// ==========================================
// LOGGER SERVICE CLASS
// ==========================================

class LoggerService {
  private queue: QueuedLog[] = [];
  private flushInterval: NodeJS.Timeout | null = null;
  private isShuttingDown = false;

  constructor() {
    // Flush logs a cada 5 segundos para não sobrecarregar o banco
    this.flushInterval = setInterval(() => this.flush(), 5000);

    // Cleanup diário de logs antigos (executa à meia-noite)
    this.scheduleCleanup();
  }

  // ==========================================
  // CORE METHODS
  // ==========================================

  private async flush(): Promise<void> {
    if (this.queue.length === 0) return;

    const logsToSave = [...this.queue];
    this.queue = [];

    try {
      await prisma.serverLog.createMany({
        data: logsToSave.map(log => ({
          level: log.level,
          category: log.category,
          message: log.message,
          context: log.context ? JSON.stringify(log.context) : null,
          room_code: log.context?.roomCode as string | undefined,
          user_id: log.context?.userId as string | undefined,
          socket_id: log.context?.socketId as string | undefined,
        })),
      });
    } catch (err) {
      // Fallback para console se o banco falhar
      console.error('[Logger] Erro ao salvar logs no banco:', err);
      logsToSave.forEach(log => {
        console.log(`[${log.category}] ${log.message}`, log.context || '');
      });
    }
  }

  log(level: LogLevel, category: string, message: string, context?: LogContext): void {
    // Sempre mostra no console também
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level}] [${category}]`;

    if (level === 'ERROR') {
      console.error(prefix, message, context || '');
    } else if (level === 'WARN') {
      console.warn(prefix, message, context || '');
    } else {
      console.log(prefix, message, context || '');
    }

    // Adiciona à fila para salvar no banco
    this.queue.push({ level, category, message, context });

    // Se for erro crítico, força flush imediato
    if (level === 'ERROR') {
      this.flush();
    }
  }

  // ==========================================
  // CONVENIENCE METHODS
  // ==========================================

  debug(category: string, message: string, context?: LogContext): void {
    this.log('DEBUG', category, message, context);
  }

  info(category: string, message: string, context?: LogContext): void {
    this.log('INFO', category, message, context);
  }

  warn(category: string, message: string, context?: LogContext): void {
    this.log('WARN', category, message, context);
  }

  error(category: string, message: string, context?: LogContext): void {
    this.log('ERROR', category, message, context);
  }

  // ==========================================
  // LIFECYCLE METHODS
  // ==========================================

  /**
   * Força flush imediato dos logs pendentes
   * Usar antes de shutdown ou em erros críticos
   */
  async forceFlush(): Promise<void> {
    await this.flush();
  }

  /**
   * Cleanup para shutdown graceful
   */
  async shutdown(): Promise<void> {
    this.isShuttingDown = true;

    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }

    // Flush final
    await this.flush();

    console.log('[Logger] Shutdown completo');
  }

  // ==========================================
  // CLEANUP METHODS
  // ==========================================

  private scheduleCleanup(): void {
    // Executa limpeza diária à meia-noite
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);

    const msUntilMidnight = midnight.getTime() - now.getTime();

    setTimeout(() => {
      this.cleanOldLogs();
      // Agendar próxima limpeza em 24h
      setInterval(() => this.cleanOldLogs(), 24 * 60 * 60 * 1000);
    }, msUntilMidnight);
  }

  /**
   * Remove logs com mais de 1 ano
   */
  private async cleanOldLogs(): Promise<void> {
    if (this.isShuttingDown) return;

    try {
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

      const deleted = await prisma.serverLog.deleteMany({
        where: {
          timestamp: { lt: oneYearAgo },
        },
      });

      if (deleted.count > 0) {
        this.info('LOGGER', `Limpeza automática: ${deleted.count} logs antigos removidos`);
      }
    } catch (err) {
      console.error('[Logger] Erro na limpeza de logs antigos:', err);
    }
  }
}

// ==========================================
// SINGLETON EXPORT
// ==========================================

export const logger = new LoggerService();

// ==========================================
// CATEGORIES CONSTANTS
// ==========================================

export const LOG_CATEGORIES = {
  TIMER: 'TIMER',       // Eventos do timer
  GAME: 'GAME',         // Ciclo do jogo (round start, game over, reload)
  SHOT: 'SHOT',         // Tiros (disparo, dano, resultado)
  ITEM: 'ITEM',         // Uso de itens
  TURN: 'TURN',         // Mudança de turno
  ROOM: 'ROOM',         // Salas (criada, jogador entrou/saiu)
  CONN: 'CONN',         // Conexão (connect, disconnect, reconnect)
  AUTH: 'AUTH',         // Autenticação
  DB: 'DB',             // Banco de dados
  LOGGER: 'LOGGER',     // Logger interno
} as const;

export type LogCategory = typeof LOG_CATEGORIES[keyof typeof LOG_CATEGORIES];
