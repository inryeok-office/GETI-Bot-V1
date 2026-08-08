/**
 * Discord Embed의 실제 제약.
 * https://discord.com/developers/docs/resources/message#embed-object-embed-limits
 */
export const EMBED_LIMITS = {
  TITLE: 256,
  DESCRIPTION: 4096,
  FIELD_NAME: 256,
  FIELD_VALUE: 1024,
  MAX_FIELDS: 25,
} as const;

/**
 * 주어진 길이를 넘는 텍스트를 말줄임표로 잘라낸다.
 * Renderer가 만드는 모든 Embed 텍스트는 이 함수를 거쳐 Discord 제한을
 * 넘지 않도록 한다.
 */
export function truncate(text: string, maxLength: number): string {
  const trimmed = text.trim();
  if (trimmed.length <= maxLength) {
    return trimmed;
  }
  if (maxLength <= 1) {
    return trimmed.slice(0, maxLength);
  }
  return `${trimmed.slice(0, maxLength - 1)}…`;
}
