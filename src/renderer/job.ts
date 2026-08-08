import { EMBED_COLORS } from './colors.js';
import { EMBED_LIMITS, truncate } from './limits.js';
import type { JobClosedData, JobDeletedData, JobPublishedData, JobUpdatedData } from './schemas.js';
import type { RenderedDiscordMessage, RenderedEmbedField } from './types.js';

function field(name: string, value: string | undefined): RenderedEmbedField | undefined {
  if (!value) return undefined;
  return { name, value: truncate(value, EMBED_LIMITS.FIELD_VALUE), inline: true };
}

export function renderJobPublished(data: JobPublishedData): RenderedDiscordMessage {
  const fields = [
    field('회사', data.companyName),
    field('근무지', data.location),
    field('고용형태', data.employmentType),
    field('마감일', data.deadline),
  ].filter((value): value is RenderedEmbedField => value !== undefined);

  return {
    embeds: [
      {
        title: truncate(`📢 새 공고: ${data.title}`, EMBED_LIMITS.TITLE),
        url: data.url,
        color: EMBED_COLORS.PUBLISHED,
        fields,
        timestamp: new Date().toISOString(),
      },
    ],
  };
}

export function renderJobUpdated(data: JobUpdatedData): RenderedDiscordMessage {
  return {
    embeds: [
      {
        title: truncate(`✏️ 공고 수정: ${data.title}`, EMBED_LIMITS.TITLE),
        description: data.changes ? truncate(data.changes, EMBED_LIMITS.DESCRIPTION) : undefined,
        url: data.url,
        color: EMBED_COLORS.UPDATED,
        timestamp: new Date().toISOString(),
      },
    ],
  };
}

export function renderJobClosed(data: JobClosedData): RenderedDiscordMessage {
  return {
    embeds: [
      {
        title: truncate(`🔒 공고 마감: ${data.title}`, EMBED_LIMITS.TITLE),
        description: data.reason ? truncate(data.reason, EMBED_LIMITS.DESCRIPTION) : undefined,
        url: data.url,
        color: EMBED_COLORS.CLOSED,
        timestamp: new Date().toISOString(),
      },
    ],
  };
}

export function renderJobDeleted(data: JobDeletedData): RenderedDiscordMessage {
  const description = data.reason
    ? `이 공고는 삭제되었습니다. (${data.reason})`
    : '이 공고는 삭제되었습니다.';

  return {
    embeds: [
      {
        title: truncate(`🗑️ 삭제된 공고: ${data.title}`, EMBED_LIMITS.TITLE),
        description: truncate(description, EMBED_LIMITS.DESCRIPTION),
        color: EMBED_COLORS.DELETED,
        timestamp: new Date().toISOString(),
      },
    ],
  };
}
