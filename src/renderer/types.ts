/**
 * Renderer가 만들어내는 결과 타입.
 *
 * discord.js에 직접 의존하지 않는 순수 데이터 구조로 정의한다. Discord
 * 전송을 담당하는 Delivery 계층(Phase 3)에서 이 값을 discord.js가 요구하는
 * 형태로 얇게 변환한다.
 */
export interface RenderedEmbedField {
  name: string;
  value: string;
  inline?: boolean;
}

export interface RenderedEmbed {
  title?: string;
  description?: string;
  url?: string;
  color?: number;
  fields?: RenderedEmbedField[];
  timestamp?: string;
}

export interface RenderedDiscordMessage {
  embeds: RenderedEmbed[];
}

/**
 * Template별 data가 Zod Schema를 통과하지 못했을 때 던지는 오류.
 *
 * Renderer는 HTTP/Error Contract를 알지 못한다. 이 오류를 Internal API의
 * ErrorCode로 변환하는 책임은 Renderer를 호출하는 쪽(Discord Message
 * Service, Phase 3)에 있다.
 */
export class RenderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RenderError';
  }
}
