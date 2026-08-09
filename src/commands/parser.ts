const PREFIX = '!';

export interface ParsedCommand {
  /** Prefix를 제외하고 공백을 정규화한 명령어 이름 (예: `명령어`, `상태 봇`). */
  name: string;
}

/**
 * Discord Message content를 Prefix Command로 Parsing한다.
 *
 * - 앞뒤 공백을 허용한다.
 * - 명령어 사이 여러 공백을 단일 공백으로 정규화한다.
 * - `!`로 시작하지 않거나 명령어 이름이 비어 있으면 Command가 아니다.
 */
export function parseCommand(content: string): ParsedCommand | null {
  const trimmed = content.trim();
  if (!trimmed.startsWith(PREFIX)) {
    return null;
  }

  const tokens = trimmed
    .slice(PREFIX.length)
    .split(/\s+/)
    .filter((token) => token.length > 0);

  if (tokens.length === 0) {
    return null;
  }

  return { name: tokens.join(' ') };
}
