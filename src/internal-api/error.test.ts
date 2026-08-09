import { describe, expect, it } from 'vitest';
import { ApiError, buildErrorResponse, statusForErrorCode, toApiError } from './error.js';

describe('ApiError', () => {
  it('applies the default retryable value for its code when not overridden', () => {
    const rateLimited = new ApiError('RATE_LIMITED', 'slow down');
    expect(rateLimited.retryable).toBe(true);

    const invalid = new ApiError('INVALID_REQUEST', 'bad request');
    expect(invalid.retryable).toBe(false);
  });

  it('allows overriding the retryable flag explicitly', () => {
    const error = new ApiError('DISCORD_API_ERROR', 'transient', true);
    expect(error.retryable).toBe(true);
  });
});

describe('statusForErrorCode', () => {
  it('maps each error code to the expected HTTP status', () => {
    expect(statusForErrorCode('INVALID_REQUEST')).toBe(400);
    expect(statusForErrorCode('UNAUTHORIZED')).toBe(401);
    expect(statusForErrorCode('MISSING_PERMISSION')).toBe(403);
    expect(statusForErrorCode('CHANNEL_NOT_FOUND')).toBe(404);
    expect(statusForErrorCode('MESSAGE_NOT_FOUND')).toBe(404);
    expect(statusForErrorCode('RATE_LIMITED')).toBe(429);
    expect(statusForErrorCode('DISCORD_API_ERROR')).toBe(502);
    expect(statusForErrorCode('DISCORD_UNAVAILABLE')).toBe(503);
    expect(statusForErrorCode('INTERNAL_ERROR')).toBe(500);
  });
});

describe('buildErrorResponse', () => {
  it('includes code/message/retryable/requestId and nothing else', () => {
    const error = new ApiError('CHANNEL_NOT_FOUND', 'channel missing');
    const response = buildErrorResponse(error, 'req-1');

    expect(response).toEqual({
      code: 'CHANNEL_NOT_FOUND',
      message: 'channel missing',
      retryable: false,
      requestId: 'req-1',
    });
  });
});

describe('toApiError', () => {
  it('returns the same instance when already an ApiError', () => {
    const original = new ApiError('MISSING_PERMISSION', 'no permission');
    expect(toApiError(original)).toBe(original);
  });

  it('wraps unknown errors into a safe INTERNAL_ERROR without leaking details', () => {
    const wrapped = toApiError(new Error('discord.js internal stack trace details'));

    expect(wrapped).toBeInstanceOf(ApiError);
    expect(wrapped.code).toBe('INTERNAL_ERROR');
    expect(wrapped.retryable).toBe(false);
    expect(wrapped.message).not.toContain('stack trace');
  });

  it('wraps non-error thrown values', () => {
    const wrapped = toApiError('a plain string throw');
    expect(wrapped.code).toBe('INTERNAL_ERROR');
  });
});
