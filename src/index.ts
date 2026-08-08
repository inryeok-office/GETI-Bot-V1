import { createLogger } from './common/logger.js';
import { loadEnv } from './config/env.js';
import { connectDiscordClient, createDiscordClient, isDiscordConnected } from './app/discord.js';
import { createServer } from './app/server.js';
import { DiscordJsMessageAdapter } from './discord-delivery/adapter.js';
import { DiscordDeliveryCommandHandler } from './discord-delivery/command-handler.js';
import { notImplementedDiscordMessageCommandHandler } from './internal-api/handler.js';
import type { DiscordMessageCommandHandler } from './internal-api/handler.js';
import type { InternalApiOptions } from './internal-api/routes.js';

async function main(): Promise<void> {
  const env = loadEnv();
  const logger = createLogger({
    level: env.LOG_LEVEL,
    pretty: env.NODE_ENV === 'development',
  });

  const discordClient = createDiscordClient();
  let discordConnected = false;

  if (env.DISCORD_BOT_TOKEN) {
    try {
      await connectDiscordClient(discordClient, env.DISCORD_BOT_TOKEN);
      discordConnected = true;
      logger.info('Discord client connected');
    } catch (error) {
      logger.error({ err: error }, 'Failed to connect Discord client');
    }
  } else {
    logger.warn('DISCORD_BOT_TOKEN is not set. Skipping Discord client connection.');
  }

  // Discord Client가 연결되어 있을 때만 실제 Delivery Handler를 사용한다.
  // 연결되지 않은 상태(Token 미설정/연결 실패)에서는 요청 검증/Command
  // 매핑까지만 수행하는 Placeholder Handler로 안전하게 대체한다.
  const messageCommandHandler: DiscordMessageCommandHandler = discordConnected
    ? new DiscordDeliveryCommandHandler(new DiscordJsMessageAdapter(discordClient, logger))
    : notImplementedDiscordMessageCommandHandler;

  let internalApi: InternalApiOptions | undefined;
  if (env.GETI_INTERNAL_API_KEY) {
    internalApi = { apiKey: env.GETI_INTERNAL_API_KEY, handler: messageCommandHandler };
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
