import { ApiError } from './error.js';
import type { CreateDiscordMessageCommand, PatchDiscordMessageCommand } from './types.js';

export interface DiscordMessageCommandResult {
  messageId: string;
}

/**
 * Command Mapping 이후 단계(Renderer → Discord Message Service)를 담당하는
 * Handler 계약.
 *
 * 실제 Discord 전송 구현은 이후 Phase(Renderer/Delivery)에서 채워진다.
 * Route는 이 Interface에만 의존하므로 Fastify를 알지 못한다.
 */
export interface DiscordMessageCommandHandler {
  handleCreate(command: CreateDiscordMessageCommand): Promise<DiscordMessageCommandResult>;
  handlePatch(command: PatchDiscordMessageCommand): Promise<DiscordMessageCommandResult>;
}

/**
 * Renderer/Discord Message Service가 아직 구현되지 않은 현재 단계에서
 * 사용하는 Placeholder Handler.
 *
 * 요청을 검증하고 Command로 매핑하는 것까지는 정상 동작하지만, 실제 Discord
 * 메시지 송수신은 아직 지원하지 않는다는 것을 명확한 오류로 알린다.
 */
export const notImplementedDiscordMessageCommandHandler: DiscordMessageCommandHandler = {
  async handleCreate() {
    throw new ApiError('INTERNAL_ERROR', 'Discord message delivery is not implemented yet', false);
  },
  async handlePatch() {
    throw new ApiError('INTERNAL_ERROR', 'Discord message delivery is not implemented yet', false);
  },
};
