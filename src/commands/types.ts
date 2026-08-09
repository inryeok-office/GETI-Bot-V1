/**
 * Prefix Command 응답에 사용하는 최소 Embed 표현.
 *
 * `renderer/types.ts`의 `RenderedEmbed`(GETI Server → Discord 메시지 전달
 * 파이프라인 전용)와 의도적으로 분리한다. Prefix Command는 GETI Server
 * Command와 무관한 Discord 자체 기능이므로, 두 파이프라인의 Embed
 * Mention 정책을 섞지 않는다.
 */
export interface CommandEmbedField {
  name: string;
  value: string;
}

export interface CommandEmbed {
  title: string;
  description?: string;
  color?: number;
  fields?: CommandEmbedField[];
  footer?: string;
  timestamp?: string;
}

/** Command 실행이 사용자에게 응답을 보낼 때 사용하는 최소 Context. */
export interface CommandContext {
  reply(embed: CommandEmbed): Promise<void>;
}

/**
 * `!` Prefix Command 하나를 나타낸다.
 *
 * `name`은 Prefix(`!`)를 제외하고 공백을 정규화한 명령어 문자열이다
 * (예: `명령어`, `상태 봇`).
 */
export interface DiscordTextCommand {
  name: string;
  usage: string;
  description: string;
  execute(context: CommandContext): Promise<void>;
}
