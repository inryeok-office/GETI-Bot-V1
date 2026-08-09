import { describe, expect, it } from 'vitest';
import {
  renderProgramClosed,
  renderProgramDeleted,
  renderProgramPublished,
  renderProgramUpdated,
} from './program.js';

describe('renderProgramPublished', () => {
  it('renders title, description, and a period field when start/end are provided', () => {
    const result = renderProgramPublished({
      programId: 'program-1',
      title: '창업 캠프',
      description: '초기 창업팀을 위한 프로그램입니다.',
      startAt: '2026-09-01',
      endAt: '2026-10-01',
      url: 'https://example.com/programs/1',
    });

    const embed = result.embeds[0];
    expect(embed.title).toContain('창업 캠프');
    expect(embed.description).toBe('초기 창업팀을 위한 프로그램입니다.');
    expect(embed.fields).toEqual([{ name: '운영 기간', value: '2026-09-01 ~ 2026-10-01' }]);
  });

  it('omits the period field when neither startAt nor endAt is provided', () => {
    const result = renderProgramPublished({ programId: 'program-1', title: '프로그램' });
    expect(result.embeds[0].fields).toEqual([]);
  });
});

describe('renderProgramUpdated', () => {
  it('includes the changes summary as description when provided', () => {
    const result = renderProgramUpdated({
      programId: 'program-1',
      title: '프로그램',
      changes: '모집 인원 확대',
    });
    expect(result.embeds[0].description).toBe('모집 인원 확대');
  });
});

describe('renderProgramClosed', () => {
  it('includes the reason as description when provided', () => {
    const result = renderProgramClosed({
      programId: 'program-1',
      title: '프로그램',
      reason: '모집 마감',
    });
    expect(result.embeds[0].description).toBe('모집 마감');
  });
});

describe('renderProgramDeleted', () => {
  it('has a sensible default description without a reason', () => {
    const result = renderProgramDeleted({ programId: 'program-1', title: '프로그램' });
    expect(result.embeds[0].description).toBe('이 프로그램은 삭제되었습니다.');
  });
});
