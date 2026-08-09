import { describe, expect, it } from 'vitest';
import type { IncomingMessage } from 'node:http';
import { resolveRequestId } from './request-id.js';

function fakeRequest(headers: Record<string, string | string[] | undefined>): IncomingMessage {
  return { headers } as unknown as IncomingMessage;
}

describe('resolveRequestId', () => {
  it('uses the X-Request-Id header when present', () => {
    const request = fakeRequest({ 'x-request-id': 'req-from-header' });
    expect(resolveRequestId(request)).toBe('req-from-header');
  });

  it('uses the first value when the header is an array', () => {
    const request = fakeRequest({ 'x-request-id': ['first', 'second'] });
    expect(resolveRequestId(request)).toBe('first');
  });

  it('generates a new id when the header is missing', () => {
    const request = fakeRequest({});
    const id = resolveRequestId(request);
    expect(id.length).toBeGreaterThan(0);
  });

  it('generates a new id when the header is blank', () => {
    const request = fakeRequest({ 'x-request-id': '   ' });
    const id = resolveRequestId(request);
    expect(id.trim()).not.toBe('');
    expect(id).not.toBe('   ');
  });
});
