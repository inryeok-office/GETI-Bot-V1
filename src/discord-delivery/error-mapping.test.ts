import { describe, expect, it } from 'vitest';
import { mapDiscordError } from './error-mapping.js';

describe('mapDiscordError', () => {
  it('maps UnknownChannel (10003) to CHANNEL_NOT_FOUND', () => {
    const result = mapDiscordError({ code: 10003, message: 'Unknown Channel' });
    expect(result.code).toBe('CHANNEL_NOT_FOUND');
    expect(result.retryable).toBe(false);
  });

  it('maps UnknownMessage (10008) to MESSAGE_NOT_FOUND', () => {
    const result = mapDiscordError({ code: 10008, message: 'Unknown Message' });
    expect(result.code).toBe('MESSAGE_NOT_FOUND');
    expect(result.retryable).toBe(false);
  });

  it('maps MissingAccess (50001) to MISSING_PERMISSION', () => {
    const result = mapDiscordError({ code: 50001, message: 'Missing Access' });
    expect(result.code).toBe('MISSING_PERMISSION');
  });

  it('maps MissingPermissions (50013) to MISSING_PERMISSION', () => {
    const result = mapDiscordError({ code: 50013, message: 'Missing Permissions' });
    expect(result.code).toBe('MISSING_PERMISSION');
  });

  it('maps HTTP 429 to RATE_LIMITED with retryable true', () => {
    const result = mapDiscordError({ status: 429, message: 'You are being rate limited' });
    expect(result.code).toBe('RATE_LIMITED');
    expect(result.retryable).toBe(true);
  });

  it('maps HTTP 5xx to DISCORD_UNAVAILABLE with retryable true', () => {
    const result = mapDiscordError({ status: 503, message: 'Service Unavailable' });
    expect(result.code).toBe('DISCORD_UNAVAILABLE');
    expect(result.retryable).toBe(true);
  });

  it('maps other Discord API errors to DISCORD_API_ERROR', () => {
    const result = mapDiscordError({ status: 400, code: 50035, message: 'Invalid Form Body' });
    expect(result.code).toBe('DISCORD_API_ERROR');
  });

  it('maps unrecognized/network errors to DISCORD_UNAVAILABLE with retryable true', () => {
    const result = mapDiscordError(new Error('ENOTFOUND'));
    expect(result.code).toBe('DISCORD_UNAVAILABLE');
    expect(result.retryable).toBe(true);
  });

  it('does not leak the raw error message content into a generic form', () => {
    const result = mapDiscordError({
      code: 10003,
      message: 'Unknown Channel: some internal detail',
    });
    expect(result.message).not.toContain('internal detail');
  });
});
