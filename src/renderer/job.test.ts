import { describe, expect, it } from 'vitest';
import { EMBED_LIMITS } from './limits.js';
import { renderJobClosed, renderJobDeleted, renderJobPublished, renderJobUpdated } from './job.js';

describe('renderJobPublished', () => {
  it('renders title, url, and optional fields', () => {
    const result = renderJobPublished({
      jobId: 'job-1',
      title: '백엔드 개발자',
      companyName: 'GETI',
      location: '서울',
      employmentType: '정규직',
      deadline: '2026-09-01',
      url: 'https://example.com/jobs/1',
    });

    expect(result.embeds).toHaveLength(1);
    const embed = result.embeds[0];
    expect(embed.title).toContain('백엔드 개발자');
    expect(embed.url).toBe('https://example.com/jobs/1');
    expect(embed.fields).toEqual([
      { name: '회사', value: 'GETI', inline: true },
      { name: '근무지', value: '서울', inline: true },
      { name: '고용형태', value: '정규직', inline: true },
      { name: '마감일', value: '2026-09-01', inline: true },
    ]);
  });

  it('omits fields that were not provided', () => {
    const result = renderJobPublished({ jobId: 'job-1', title: '채용 공고' });
    expect(result.embeds[0].fields).toEqual([]);
    expect(result.embeds[0].url).toBeUndefined();
  });

  it('truncates an overly long title to the Discord embed title limit', () => {
    const result = renderJobPublished({ jobId: 'job-1', title: 'a'.repeat(500) });
    expect(result.embeds[0].title!.length).toBeLessThanOrEqual(EMBED_LIMITS.TITLE);
  });
});

describe('renderJobUpdated', () => {
  it('includes the changes summary as description when provided', () => {
    const result = renderJobUpdated({ jobId: 'job-1', title: '채용 공고', changes: '마감일 연장' });
    expect(result.embeds[0].description).toBe('마감일 연장');
  });

  it('omits description when changes is not provided', () => {
    const result = renderJobUpdated({ jobId: 'job-1', title: '채용 공고' });
    expect(result.embeds[0].description).toBeUndefined();
  });
});

describe('renderJobClosed', () => {
  it('includes the reason as description when provided', () => {
    const result = renderJobClosed({
      jobId: 'job-1',
      title: '채용 공고',
      reason: '모집 인원 충족',
    });
    expect(result.embeds[0].description).toBe('모집 인원 충족');
  });
});

describe('renderJobDeleted', () => {
  it('does not include a link (deleted postings are not linked back)', () => {
    const result = renderJobDeleted({ jobId: 'job-1', title: '채용 공고', reason: '오등록' });
    expect(result.embeds[0].url).toBeUndefined();
    expect(result.embeds[0].description).toContain('삭제되었습니다');
    expect(result.embeds[0].description).toContain('오등록');
  });

  it('has a sensible default description without a reason', () => {
    const result = renderJobDeleted({ jobId: 'job-1', title: '채용 공고' });
    expect(result.embeds[0].description).toBe('이 공고는 삭제되었습니다.');
  });
});
