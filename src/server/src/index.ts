// ==========================================
// SERVER ENTRY POINT
// ==========================================

import { ENV, validateEnv } from './config/env.config';
import { createServer } from './app';
import { setupSocketIO, roomService } from './socket';
import { gamePersistenceService } from './services/game/game.persistence.service';

async function main() {
  try {
    // Validar variáveis de ambiente
    validateEnv();

    // Criar servidor HTTP + Express
    const { app, httpServer } = createServer();

    // Configurar Socket.IO
    const io = setupSocketIO(httpServer);

    // Cleanup orphaned games from previous server instance (games older than 5 minutes)
    await gamePersistenceService.cleanupOrphanedGames();

    // Restore active games from database (games within 5-minute grace period)
    // This enables players to reconnect after server restart
    const inProgressGames = await gamePersistenceService.getInProgressGames();
    let restoredCount = 0;
    for (const game of inProgressGames) {
      if (game.gameState) {
        const restored = roomService.restoreRoomFromState(game.gameState);
        if (restored) {
          restoredCount++;
          console.log(`[Startup] Sala ${game.roomCode} restaurada do banco - aguardando jogadores reconectarem`);
        }
      }
    }
    if (restoredCount > 0) {
      console.log(`[Startup] ${restoredCount} salas restauradas do banco de dados`);
    }

    // Iniciar servidor
    httpServer.listen(ENV.PORT, () => {
      console.log('========================================');
      console.log('🎮 BANGSHOT SERVER');
      console.log('========================================');
      console.log(`🚀 Servidor rodando em: http://localhost:${ENV.PORT}`);
      console.log(`📡 Socket.IO: Ativo`);
      console.log(`🔧 Ambiente: ${ENV.NODE_ENV}`);
      console.log(`🌐 Client URL: ${ENV.CLIENT_URL}`);
      console.log(`🔐 Auth: Laravel OAuth (${ENV.GAMES_ADMIN_API_URL})`);
      console.log('========================================');
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      console.log(`\n${signal} recebido. Encerrando servidor...`);

      io.close(() => {
        console.log('Socket.IO fechado');
      });

      httpServer.close(() => {
        console.log('Servidor HTTP fechado');
        process.exit(0);
      });

      // Forçar fechamento após 10 segundos
      setTimeout(() => {
        console.error('Forçando encerramento...');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    console.error('Erro fatal ao iniciar servidor:', error);
    process.exit(1);
  }
}

main();
