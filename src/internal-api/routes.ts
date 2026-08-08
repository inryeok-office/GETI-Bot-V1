import type { FastifyReply, FastifyRequest } from 'fastify';
import type { AppInstance } from '../app/fastify-instance.js';
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

export interface InternalApiOptions {
  apiKey: string;
  handler: DiscordMessageCommandHandler;
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
  const { apiKey, handler } = options;

  app.register(async (internalApp) => {
    internalApp.addHook('preHandler', async (request: FastifyRequest, reply: FastifyReply) => {
      const candidate = extractHeaderValue(request.headers['x-internal-api-key']);
      if (!isValidInternalApiKey(candidate, apiKey)) {
        sendApiError(
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
        const result = await handler.handleCreate(command);
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
        const result = await handler.handlePatch(command);
        return reply.code(200).send({ messageId: result.messageId, requestId });
      } catch (error) {
        return handleUnexpectedError(request, reply, error, requestId);
      }
    });
  });
}
