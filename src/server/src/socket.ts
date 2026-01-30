// ==========================================
// SOCKET.IO SETUP
// ==========================================

import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { ENV } from './config/env.config';
import {
  ClientToServerEvents,
  ServerToClientEvents,
} from '../../shared/types/socket-events.types';

// Import handlers and services
import { registerRoomHandlers, setupRoomCallbacks } from './socket/room.handler';
import { registerGameHandlers } from './socket/game.handler';
import { RoomService } from './services/game/room.service';
import { authService } from './services/auth.service';
import { logger, LOG_CATEGORIES } from './services/logger.service';

// Shared room service instance (exportado para uso no endpoint /api/leave-room)
export const roomService = new RoomService();

// Map de socket.id para dados do usuário
export const socketUserMap = new Map<string, { odUserId: string; displayName: string; token?: string } | null>();

// Map de userId para socket.id (para limitação de 1 aba por usuário)
const userActiveSocketMap = new Map<string, string>();

// Referência ao io server para acesso externo (online count REST endpoint)
let ioInstance: Server<ClientToServerEvents, ServerToClientEvents> | null = null;

export function getOnlineCount(): { total: number; inQueue: number } {
  if (!ioInstance) {
    return { total: 0, inQueue: 0 };
  }

  // Contar usuários únicos (por odUserId) + conexões anônimas
  const uniqueUserIds = new Set<string>();
  let anonymousCount = 0;

  for (const [, userData] of socketUserMap) {
    if (userData?.odUserId) {
      uniqueUserIds.add(userData.odUserId);
    } else {
      // Conexão sem autenticação (guest ou não logado)
      anonymousCount++;
    }
  }

  return {
    total: uniqueUserIds.size + anonymousCount,
    inQueue: 0, // Futuro: matchmaking queue
  };
}

// Tipo do Socket com eventos tipados
export type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

// Tipo do IO Server com eventos tipados
export type TypedIOServer = Server<ClientToServerEvents, ServerToClientEvents>;

export function setupSocketIO(httpServer: HttpServer): TypedIOServer {
  const io: TypedIOServer = new Server(httpServer, {
    cors: {
      origin: ENV.IS_PRODUCTION ? ENV.CLIENT_URL : '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Salvar referência para acesso externo
  ioInstance = io;

  // Setup callbacks do room service (uma vez)
  setupRoomCallbacks(io, roomService);

  // ==========================================
  // CONNECTION HANDLER
  // ==========================================

  io.on('connection', async (socket: TypedSocket) => {
    const clientIP = socket.handshake.address;

    logger.info(LOG_CATEGORIES.CONN, 'Nova conexão', {
      socketId: socket.id,
      ip: clientIP,
    });

    // Tentar autenticar o usuário pelo token
    const authToken = socket.handshake.auth?.token;
    if (authToken) {
      try {
        const user = await authService.validateToken(authToken);
        if (user) {
          // Registrar conexão (permite múltiplas abas por usuário)
          socketUserMap.set(socket.id, { odUserId: user.id, displayName: user.display_name, token: authToken });
          userActiveSocketMap.set(user.id, socket.id);

          logger.info(LOG_CATEGORIES.AUTH, 'Socket autenticado', {
            socketId: socket.id,
            userId: user.id,
            displayName: user.display_name,
          });

          // Verificar se usuário já está em um jogo ativo
          const existingGame = roomService.getRoomByUserId(user.id);
          if (existingGame) {
            logger.info(LOG_CATEGORIES.AUTH, 'Usuário já em jogo ativo', {
              socketId: socket.id,
              userId: user.id,
              displayName: user.display_name,
              roomCode: existingGame.code,
              gameStarted: existingGame.room.started,
            });
            socket.emit('alreadyInGame', {
              roomCode: existingGame.code,
              gameStarted: existingGame.room.started,
            });
          }
        }
      } catch (error) {
        logger.warn(LOG_CATEGORIES.AUTH, 'Token inválido', {
          socketId: socket.id,
        });
      }
    }

    // Registrar handlers
    registerRoomHandlers(io, socket, roomService);
    registerGameHandlers(io, socket, roomService);

    // Online count handler
    socket.on('requestOnlineCount', () => {
      socket.emit('onlineCount', getOnlineCount());
    });

    // Broadcast online count atualizado para todos
    io.emit('onlineCount', getOnlineCount());

    // Handler de desconexão
    socket.on('disconnect', (reason) => {
      const userData = socketUserMap.get(socket.id);

      logger.info(LOG_CATEGORIES.CONN, 'Desconectado', {
        socketId: socket.id,
        userId: userData?.odUserId,
        displayName: userData?.displayName,
        reason,
      });

      // Limpar dados do usuário
      socketUserMap.delete(socket.id);

      // Limpar mapa de usuário ativo (apenas se este era o socket ativo)
      if (userData?.odUserId) {
        const activeSocketId = userActiveSocketMap.get(userData.odUserId);
        if (activeSocketId === socket.id) {
          userActiveSocketMap.delete(userData.odUserId);
        }
      }

      // A lógica de desconexão será tratada no room.handler

      // Broadcast online count atualizado
      io.emit('onlineCount', getOnlineCount());
    });

    // Handler de erros
    socket.on('error', (error) => {
      logger.error(LOG_CATEGORIES.CONN, 'Erro no socket', {
        socketId: socket.id,
        error: String(error),
      });
    });
  });

  // ==========================================
  // SERVER EVENTS
  // ==========================================

  io.engine.on('connection_error', (err) => {
    logger.error(LOG_CATEGORIES.CONN, 'Erro de conexão Socket.IO', {
      error: String(err),
    });
  });

  return io;
}
