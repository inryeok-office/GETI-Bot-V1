import Fastify from 'fastify';
import type { Logger } from 'pino';
import { resolveRequestId } from '../common/request-id.js';
import { registerInternalDiscordRoutes, type InternalApiOptions } from '../internal-api/routes.js';

export interface CreateServerOptions {
  logger: Logger;
  /**
   * Discord Client 연결 상태를 조회한다.
   * 제공되지 않으면(Discord Token 미설정 등) 응답에서 discord 필드를 생략한다.
   */
  getDiscordStatus?: () => 'CONNECTED' | 'DISCONNECTED';
  /**
   * GETI Server → Discord Bot Internal API 설정.
   * 제공되지 않으면(GETI_INTERNAL_API_KEY 미설정 등) Internal Route를
   * 등록하지 않는다.
   */
  internalApi?: InternalApiOptions;
}

/**
 * Internal API Request Body 크기 상한.
 * Discord Embed 자체가 title/description/field 길이 제한(수천자 수준)을
 * 가지므로 Fastify 기본값(1MB)보다 훨씬 작은 값으로도 충분하다.
 */
const REQUEST_BODY_LIMIT_BYTES = 256 * 1024;

/**
 * Fastify Application을 생성한다.
 * index.ts에서 직접 Route/Plugin을 등록하지 않고 이 함수로 책임을 분리한다.
 */
export function createServer(options: CreateServerOptions) {
  const { logger, getDiscordStatus, internalApi } = options;

  const app = Fastify({
    loggerInstance: logger,
    genReqId: resolveRequestId,
    bodyLimit: REQUEST_BODY_LIMIT_BYTES,
  });

  app.get('/health', async () => {
    const body: Record<string, string> = {
      status: 'UP',
      service: 'geti-discord-bot',
    };

    if (getDiscordStatus) {
      body.discord = getDiscordStatus();
    }

    return body;
  });

  if (internalApi) {
    registerInternalDiscordRoutes(app, internalApi);
  }

  return app;
}
