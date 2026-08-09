import { timingSafeEqual } from 'node:crypto';

/**
 * X-Internal-Api-Key Header 값을 기대값과 비교한다.
 * 문자열 길이 차이로 인한 타이밍 정보 노출을 줄이기 위해 가능한 경우
 * Node.js의 timingSafeEqual을 사용한다.
 */
export function isValidInternalApiKey(candidate: string | undefined, expected: string): boolean {
  if (!candidate) return false;

  const candidateBuffer = Buffer.from(candidate);
  const expectedBuffer = Buffer.from(expected);

  if (candidateBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(candidateBuffer, expectedBuffer);
}
