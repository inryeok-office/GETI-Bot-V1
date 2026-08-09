import type { RenderedEmbed } from '../renderer/types.js';

/**
 * Discord Message 생성/수정에 필요한 Payload.
 * Renderer 결과(RenderedEmbed[])와 Mention 정책을 조합해 만든다.
 */
export interface DiscordSendPayload {
  embeds: RenderedEmbed[];
  /**
   * Role Mention 문자열(예: "<@&roleId>"). undefined면 Mention을 포함하지 않는다.
   * CREATE 최초 성공에서만 값이 채워진다.
   */
  content?: string;
  /**
   * Discord에 실제로 알림(Ping)을 허용할 대상.
   * parse는 항상 빈 배열로 고정해 @everyone/@here 및 암묵적 Mention 파싱을 막고,
   * roles에 명시된 Role Id만 알림을 받을 수 있다.
   */
  allowedMentions: { parse: []; roles: string[] };
}

/**
 * discord.js Client 호출을 감싸는 Adapter 계약.
 *
 * Command Handler는 이 Interface에만 의존하므로, 실제 discord.js Client 없이
 * Fake Adapter로 Unit Test할 수 있다.
 */
export interface DiscordMessageAdapter {
  /** Channel에 새 Message를 보내고 생성된 messageId를 반환한다. */
  sendMessage(channelId: string, payload: DiscordSendPayload): Promise<string>;
  /** 기존 Message를 수정하고 messageId를 반환한다. Message를 물리적으로 삭제하지 않는다. */
  editMessage(channelId: string, messageId: string, payload: DiscordSendPayload): Promise<string>;
}
