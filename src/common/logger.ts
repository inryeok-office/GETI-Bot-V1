import pino, { type Logger } from 'pino';

/**
 * 로그에 절대 노출되면 안 되는 필드 목록.
 * pino의 redact 옵션으로 값을 자동으로 마스킹한다.
 */
const REDACT_PATHS = [
  'token',
  'discordBotToken',
  'apiKey',
  'authorization',
  'req.headers.authorization',
  '*.token',
  '*.apiKey',
  '*.authorization',
];

export interface CreateLoggerOptions {
  level: string;
  pretty?: boolean;
}

/**
 * 애플리케이션 전역에서 사용할 구조화 Logger를 생성한다.
 */
export function createLogger(options: CreateLoggerOptions): Logger {
  const { level, pretty = false } = options;

  return pino({
    level,
    redact: {
      paths: REDACT_PATHS,
      censor: '[REDACTED]',
    },
    transport: pretty
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
          },
        }
      : undefined,
  });
}
