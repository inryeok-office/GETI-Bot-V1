import type { CreateBody, PatchBody, PatchParams } from './schema.js';
import type { CreateDiscordMessageCommand, PatchDiscordMessageCommand } from './types.js';

export interface CreateCommandContext {
  requestId: string;
  idempotencyKey: string;
}

/**
 * 검증된 CREATE Transport DTO를 Domain Command로 변환한다.
 * Renderer/Discord Message Service는 이 Command만 알면 되고, Fastify
 * Request/Zod 스키마를 알지 못한다.
 */
export function toCreateCommand(
  body: CreateBody,
  context: CreateCommandContext,
): CreateDiscordMessageCommand {
  return {
    action: 'CREATE',
    targetType: body.targetType,
    template: body.template,
    channelId: body.channelId,
    roleIds: body.roleIds,
    data: body.data,
    requestId: context.requestId,
    idempotencyKey: context.idempotencyKey,
  };
}

export interface PatchCommandContext {
  requestId: string;
}

/**
 * 검증된 PATCH Transport DTO를 Domain Command로 변환한다.
 */
export function toPatchCommand(
  body: PatchBody,
  params: PatchParams,
  context: PatchCommandContext,
): PatchDiscordMessageCommand {
  return {
    action: body.action,
    targetType: body.targetType,
    template: body.template,
    channelId: body.channelId,
    messageId: params.messageId,
    data: body.data,
    requestId: context.requestId,
  };
}
