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

// Shared room service instance
const roomService = new RoomService();

// Map de socket.id para dados do usuário
export const socketUserMap = new Map<string, { odUserId: string; displayName: string } | null>();

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

  // Setup callbacks do room service (uma vez)
  setupRoomCallbacks(io, roomService);

  // ==========================================
  // CONNECTION HANDLER
  // ==========================================

  io.on('connection', async (socket: TypedSocket) => {
    const clientIP = socket.handshake.address;
    console.log(`[${new Date().toLocaleString('pt-BR')}] Nova conexão: ${socket.id} | IP: ${clientIP}`);

    // Tentar autenticar o usuário pelo token
    const authToken = socket.handshake.auth?.token;
    if (authToken) {
      try {
        const user = await authService.validateToken(authToken);
        if (user) {
          socketUserMap.set(socket.id, { odUserId: user.id, displayName: user.displayName });
          console.log(`[Auth] Socket ${socket.id} autenticado como ${user.displayName}`);
        }
      } catch (error) {
        console.log(`[Auth] Token inválido para socket ${socket.id}`);
      }
    }

    // Registrar handlers
    registerRoomHandlers(io, socket, roomService);
    registerGameHandlers(io, socket, roomService);

    // Handler de desconexão
    socket.on('disconnect', (reason) => {
      console.log(`[${new Date().toLocaleString('pt-BR')}] Desconectado: ${socket.id} | Motivo: ${reason}`);
      // Limpar dados do usuário
      socketUserMap.delete(socket.id);
      // A lógica de desconexão será tratada no room.handler
    });

    // Handler de erros
    socket.on('error', (error) => {
      console.error(`[${new Date().toLocaleString('pt-BR')}] Erro no socket ${socket.id}:`, error);
    });
  });

  // ==========================================
  // SERVER EVENTS
  // ==========================================

  io.engine.on('connection_error', (err) => {
    console.error('Erro de conexão Socket.IO:', err);
  });

  return io;
}
