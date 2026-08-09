import type { CommandRegistry } from './registry.js';
import type { CommandContext, DiscordTextCommand } from './types.js';

const HELP_EMBED_COLOR = 0x5865f2;
const FOOTER = 'GETI Discord Bot';

/**
 * `!명령어`: 현재 Registry에 등록된 모든 Command를 안내한다.
 * 목록을 하드코딩하지 않고 Registry를 그대로 순회하므로, 새 Command가
 * 등록되면 자동으로 반영된다.
 */
export function createHelpCommand(registry: CommandRegistry): DiscordTextCommand {
  return {
    name: '명령어',
    usage: '!명령어',
    description: '등록된 명령어 목록을 확인합니다.',
    async execute(context: CommandContext): Promise<void> {
      await context.reply({
        title: 'GETI Bot 명령어',
        description: '사용 가능한 명령어 목록입니다.',
        color: HELP_EMBED_COLOR,
        fields: registry.list().map((command) => ({
          name: command.usage,
          value: command.description,
        })),
        footer: FOOTER,
        timestamp: new Date().toISOString(),
      });
    },
  };
}
