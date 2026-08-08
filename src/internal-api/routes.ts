import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import type { AppInstance } from '../app/fastify-instance.js';
import { withTimeout } from '../common/timeout.js';
import { isValidInternalApiKey } from './auth.js';
import { toCreateCommand, toPatchCommand } from './command.js';
import { ApiError, buildErrorResponse, statusForErrorCode, toApiError } from './error.js';
import type { DiscordMessageCommandHandler } from './handler.js';
import {
  createBodySchema,
  createHeadersSchema,
  formatZodError,
  patchBodySchema,
  patchParamsSchema,
} from './schema.js';

/**
 * Discord API 호출이 무한정 걸리는 상황을 막기 위한 Command 처리 Timeout
 * 기본값. 초과 시 DISCORD_UNAVAILABLE(retryable)로 일관되게 응답한다.
 */
const DEFAULT_COMMAND_TIMEOUT_MS = 10_000;

export interface InternalApiOptions {
  apiKey: string;
  handler: DiscordMessageCommandHandler;
  /** 기본값(10초) 대신 사용할 Command 처리 Timeout(ms). 주로 Test에서 사용한다. */
  commandTimeoutMs?: number;
}

function withCommandTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return withTimeout(
    promise,
    timeoutMs,
    () => new ApiError('DISCORD_UNAVAILABLE', 'Discord message command timed out', true),
  );
}

function sendApiError(reply: FastifyReply, error: ApiError, requestId: string): FastifyReply {
  return reply.code(statusForErrorCode(error.code)).send(buildErrorResponse(error, requestId));
}

function extractHeaderValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * 처리 중 잡히지 않은 오류를 로그로 남기고 안전한 ApiError로 변환해 응답한다.
 * 원본 오류(Discord SDK 오류 등)는 로그에만 남기고 응답에는 포함하지 않는다.
 */
function handleUnexpectedError(
  request: FastifyRequest,
  reply: FastifyReply,
  error: unknown,
  requestId: string,
) {
  if (!(error instanceof ApiError)) {
    request.log.error(
      { err: error, requestId },
      'Unhandled error while processing internal Discord message command',
    );
  }
  return sendApiError(reply, toApiError(error), requestId);
}

/**
 * Internal Discord Message API 두 Endpoint를 등록한다.
 *
 * Fastify Plugin 캡슐화를 이용해 이 Route에만 내부 인증 Hook을 적용하고,
 * /health 등 다른 Route에는 영향을 주지 않는다.
 */
export function registerInternalDiscordRoutes(app: AppInstance, options: InternalApiOptions): void {
  const { apiKey, handler, commandTimeoutMs = DEFAULT_COMMAND_TIMEOUT_MS } = options;

  app.register(async (internalApp) => {
    // Body 크기 초과, 잘못된 JSON 등 Route Handler에 도달하기 전에
    // Fastify가 자체적으로 던지는 오류까지 Internal API Error Contract와
    // 동일한 응답 형태(code/message/retryable/requestId)로 통일한다.
    // HTTP Status는 Fastify가 판단한 값(예: 413)을 그대로 유지한다.
    internalApp.setErrorHandler(
      (error: FastifyError, request: FastifyRequest, reply: FastifyReply) => {
        const requestId = request.id;
        request.log.warn(
          { err: error, requestId, statusCode: error.statusCode },
          'Internal API request rejected before reaching the route handler',
        );
        const apiError = new ApiError('INVALID_REQUEST', 'Request could not be processed', false);
        return reply.code(error.statusCode ?? 400).send(buildErrorResponse(apiError, requestId));
      },
    );

    internalApp.addHook('preHandler', async (request: FastifyRequest, reply: FastifyReply) => {
      const candidate = extractHeaderValue(request.headers['x-internal-api-key']);
      if (!isValidInternalApiKey(candidate, apiKey)) {
        return sendApiError(
          reply,
          new ApiError('UNAUTHORIZED', 'Invalid or missing X-Internal-Api-Key'),
          request.id,
        );
      }
    });

    internalApp.post('/internal/v1/discord/messages', async (request, reply) => {
      const requestId = request.id;

      const headersResult = createHeadersSchema.safeParse(request.headers);
      if (!headersResult.success) {
        return sendApiError(
          reply,
          new ApiError('INVALID_REQUEST', formatZodError(headersResult.error)),
          requestId,
        );
      }

      const bodyResult = createBodySchema.safeParse(request.body);
      if (!bodyResult.success) {
        return sendApiError(
          reply,
          new ApiError('INVALID_REQUEST', formatZodError(bodyResult.error)),
          requestId,
        );
      }

      const command = toCreateCommand(bodyResult.data, {
        requestId,
        idempotencyKey: headersResult.data['x-idempotency-key'],
      });

      try {
        const result = await withCommandTimeout(handler.handleCreate(command), commandTimeoutMs);
        request.log.info(
          { requestId, messageId: result.messageId },
          'Discord message CREATE succeeded',
        );
        return reply.code(201).send({ messageId: result.messageId, requestId });
      } catch (error) {
        return handleUnexpectedError(request, reply, error, requestId);
      }
    });

    internalApp.patch('/internal/v1/discord/messages/:messageId', async (request, reply) => {
      const requestId = request.id;

      const paramsResult = patchParamsSchema.safeParse(request.params);
      if (!paramsResult.success) {
        return sendApiError(
          reply,
          new ApiError('INVALID_REQUEST', formatZodError(paramsResult.error)),
          requestId,
        );
      }

      const bodyResult = patchBodySchema.safeParse(request.body);
      if (!bodyResult.success) {
        return sendApiError(
          reply,
          new ApiError('INVALID_REQUEST', formatZodError(bodyResult.error)),
          requestId,
        );
      }

      const command = toPatchCommand(bodyResult.data, paramsResult.data, { requestId });

      try {
        const result = await withCommandTimeout(handler.handlePatch(command), commandTimeoutMs);
        request.log.info(
          { requestId, messageId: result.messageId, action: command.action },
          'Discord message PATCH succeeded',
        );
        return reply.code(200).send({ messageId: result.messageId, requestId });
      } catch (error) {
        return handleUnexpectedError(request, reply, error, requestId);
      }
    });
  });
}
