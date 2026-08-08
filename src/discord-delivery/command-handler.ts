import { ApiError } from '../internal-api/error.js';
import type {
  DiscordMessageCommandHandler,
  DiscordMessageCommandResult,
} from '../internal-api/handler.js';
import type {
  CreateDiscordMessageCommand,
  PatchDiscordMessageCommand,
} from '../internal-api/types.js';
import { renderDiscordMessage } from '../renderer/registry.js';
import { RenderError } from '../renderer/types.js';
import type { DiscordMessageAdapter } from './types.js';

/**
 * Role Id 목록을 Discord Mention 문자열로 만든다.
 * roleIds가 비어 있으면 Mention을 하지 않는다(undefined 반환).
 */
function buildMentionContent(roleIds: string[]): string | undefined {
  if (roleIds.length === 0) return undefined;
  return roleIds.map((roleId) => `<@&${roleId}>`).join(' ');
}

function renderOrThrow(command: CreateDiscordMessageCommand | PatchDiscordMessageCommand) {
  try {
    return renderDiscordMessage(command);
  } catch (error) {
    if (error instanceof RenderError) {
      throw new ApiError('INVALID_REQUEST', error.message, false);
    }
    throw error;
  }
}

/**
 * Renderer 결과를 Discord Message로 전송/수정하는 실제 Command Handler.
 *
 * Mention 정책:
 * - CREATE 최초 성공에서만 Role Mention을 허용한다.
 * - UPDATE/CLOSE_NOTICE/DELETE_NOTICE는 Mention을 포함하지 않는다.
 * - allowedMentions.parse는 항상 빈 배열로 고정해 @everyone/@here를 차단한다.
 */
export class DiscordDeliveryCommandHandler implements DiscordMessageCommandHandler {
  constructor(private readonly adapter: DiscordMessageAdapter) {}

  async handleCreate(command: CreateDiscordMessageCommand): Promise<DiscordMessageCommandResult> {
    const rendered = renderOrThrow(command);

    const messageId = await this.adapter.sendMessage(command.channelId, {
      embeds: rendered.embeds,
      content: buildMentionContent(command.roleIds),
      allowedMentions: { parse: [], roles: command.roleIds },
    });

    return { messageId };
  }

  async handlePatch(command: PatchDiscordMessageCommand): Promise<DiscordMessageCommandResult> {
    const rendered = renderOrThrow(command);

    const messageId = await this.adapter.editMessage(command.channelId, command.messageId, {
      embeds: rendered.embeds,
      content: undefined,
      allowedMentions: { parse: [], roles: [] },
    });

    return { messageId };
  }
}
