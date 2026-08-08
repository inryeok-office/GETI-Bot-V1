import { createLogger } from './common/logger.js';
import { loadEnv } from './config/env.js';
import { connectDiscordClient, createDiscordClient, isDiscordConnected } from './app/discord.js';
import { createServer } from './app/server.js';
import { notImplementedDiscordMessageCommandHandler } from './internal-api/handler.js';
import type { InternalApiOptions } from './internal-api/routes.js';

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

  let internalApi: InternalApiOptions | undefined;
  if (env.GETI_INTERNAL_API_KEY) {
    // Renderer/Discord Message Service는 이후 Phase에서 구현되므로, 그
    // 전까지는 요청 검증/Command 매핑까지만 수행하는 Placeholder Handler를 사용한다.
    internalApi = {
      apiKey: env.GETI_INTERNAL_API_KEY,
      handler: notImplementedDiscordMessageCommandHandler,
    };
  } else {
    logger.warn('GETI_INTERNAL_API_KEY is not set. Internal Discord API routes are disabled.');
  }

  const server = createServer({
    logger,
    getDiscordStatus: () => (isDiscordConnected(discordClient) ? 'CONNECTED' : 'DISCONNECTED'),
    internalApi,
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
