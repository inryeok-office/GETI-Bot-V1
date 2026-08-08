import { afterEach, describe, expect, it, vi } from 'vitest';
import pino from 'pino';
import { createServer } from '../app/server.js';
import { ApiError } from './error.js';
import type { DiscordMessageCommandHandler } from './handler.js';

const logger = pino({ level: 'silent' });
const API_KEY = 'test-internal-api-key';

function buildApp(handler: DiscordMessageCommandHandler, commandTimeoutMs?: number) {
  return createServer({
    logger,
    internalApi: { apiKey: API_KEY, handler, commandTimeoutMs },
  });
}

function fakeHandler(
  overrides: Partial<DiscordMessageCommandHandler> = {},
): DiscordMessageCommandHandler {
  return {
    handleCreate: vi.fn().mockResolvedValue({ messageId: 'discord-message-1' }),
    handlePatch: vi.fn().mockResolvedValue({ messageId: 'discord-message-1' }),
    ...overrides,
  };
}

const validCreateBody = {
  targetType: 'JOB',
  action: 'CREATE',
  template: 'JOB_PUBLISHED',
  channelId: 'channel-1',
  roleIds: ['role-1'],
  data: { title: '공고' },
};

const validPatchBody = {
  targetType: 'JOB',
  action: 'UPDATE',
  template: 'JOB_UPDATED',
  channelId: 'channel-1',
  data: { title: '수정된 공고' },
};

