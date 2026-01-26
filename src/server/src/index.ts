// ==========================================
// SERVER ENTRY POINT
// ==========================================

import { ENV, validateEnv } from './config/env.config';
import { createServer } from './app';
import { setupSocketIO } from './socket';

async function main() {
  try {
    // Validar variáveis de ambiente
    validateEnv();

    // Criar servidor HTTP + Express
    const { app, httpServer } = createServer();

    // Configurar Socket.IO
    const io = setupSocketIO(httpServer);

    // Iniciar servidor
    httpServer.listen(ENV.PORT, () => {
      console.log('========================================');
      console.log('🎮 BANGSHOT SERVER');
      console.log('========================================');
      console.log(`🚀 Servidor rodando em: http://localhost:${ENV.PORT}`);
      console.log(`📡 Socket.IO: Ativo`);
      console.log(`🔧 Ambiente: ${ENV.NODE_ENV}`);
      console.log(`🌐 Client URL: ${ENV.CLIENT_URL}`);
      console.log(`🔑 Google Callback: ${ENV.GOOGLE_CALLBACK_URL}`);
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
