import { describe, expect, it } from 'vitest';
import type {
  CreateDiscordMessageCommand,
  PatchDiscordMessageCommand,
  Template,
} from '../internal-api/types.js';
import { renderDiscordMessage } from './registry.js';
import { RenderError } from './types.js';

function createCommand(
  template: Template,
  data: Record<string, unknown>,
): CreateDiscordMessageCommand {
  return {
    action: 'CREATE',
    targetType: template.startsWith('JOB')
      ? 'JOB'
      : template.startsWith('PROGRAM')
        ? 'PROGRAM'
        : 'INQUIRY',
    template,
    channelId: 'channel-1',
    roleIds: [],
    data,
    requestId: 'req-1',
    idempotencyKey: 'idem-1',
  };
}

function patchCommand(
  template: Template,
  data: Record<string, unknown>,
): PatchDiscordMessageCommand {
  return {
    action: 'UPDATE',
    targetType: template.startsWith('JOB') ? 'JOB' : 'PROGRAM',
    template,
    channelId: 'channel-1',
    messageId: 'message-1',
    data,
    requestId: 'req-2',
  };
}

describe('renderDiscordMessage', () => {
  it('renders every CREATE-eligible template with minimal valid data', () => {
    const cases: Array<[Template, Record<string, unknown>]> = [
      ['JOB_PUBLISHED', { jobId: 'job-1', title: '채용 공고' }],
      ['PROGRAM_PUBLISHED', { programId: 'program-1', title: '프로그램' }],
      ['INQUIRY_CREATED', { inquiryId: 'inquiry-1' }],
    ];

    for (const [template, data] of cases) {
      const result = renderDiscordMessage(createCommand(template, data));
      expect(result.embeds.length).toBeGreaterThan(0);
    }
  });

  it('renders every PATCH-eligible template with minimal valid data', () => {
    const cases: Array<[Template, Record<string, unknown>]> = [
      ['JOB_UPDATED', { jobId: 'job-1', title: '채용 공고' }],
      ['JOB_CLOSED', { jobId: 'job-1', title: '채용 공고' }],
      ['JOB_DELETED', { jobId: 'job-1', title: '채용 공고' }],
      ['PROGRAM_UPDATED', { programId: 'program-1', title: '프로그램' }],
      ['PROGRAM_CLOSED', { programId: 'program-1', title: '프로그램' }],
      ['PROGRAM_DELETED', { programId: 'program-1', title: '프로그램' }],
    ];

    for (const [template, data] of cases) {
      const result = renderDiscordMessage(patchCommand(template, data));
      expect(result.embeds.length).toBeGreaterThan(0);
    }
  });

  it('throws a RenderError when data fails the template schema', () => {
    expect(() => renderDiscordMessage(createCommand('JOB_PUBLISHED', { jobId: 'job-1' }))).toThrow(
      RenderError,
    );
  });

  it('throws a RenderError when data contains fields disallowed for INQUIRY_CREATED', () => {
    expect(() =>
      renderDiscordMessage(
        createCommand('INQUIRY_CREATED', { inquiryId: 'inquiry-1', phone: '010' }),
      ),
    ).toThrow(RenderError);
  });
});
