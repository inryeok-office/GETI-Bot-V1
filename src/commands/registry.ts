import type { DiscordTextCommand } from './types.js';

/**
 * 활성 Prefix Command를 소유하는 Registry.
 *
 * `!명령어`는 이 Registry를 순회해 목록을 만들기 때문에, 새 Command를
 * 등록하기만 하면 자동으로 안내에 반영된다.
 */
export class CommandRegistry {
  private readonly commands = new Map<string, DiscordTextCommand>();

  register(command: DiscordTextCommand): void {
    this.commands.set(command.name, command);
  }

  find(name: string): DiscordTextCommand | undefined {
    return this.commands.get(name);
  }

  list(): DiscordTextCommand[] {
    return [...this.commands.values()];
  }
}
