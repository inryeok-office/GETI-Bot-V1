import { describe, expect, it } from 'vitest';
import { renderInquiryCreated } from './inquiry.js';

describe('renderInquiryCreated', () => {
  it('renders minimal identifying fields only', () => {
    const result = renderInquiryCreated({
      inquiryId: 'inquiry-1',
      category: '이용문의',
      requesterName: '홍길동',
      submittedAt: '2026-08-08T12:00:00Z',
    });

    const embed = result.embeds[0];
    expect(embed.title).toBe('📩 새 문의가 접수되었습니다');
    expect(embed.fields).toEqual([
      { name: '문의 ID', value: 'inquiry-1', inline: true },
      { name: '분류', value: '이용문의', inline: true },
      { name: '접수자', value: '홍길동', inline: true },
      { name: '접수 시각', value: '2026-08-08T12:00:00Z', inline: true },
    ]);
  });

  it('never includes phone/email/token/file-url-shaped content, since the type only carries the allowed fields', () => {
    const result = renderInquiryCreated({ inquiryId: 'inquiry-1' });
    const serialized = JSON.stringify(result);

    expect(serialized).not.toMatch(/@/); // no email-shaped content
    expect(serialized.toLowerCase()).not.toContain('token');
  });
});
