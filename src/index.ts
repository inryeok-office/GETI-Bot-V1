import { createLogger } from './common/logger.js';
import { loadEnv } from './config/env.js';
import { connectDiscordClient, createDiscordClient, isDiscordConnected } from './app/discord.js';
import { createServer } from './app/server.js';

async function main(): Promise<void> {
  const env = loadEnv();
  const logger = createLogger({
    level: env.LOG_LEVEL,
    pretty: env.NODE_ENV === 'development',
  });

  const discordClient = createDiscordClient();

  if (env.DISCORD_BOT_TOKEN) {
    try {
      await connectDiscordClient(discordClient, env.DISCORD_BOT_TOKEN);
      logger.info('Discord client connected');
    } catch (error) {
      logger.error({ err: error }, 'Failed to connect Discord client');
    }
  } else {
    logger.warn('DISCORD_BOT_TOKEN is not set. Skipping Discord client connection.');
  }

  const server = createServer({
    logger,
    getDiscordStatus: () => (isDiscordConnected(discordClient) ? 'CONNECTED' : 'DISCONNECTED'),
  });

  await server.listen({ port: env.PORT, host: '0.0.0.0' });
  logger.info({ port: env.PORT }, 'Server started');

  let shuttingDown = false;

  const shutdown = async (signal: string): Promise<void> => {
    if (shuttingDown) return;
    shuttingDown = true;

    logger.info({ signal }, 'Shutting down');

    try {
      await server.close();
      discordClient.destroy();
      logger.info('Shutdown complete');
      process.exit(0);
    } catch (error) {
      logger.error({ err: error }, 'Error during shutdown');
      process.exit(1);
    }
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

main().catch((error: unknown) => {
  // eslint-disable-next-line no-console
  console.error('Fatal error during startup:', error);
  process.exit(1);
});
