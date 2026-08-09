import { describe, expect, it } from 'vitest';
import { loadEnv } from './env.js';

describe('loadEnv', () => {
  it('applies defaults when optional variables are missing', () => {
    const env = loadEnv({});

    expect(env.NODE_ENV).toBe('development');
    expect(env.PORT).toBe(3000);
    expect(env.LOG_LEVEL).toBe('info');
    expect(env.DISCORD_BOT_TOKEN).toBeUndefined();
  });

  it('does not require DISCORD_BOT_TOKEN to succeed', () => {
    expect(() => loadEnv({ NODE_ENV: 'test' })).not.toThrow();
  });

  it('coerces PORT to a number', () => {
    const env = loadEnv({ PORT: '4000' });
    expect(env.PORT).toBe(4000);
  });

  it('parses provided values', () => {
    const env = loadEnv({
      NODE_ENV: 'production',
      PORT: '8080',
      DISCORD_BOT_TOKEN: 'token-value',
      DISCORD_APPLICATION_ID: 'app-id',
      GETI_INTERNAL_API_KEY: 'api-key',
      LOG_LEVEL: 'debug',
    });

    expect(env).toMatchObject({
      NODE_ENV: 'production',
      PORT: 8080,
      DISCORD_BOT_TOKEN: 'token-value',
      DISCORD_APPLICATION_ID: 'app-id',
      GETI_INTERNAL_API_KEY: 'api-key',
      LOG_LEVEL: 'debug',
    });
  });

  it('throws with a readable message when NODE_ENV is invalid', () => {
    expect(() => loadEnv({ NODE_ENV: 'staging' })).toThrow(/NODE_ENV/);
  });

  it('requires GETI_INTERNAL_API_KEY when NODE_ENV is production', () => {
    expect(() => loadEnv({ NODE_ENV: 'production', DISCORD_BOT_TOKEN: 'token-value' })).toThrow(
      /GETI_INTERNAL_API_KEY/,
    );
  });

  it('requires DISCORD_BOT_TOKEN when NODE_ENV is production', () => {
    expect(() => loadEnv({ NODE_ENV: 'production', GETI_INTERNAL_API_KEY: 'api-key' })).toThrow(
      /DISCORD_BOT_TOKEN/,
    );
  });

  it('does not require GETI_INTERNAL_API_KEY or DISCORD_BOT_TOKEN outside production', () => {
    expect(() => loadEnv({ NODE_ENV: 'development' })).not.toThrow();
    expect(() => loadEnv({ NODE_ENV: 'test' })).not.toThrow();
  });

  it('succeeds in production when DISCORD_BOT_TOKEN and GETI_INTERNAL_API_KEY are both set', () => {
    expect(() =>
      loadEnv({
        NODE_ENV: 'production',
        DISCORD_BOT_TOKEN: 'token-value',
        GETI_INTERNAL_API_KEY: 'api-key',
      }),
    ).not.toThrow();
  });

  it('reports both missing production requirements at once', () => {
    expect(() => loadEnv({ NODE_ENV: 'production' })).toThrow(
      /DISCORD_BOT_TOKEN.*GETI_INTERNAL_API_KEY|GETI_INTERNAL_API_KEY.*DISCORD_BOT_TOKEN/,
    );
  });
});
