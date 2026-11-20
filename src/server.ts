import http from 'http';
import { env } from './config/env';
import { createApp } from './app';

const server = http.createServer(createApp());

let isShuttingDown = false;

// ------------------ BOOTSTRAP ------------------
server.on('error', (error) => {
  console.error('Server failed to start:', error);
  process.exit(1);
});

server.listen(env.port, () => {
  console.log(`carrier-tms-agent running on port ${env.port} (${env.nodeEnv})`);
});

// ------------------ SHUTDOWN HANDLER ------------------
function shutdown(signal: string, exitCode: number) {
  if (isShuttingDown) {
    console.log('Shutdown already in progress...');
    return;
  }
  isShuttingDown = true;

  console.log(`\nReceived ${signal}, shutting down gracefully...`);

  const forceExit = setTimeout(() => {
    console.error('Forcing shutdown: open requests did not finish in time');
    server.closeAllConnections();
    process.exit(1);
  }, 10_000);

  server.close(() => {
    clearTimeout(forceExit);
    console.log('Graceful shutdown complete.');
    process.exit(exitCode);
  });
}

// ------------------ SIGNALS ------------------
process.once('SIGTERM', () => shutdown('SIGTERM', 0));
process.once('SIGINT', () => shutdown('SIGINT', 0));
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  shutdown('uncaughtException', 1);
});
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
  shutdown('unhandledRejection', 1);
});