describe('POST /internal/v1/discord/messages', () => {
  let app: ReturnType<typeof buildApp> | undefined;

  afterEach(async () => {
    await app?.close();
    app = undefined;
  });

  it('rejects requests without X-Internal-Api-Key', async () => {
    app = buildApp(fakeHandler());

    const response = await app.inject({
      method: 'POST',
      url: '/internal/v1/discord/messages',
      headers: { 'x-idempotency-key': 'idem-1' },
      payload: validCreateBody,
    });

    expect(response.statusCode).toBe(401);
    expect(response.json().code).toBe('UNAUTHORIZED');
  });

  it('rejects requests with a wrong X-Internal-Api-Key', async () => {
    app = buildApp(fakeHandler());

    const response = await app.inject({
      method: 'POST',
      url: '/internal/v1/discord/messages',
      headers: { 'x-internal-api-key': 'wrong-key', 'x-idempotency-key': 'idem-1' },
      payload: validCreateBody,
    });

    expect(response.statusCode).toBe(401);
  });

  it('rejects requests missing X-Idempotency-Key', async () => {
    app = buildApp(fakeHandler());

    const response = await app.inject({
      method: 'POST',
      url: '/internal/v1/discord/messages',
      headers: { 'x-internal-api-key': API_KEY },
      payload: validCreateBody,
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().code).toBe('INVALID_REQUEST');
  });

  it('rejects an invalid body (template/targetType mismatch)', async () => {
    app = buildApp(fakeHandler());

    const response = await app.inject({
      method: 'POST',
      url: '/internal/v1/discord/messages',
      headers: { 'x-internal-api-key': API_KEY, 'x-idempotency-key': 'idem-1' },
      payload: { ...validCreateBody, targetType: 'PROGRAM' },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().code).toBe('INVALID_REQUEST');
  });

  it('accepts a valid request, invokes the handler, and returns 201 with messageId', async () => {
    const handler = fakeHandler();
    app = buildApp(handler);

    const response = await app.inject({
      method: 'POST',
      url: '/internal/v1/discord/messages',
      headers: {
        'x-internal-api-key': API_KEY,
        'x-idempotency-key': 'idem-1',
        'x-request-id': 'req-abc',
      },
      payload: validCreateBody,
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toEqual({ messageId: 'discord-message-1', requestId: 'req-abc' });
    expect(handler.handleCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'CREATE',
        targetType: 'JOB',
        template: 'JOB_PUBLISHED',
        channelId: 'channel-1',
        roleIds: ['role-1'],
        requestId: 'req-abc',
        idempotencyKey: 'idem-1',
      }),
    );
  });

  it('maps an ApiError thrown by the handler to the matching status/code', async () => {
    const handler = fakeHandler({
      handleCreate: vi.fn().mockRejectedValue(new ApiError('CHANNEL_NOT_FOUND', 'channel missing')),
    });
    app = buildApp(handler);

    const response = await app.inject({
      method: 'POST',
      url: '/internal/v1/discord/messages',
      headers: { 'x-internal-api-key': API_KEY, 'x-idempotency-key': 'idem-1' },
      payload: validCreateBody,
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toMatchObject({ code: 'CHANNEL_NOT_FOUND', retryable: false });
  });

  it('maps an unexpected thrown error to a safe INTERNAL_ERROR without leaking details', async () => {
    const handler = fakeHandler({
      handleCreate: vi.fn().mockRejectedValue(new Error('discord.js raw stack trace')),
    });
    app = buildApp(handler);

    const response = await app.inject({
      method: 'POST',
      url: '/internal/v1/discord/messages',
      headers: { 'x-internal-api-key': API_KEY, 'x-idempotency-key': 'idem-1' },
      payload: validCreateBody,
    });

    expect(response.statusCode).toBe(500);
    const body = response.json();
    expect(body.code).toBe('INTERNAL_ERROR');
    expect(JSON.stringify(body)).not.toContain('stack trace');
  });

  it('responds with DISCORD_UNAVAILABLE(retryable) when the handler exceeds the command timeout', async () => {
    const handler = fakeHandler({
      handleCreate: vi.fn().mockReturnValue(new Promise(() => {})),
    });
    app = buildApp(handler, 10);

    const response = await app.inject({
      method: 'POST',
      url: '/internal/v1/discord/messages',
      headers: { 'x-internal-api-key': API_KEY, 'x-idempotency-key': 'idem-1' },
      payload: validCreateBody,
    });

    expect(response.statusCode).toBe(503);
    expect(response.json()).toMatchObject({ code: 'DISCORD_UNAVAILABLE', retryable: true });
  });
});

describe('PATCH /internal/v1/discord/messages/:messageId', () => {
  let app: ReturnType<typeof buildApp> | undefined;

  afterEach(async () => {
    await app?.close();
    app = undefined;
  });

  it('rejects requests without X-Internal-Api-Key', async () => {
    app = buildApp(fakeHandler());

    const response = await app.inject({
      method: 'PATCH',
      url: '/internal/v1/discord/messages/message-1',
      payload: validPatchBody,
    });

    expect(response.statusCode).toBe(401);
  });

  it('accepts a valid request, invokes the handler, and returns 200 with messageId', async () => {
    const handler = fakeHandler();
    app = buildApp(handler);

    const response = await app.inject({
      method: 'PATCH',
      url: '/internal/v1/discord/messages/message-1',
      headers: { 'x-internal-api-key': API_KEY },
      payload: validPatchBody,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().messageId).toBe('discord-message-1');
    expect(handler.handlePatch).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'UPDATE',
        messageId: 'message-1',
        channelId: 'channel-1',
      }),
    );
  });

  it('rejects a body containing roleIds (Mention not allowed on PATCH)', async () => {
    app = buildApp(fakeHandler());

    const response = await app.inject({
      method: 'PATCH',
      url: '/internal/v1/discord/messages/message-1',
      headers: { 'x-internal-api-key': API_KEY },
      payload: { ...validPatchBody, roleIds: ['role-1'] },
    });

    expect(response.statusCode).toBe(400);
  });
});

describe('internal routes are not mounted without configuration', () => {
  it('returns 404 for the internal API path when internalApi is not provided', async () => {
    const app = createServer({ logger });

    const response = await app.inject({
      method: 'POST',
      url: '/internal/v1/discord/messages',
      payload: validCreateBody,
    });

    expect(response.statusCode).toBe(404);
    await app.close();
  });
});

describe('/health does not require internal API authentication', () => {
  it('responds without X-Internal-Api-Key even when internalApi is configured', async () => {
    const app = buildApp(fakeHandler());

    const response = await app.inject({ method: 'GET', url: '/health' });

    expect(response.statusCode).toBe(200);
    await app.close();
  });
});
