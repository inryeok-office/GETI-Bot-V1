import { RESTJSONErrorCodes } from 'discord.js';
import { ApiError } from '../internal-api/error.js';

/**
 * discord.js가 던지는 오류(DiscordAPIError/HTTPError 등)는 공통적으로
 * `code`(Discord API 고유 오류 코드) 또는 `status`(HTTP Status) 속성을
 * 가진다. 여기서는 실제 discord.js Error 클래스에 대한 `instanceof` 대신
 * 이 속성들로 판별한다 — 실제 오류와 Test용 Fake 오류를 동일하게 다룰 수
 * 있어 discord.js 내부 구현에 덜 의존하게 된다.
 */
interface DiscordLikeError {
  code?: number | string;
  status?: number;
  message?: string;
}

function isDiscordLikeError(error: unknown): error is DiscordLikeError {
  return typeof error === 'object' && error !== null && ('code' in error || 'status' in error);
}

/**
 * discord.js 오류를 Internal API의 Bot Error Contract(ErrorCode)로 변환한다.
 * Raw Discord.js Error나 Stack Trace는 그대로 노출하지 않는다.
 */
export function mapDiscordError(error: unknown): ApiError {
  if (!isDiscordLikeError(error)) {
    return new ApiError('DISCORD_UNAVAILABLE', 'Failed to reach Discord', true);
  }

  if (error.code === RESTJSONErrorCodes.UnknownChannel) {
    return new ApiError('CHANNEL_NOT_FOUND', 'Discord channel not found');
  }
  if (error.code === RESTJSONErrorCodes.UnknownMessage) {
    return new ApiError('MESSAGE_NOT_FOUND', 'Discord message not found');
  }
  if (
    error.code === RESTJSONErrorCodes.MissingAccess ||
    error.code === RESTJSONErrorCodes.MissingPermissions
  ) {
    return new ApiError('MISSING_PERMISSION', 'Bot lacks permission for this Discord operation');
  }
  if (error.status === 429) {
    return new ApiError('RATE_LIMITED', 'Discord rate limit exceeded');
  }
  if (typeof error.status === 'number' && error.status >= 500) {
    return new ApiError('DISCORD_UNAVAILABLE', 'Discord service unavailable', true);
  }
  if (typeof error.status === 'number' || typeof error.code !== 'undefined') {
    return new ApiError('DISCORD_API_ERROR', 'Discord API returned an error');
  }

  return new ApiError('DISCORD_UNAVAILABLE', 'Failed to reach Discord', true);
}
