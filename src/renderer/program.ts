import { EMBED_COLORS } from './colors.js';
import { EMBED_LIMITS, truncate } from './limits.js';
import type {
  ProgramClosedData,
  ProgramDeletedData,
  ProgramPublishedData,
  ProgramUpdatedData,
} from './schemas.js';
import type { RenderedDiscordMessage } from './types.js';

export function renderProgramPublished(data: ProgramPublishedData): RenderedDiscordMessage {
  const period =
    data.startAt || data.endAt ? `${data.startAt ?? '?'} ~ ${data.endAt ?? '?'}` : undefined;

  return {
    embeds: [
      {
        title: truncate(`📢 새 프로그램: ${data.title}`, EMBED_LIMITS.TITLE),
        description: data.description
          ? truncate(data.description, EMBED_LIMITS.DESCRIPTION)
          : undefined,
        url: data.url,
        color: EMBED_COLORS.PUBLISHED,
        fields: period
          ? [{ name: '운영 기간', value: truncate(period, EMBED_LIMITS.FIELD_VALUE) }]
          : [],
        timestamp: new Date().toISOString(),
      },
    ],
  };
}

export function renderProgramUpdated(data: ProgramUpdatedData): RenderedDiscordMessage {
  return {
    embeds: [
      {
        title: truncate(`✏️ 프로그램 수정: ${data.title}`, EMBED_LIMITS.TITLE),
        description: data.changes ? truncate(data.changes, EMBED_LIMITS.DESCRIPTION) : undefined,
        url: data.url,
        color: EMBED_COLORS.UPDATED,
        timestamp: new Date().toISOString(),
      },
    ],
  };
}

export function renderProgramClosed(data: ProgramClosedData): RenderedDiscordMessage {
  return {
    embeds: [
      {
        title: truncate(`🔒 프로그램 모집 마감: ${data.title}`, EMBED_LIMITS.TITLE),
        description: data.reason ? truncate(data.reason, EMBED_LIMITS.DESCRIPTION) : undefined,
        url: data.url,
        color: EMBED_COLORS.CLOSED,
        timestamp: new Date().toISOString(),
      },
    ],
  };
}

export function renderProgramDeleted(data: ProgramDeletedData): RenderedDiscordMessage {
  const description = data.reason
    ? `이 프로그램은 삭제되었습니다. (${data.reason})`
    : '이 프로그램은 삭제되었습니다.';

  return {
    embeds: [
      {
        title: truncate(`🗑️ 삭제된 프로그램: ${data.title}`, EMBED_LIMITS.TITLE),
        description: truncate(description, EMBED_LIMITS.DESCRIPTION),
        color: EMBED_COLORS.DELETED,
        timestamp: new Date().toISOString(),
      },
    ],
  };
}
