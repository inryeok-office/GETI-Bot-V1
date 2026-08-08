import type {
  DiscordMessageCommandHandler,
  DiscordMessageCommandResult,
} from '../internal-api/handler.js';
import type {
  CreateDiscordMessageCommand,
  PatchDiscordMessageCommand,
} from '../internal-api/types.js';
import type { IdempotencyStore } from './store.js';

/**
 * 기존 DiscordMessageCommandHandler를 감싸 CREATE에 Idempotency를
 * 적용하는 Decorator.
 *
 * X-Idempotency-Key(command.idempotencyKey)가 같은 CREATE 요청이 다시
 * 오면 Discord Message를 다시 전송하지 않고 기존 성공 결과를 재사용한다.
 * PATCH(UPDATE/CLOSE_NOTICE/DELETE_NOTICE)는 Idempotency Key 대상이
 * 아니므로 그대로 내부 Handler에 위임한다.
 */
export class IdempotentDiscordMessageCommandHandler implements DiscordMessageCommandHandler {
  constructor(
    private readonly inner: DiscordMessageCommandHandler,
    private readonly store: IdempotencyStore<DiscordMessageCommandResult>,
  ) {}

  async handleCreate(command: CreateDiscordMessageCommand): Promise<DiscordMessageCommandResult> {
    return this.store.getOrCreate(command.idempotencyKey, () => this.inner.handleCreate(command));
  }

  async handlePatch(command: PatchDiscordMessageCommand): Promise<DiscordMessageCommandResult> {
    return this.inner.handlePatch(command);
  }
}
