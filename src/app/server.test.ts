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
