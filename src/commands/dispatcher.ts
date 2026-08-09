import type { APIEmbed, Client, Message } from 'discord.js';
import type { Logger } from 'pino';
import type { CommandRegistry } from './registry.js';
import { parseCommand } from './parser.js';
import type { CommandEmbed } from './types.js';

const UNKNOWN_COMMAND_REPLY =
  '알 수 없는 명령어입니다. `!명령어`로 사용 가능한 명령어를 확인하세요.';

function toAPIEmbed(embed: CommandEmbed): APIEmbed {
  return {
    title: embed.title,
    description: embed.description,
    color: embed.color,
    fields: embed.fields,
    footer: embed.footer ? { text: embed.footer } : undefined,
    timestamp: embed.timestamp,
  };
}

/**
 * discord.js `messageCreate` Event를 Prefix Command Registry로 연결한다.
 *
 * 하나의 Command 실행 실패가 Bot Process를 종료시키지 않도록 모든 처리는
 * 안전하게 catch한다. 사용자 Message의 원문 내용은 로그에 남기지 않는다.
 */
export function registerCommandListener(
  client: Client,
  registry: CommandRegistry,
  logger: Logger,
): void {
  client.on('messageCreate', (message: Message) => {
    void dispatchMessage(message, registry, logger);
  });
}

/**
 * Message 하나를 Parsing해 등록된 Command로 연결한다.
 * `registerCommandListener`에서 분리해 discord.js EventEmitter 없이도 직접
 * Unit Test할 수 있게 한다.
 */
export async function dispatchMessage(
  message: Message,
  registry: CommandRegistry,
  logger: Logger,
): Promise<void> {
  // Bot(자신 포함)과 Webhook 메시지는 무시한다.
  if (message.author.bot || message.webhookId) return;
  // DM은 현재 범위에서 처리하지 않고, Guild Message만 처리한다.
  if (!message.inGuild()) return;

  const parsed = parseCommand(message.content);
  if (!parsed) return;

  const command = registry.find(parsed.name);
  if (!command) {
    await safeReplyText(message, logger, undefined, UNKNOWN_COMMAND_REPLY);
    return;
  }

  try {
    await command.execute({
      reply: async (embed) => {
        await message.reply({
          embeds: [toAPIEmbed(embed)],
          allowedMentions: { repliedUser: false },
        });
      },
    });
  } catch {
    logger.warn(
      { commandName: command.name, guildId: message.guildId, channelId: message.channelId },
      'Failed to execute prefix command',
    );
  }
}

async function safeReplyText(
  message: Message,
  logger: Logger,
  commandName: string | undefined,
  content: string,
): Promise<void> {
  try {
    await message.reply({ content, allowedMentions: { repliedUser: false } });
  } catch {
    logger.warn(
      { commandName, guildId: message.guildId, channelId: message.channelId },
      'Failed to send prefix command reply',
    );
  }
}
