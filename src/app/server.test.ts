import { afterEach, describe, expect, it } from 'vitest';
import pino from 'pino';
import { createServer } from './server.js';

const logger = pino({ level: 'silent' });

describe('createServer /health', () => {
  let app: ReturnType<typeof createServer> | undefined;

  afterEach(async () => {
    await app?.close();
    app = undefined;
  });

  it('returns UP status without discord status when not provided', async () => {
    app = createServer({ logger });

    const response = await app.inject({ method: 'GET', url: '/health' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      status: 'UP',
      service: 'geti-discord-bot',
    });
  });

  it('includes discord status when a getter is provided', async () => {
    app = createServer({ logger, getDiscordStatus: () => 'DISCONNECTED' });

    const response = await app.inject({ method: 'GET', url: '/health' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      status: 'UP',
      service: 'geti-discord-bot',
      discord: 'DISCONNECTED',
    });
  });
});

describe('createServer body size limit', () => {
  let app: ReturnType<typeof createServer> | undefined;

  afterEach(async () => {
    await app?.close();
    app = undefined;
  });

  it('rejects a request body larger than the configured limit with 413', async () => {
    app = createServer({
      logger,
      internalApi: {
        apiKey: 'test-key',
        handler: {
          handleCreate: async () => ({ messageId: 'unused' }),
          handlePatch: async () => ({ messageId: 'unused' }),
        },
      },
    });

    const oversizedBody = JSON.stringify({ data: { padding: 'x'.repeat(300 * 1024) } });

    const response = await app.inject({
      method: 'POST',
      url: '/internal/v1/discord/messages',
      headers: {
        'x-internal-api-key': 'test-key',
        'x-idempotency-key': 'idem-1',
        'content-type': 'application/json',
      },
      payload: oversizedBody,
    });

    expect(response.statusCode).toBe(413);
    // Fastify가 Route Handler 이전 단계에서 거부한 오류도 Internal API의
    // Error Contract(code/message/retryable/requestId)와 동일한 형태여야
    // 한다 — Fastify 기본 오류 형태({statusCode, error, message})가 그대로
    // 노출되면 안 된다.
    expect(response.json()).toMatchObject({ code: 'INVALID_REQUEST', retryable: false });
    expect(response.json()).toHaveProperty('requestId');
  });
});
