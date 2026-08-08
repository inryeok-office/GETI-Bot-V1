/**
 * Internal API 공통 Error Contract.
 *
 * Discord/기타 내부 오류를 이 최소 ErrorCode 집합으로 매핑하여 응답한다.
 * Raw Discord.js Error나 Stack Trace는 응답에 절대 포함하지 않는다.
 */
export const ERROR_CODES = [
  'INVALID_REQUEST',
  'UNAUTHORIZED',
  'CHANNEL_NOT_FOUND',
  'MESSAGE_NOT_FOUND',
  'MISSING_PERMISSION',
  'RATE_LIMITED',
  'DISCORD_UNAVAILABLE',
  'DISCORD_API_ERROR',
  'INTERNAL_ERROR',
] as const;
export type ErrorCode = (typeof ERROR_CODES)[number];

const ERROR_STATUS: Record<ErrorCode, number> = {
  INVALID_REQUEST: 400,
  UNAUTHORIZED: 401,
  CHANNEL_NOT_FOUND: 404,
  MESSAGE_NOT_FOUND: 404,
  MISSING_PERMISSION: 403,
  RATE_LIMITED: 429,
  DISCORD_UNAVAILABLE: 503,
  DISCORD_API_ERROR: 502,
  INTERNAL_ERROR: 500,
};

/**
 * Error별 기본 재시도 가능 여부.
 * DISCORD_API_ERROR는 상황에 따라 달라질 수 있어 호출부에서 명시적으로
 * override할 수 있다.
 */
const DEFAULT_RETRYABLE: Record<ErrorCode, boolean> = {
  INVALID_REQUEST: false,
  UNAUTHORIZED: false,
  CHANNEL_NOT_FOUND: false,
  MESSAGE_NOT_FOUND: false,
  MISSING_PERMISSION: false,
  RATE_LIMITED: true,
  DISCORD_UNAVAILABLE: true,
  DISCORD_API_ERROR: false,
  INTERNAL_ERROR: false,
};

export class ApiError extends Error {
  readonly code: ErrorCode;
  readonly retryable: boolean;

  constructor(code: ErrorCode, message: string, retryable: boolean = DEFAULT_RETRYABLE[code]) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.retryable = retryable;
  }
}

export function statusForErrorCode(code: ErrorCode): number {
  return ERROR_STATUS[code];
}

export interface ErrorResponseBody {
  code: ErrorCode;
  message: string;
  retryable: boolean;
  requestId: string;
}

export function buildErrorResponse(error: ApiError, requestId: string): ErrorResponseBody {
  return {
    code: error.code,
    message: error.message,
    retryable: error.retryable,
    requestId,
  };
}

/**
 * Route Handler에서 잡히지 않은 임의의 오류를 안전한 ApiError로 변환한다.
 * 이미 ApiError인 경우 그대로 사용하고, 그 외에는 세부 정보를 감춘
 * INTERNAL_ERROR로 대체한다.
 */
export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }
  return new ApiError('INTERNAL_ERROR', 'Unexpected internal error');
}
