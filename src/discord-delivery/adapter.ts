import type { APIEmbed, Client, GuildTextBasedChannel, MessageEditOptions } from 'discord.js';
import { ApiError } from '../internal-api/error.js';
import type { RenderedEmbed } from '../renderer/types.js';
import { mapDiscordError } from './error-mapping.js';
import type { DiscordMessageAdapter, DiscordSendPayload } from './types.js';

function toAPIEmbed(embed: RenderedEmbed): APIEmbed {
  return {
    title: embed.title,
    description: embed.description,
    url: embed.url,
    color: embed.color,
    fields: embed.fields,
    timestamp: embed.timestamp,
  };
}

/**
 * discord.js Client를 감싸는 Adapter 구현.
 *
 * Command Handler가 discord.js에 직접 의존하지 않도록 이 파일에서만
 * discord.js Client API를 호출한다.
 */
export class DiscordJsMessageAdapter implements DiscordMessageAdapter {
  constructor(private readonly client: Client) {}

  async sendMessage(channelId: string, payload: DiscordSendPayload): Promise<string> {
    const channel = await this.fetchSendableChannel(channelId);

    try {
      const message = await channel.send({
        content: payload.content,
        embeds: payload.embeds.map(toAPIEmbed),
        allowedMentions: payload.allowedMentions,
      });
      return message.id;
    } catch (error) {
      throw mapDiscordError(error);
    }
  }

  async editMessage(
    channelId: string,
    messageId: string,
    payload: DiscordSendPayload,
  ): Promise<string> {
    const channel = await this.fetchSendableChannel(channelId);

    let existing;
    try {
      existing = await channel.messages.fetch(messageId);
    } catch (error) {
      throw mapDiscordError(error);
    }

    const options: MessageEditOptions = {
      embeds: payload.embeds.map(toAPIEmbed),
      allowedMentions: payload.allowedMentions,
    };
    // content가 undefined면 key 자체를 생략해 기존 Message의 content를 그대로 둔다.
    // (명시적으로 undefined를 전달하는 것과 discord.js 상에서 다르게 취급될 수 있어
    // 의도를 명확히 하기 위해 조건부로만 설정한다.)
    if (payload.content !== undefined) {
      options.content = payload.content;
    }

    try {
      const edited = await existing.edit(options);
      return edited.id;
    } catch (error) {
      throw mapDiscordError(error);
    }
  }

  private async fetchSendableChannel(channelId: string): Promise<GuildTextBasedChannel> {
    let channel;
    try {
      channel = await this.client.channels.fetch(channelId);
    } catch (error) {
      throw mapDiscordError(error);
    }

    if (!channel || channel.isDMBased() || !channel.isTextBased()) {
      throw new ApiError(
        'CHANNEL_NOT_FOUND',
        'Discord channel not found or not a guild text channel',
      );
    }

    return channel;
  }
}
