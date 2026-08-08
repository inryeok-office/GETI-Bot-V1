import { randomUUID } from 'node:crypto';
import type { IncomingMessage } from 'node:http';

/**
 * X-Request-Id Header 값을 분산 요청 추적용 Request Id로 사용한다.
 * 값이 없거나 비어 있으면 새 Id를 생성한다.
 */
export function resolveRequestId(request: IncomingMessage): string {
  const header = request.headers['x-request-id'];
  const value = Array.isArray(header) ? header[0] : header;

  if (value && value.trim().length > 0) {
    return value;
  }

  return randomUUID();
}
