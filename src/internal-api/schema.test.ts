import { describe, expect, it } from 'vitest';
import {
  createBodySchema,
  createHeadersSchema,
  patchBodySchema,
  patchParamsSchema,
} from './schema.js';

describe('createBodySchema', () => {
  const valid = {
    targetType: 'JOB' as const,
    action: 'CREATE' as const,
    template: 'JOB_PUBLISHED' as const,
    channelId: '1234567890',
    data: { title: '공고 제목' },
  };

  it('accepts a valid CREATE body and defaults roleIds to an empty array', () => {
    const result = createBodySchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.roleIds).toEqual([]);
    }
  });

  it('accepts explicit roleIds', () => {
    const result = createBodySchema.safeParse({ ...valid, roleIds: ['111', '222'] });
    expect(result.success).toBe(true);
  });

  it('rejects when template does not match targetType', () => {
    const result = createBodySchema.safeParse({ ...valid, targetType: 'PROGRAM' });
    expect(result.success).toBe(false);
  });

  it('rejects when action is not CREATE', () => {
    const result = createBodySchema.safeParse({ ...valid, action: 'UPDATE' });
    expect(result.success).toBe(false);
  });

  it('rejects an INQUIRY_CREATED template combined with a non-INQUIRY targetType', () => {
    const result = createBodySchema.safeParse({
      ...valid,
      targetType: 'JOB',
      template: 'INQUIRY_CREATED',
    });
    expect(result.success).toBe(false);
  });

  it('rejects an empty channelId', () => {
    const result = createBodySchema.safeParse({ ...valid, channelId: '' });
    expect(result.success).toBe(false);
  });

  it('rejects unknown extra fields', () => {
    const result = createBodySchema.safeParse({ ...valid, unexpected: 'field' });
    expect(result.success).toBe(false);
  });

  it('rejects more than the maximum number of roleIds', () => {
    const roleIds = Array.from({ length: 11 }, (_, i) => `role-${i}`);
    const result = createBodySchema.safeParse({ ...valid, roleIds });
    expect(result.success).toBe(false);
  });

  it('rejects data that is not an object', () => {
    const result = createBodySchema.safeParse({ ...valid, data: 'not-an-object' });
    expect(result.success).toBe(false);
  });
});

describe('patchBodySchema', () => {
  const valid = {
    targetType: 'JOB' as const,
    action: 'UPDATE' as const,
    template: 'JOB_UPDATED' as const,
    channelId: '1234567890',
    data: { title: '수정된 제목' },
  };

  it('accepts a valid PATCH body', () => {
    expect(patchBodySchema.safeParse(valid).success).toBe(true);
  });

  it('rejects CREATE as an action', () => {
    const result = patchBodySchema.safeParse({
      ...valid,
      action: 'CREATE',
      template: 'JOB_PUBLISHED',
    });
    expect(result.success).toBe(false);
  });

  it('rejects INQUIRY targetType since it has no PATCH-eligible template', () => {
    const result = patchBodySchema.safeParse({
      ...valid,
      targetType: 'INQUIRY',
      template: 'INQUIRY_CREATED',
    });
    expect(result.success).toBe(false);
  });

  it('rejects roleIds being present (Mention is not allowed on PATCH)', () => {
    const result = patchBodySchema.safeParse({ ...valid, roleIds: ['111'] });
    expect(result.success).toBe(false);
  });

  it('rejects when template action does not match the action field', () => {
    const result = patchBodySchema.safeParse({ ...valid, action: 'CLOSE_NOTICE' });
    expect(result.success).toBe(false);
  });
});

describe('patchParamsSchema', () => {
  it('accepts a non-empty messageId', () => {
    expect(patchParamsSchema.safeParse({ messageId: '123' }).success).toBe(true);
  });

  it('rejects an empty messageId', () => {
    expect(patchParamsSchema.safeParse({ messageId: '' }).success).toBe(false);
  });
});

describe('createHeadersSchema', () => {
  it('accepts headers containing a non-empty idempotency key', () => {
    const result = createHeadersSchema.safeParse({
      'x-idempotency-key': 'key-1',
      'x-request-id': 'req-1',
    });
    expect(result.success).toBe(true);
  });

  it('rejects when the idempotency key header is missing', () => {
    const result = createHeadersSchema.safeParse({ 'x-request-id': 'req-1' });
    expect(result.success).toBe(false);
  });

  it('rejects when the idempotency key header is blank', () => {
    const result = createHeadersSchema.safeParse({ 'x-idempotency-key': '   ' });
    expect(result.success).toBe(false);
  });
});
