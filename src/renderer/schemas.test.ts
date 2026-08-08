import { describe, expect, it } from 'vitest';
import {
  inquiryCreatedDataSchema,
  jobPublishedDataSchema,
  programPublishedDataSchema,
} from './schemas.js';

describe('jobPublishedDataSchema', () => {
  it('accepts a valid payload', () => {
    const result = jobPublishedDataSchema.safeParse({
      jobId: 'job-1',
      title: '백엔드 개발자 채용',
      companyName: 'GETI',
      location: '서울',
      employmentType: '정규직',
      deadline: '2026-09-01',
      url: 'https://example.com/jobs/1',
    });
    expect(result.success).toBe(true);
  });

  it('accepts a payload with only required fields', () => {
    const result = jobPublishedDataSchema.safeParse({ jobId: 'job-1', title: '채용 공고' });
    expect(result.success).toBe(true);
  });

  it('rejects a missing title', () => {
    const result = jobPublishedDataSchema.safeParse({ jobId: 'job-1' });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid url', () => {
    const result = jobPublishedDataSchema.safeParse({
      jobId: 'job-1',
      title: '채용 공고',
      url: 'not-a-url',
    });
    expect(result.success).toBe(false);
  });

  it('rejects unknown extra fields', () => {
    const result = jobPublishedDataSchema.safeParse({
      jobId: 'job-1',
      title: '채용 공고',
      phone: '010-1234-5678',
    });
    expect(result.success).toBe(false);
  });
});

describe('programPublishedDataSchema', () => {
  it('accepts a valid payload', () => {
    const result = programPublishedDataSchema.safeParse({
      programId: 'program-1',
      title: '창업 캠프',
      description: '초기 창업팀을 위한 프로그램입니다.',
      startAt: '2026-09-01',
      endAt: '2026-10-01',
    });
    expect(result.success).toBe(true);
  });
});

describe('inquiryCreatedDataSchema', () => {
  it('accepts minimal metadata only', () => {
    const result = inquiryCreatedDataSchema.safeParse({
      inquiryId: 'inquiry-1',
      category: '이용문의',
      requesterName: '홍길동',
      submittedAt: '2026-08-08T12:00:00Z',
    });
    expect(result.success).toBe(true);
  });

  it('accepts a payload with only inquiryId', () => {
    const result = inquiryCreatedDataSchema.safeParse({ inquiryId: 'inquiry-1' });
    expect(result.success).toBe(true);
  });

  it('rejects a phone number field (sensitive data must never reach the renderer)', () => {
    const result = inquiryCreatedDataSchema.safeParse({
      inquiryId: 'inquiry-1',
      phone: '010-1234-5678',
    });
    expect(result.success).toBe(false);
  });

  it('rejects an email field', () => {
    const result = inquiryCreatedDataSchema.safeParse({
      inquiryId: 'inquiry-1',
      email: 'user@example.com',
    });
    expect(result.success).toBe(false);
  });

  it('rejects a fileUrl field', () => {
    const result = inquiryCreatedDataSchema.safeParse({
      inquiryId: 'inquiry-1',
      fileUrl: 'https://example.com/attachment.pdf',
    });
    expect(result.success).toBe(false);
  });

  it('rejects a full inquiry content field', () => {
    const result = inquiryCreatedDataSchema.safeParse({
      inquiryId: 'inquiry-1',
      content: '문의 전문입니다...',
    });
    expect(result.success).toBe(false);
  });

  it('rejects a token field', () => {
    const result = inquiryCreatedDataSchema.safeParse({
      inquiryId: 'inquiry-1',
      token: 'secret-token',
    });
    expect(result.success).toBe(false);
  });
});
