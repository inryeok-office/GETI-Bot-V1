import { EMBED_COLORS } from './colors.js';
import { EMBED_LIMITS, truncate } from './limits.js';
import type { InquiryCreatedData } from './schemas.js';
import type { RenderedDiscordMessage, RenderedEmbedField } from './types.js';

function field(name: string, value: string | undefined): RenderedEmbedField | undefined {
  if (!value) return undefined;
  return { name, value: truncate(value, EMBED_LIMITS.FIELD_VALUE), inline: true };
}

/**
 * INQUIRY_CREATED는 관리자에게 "새 문의가 도착했다"는 사실만 알리는
 * Alert 용도다. 문의 전문, 연락처(전화번호/이메일) 등은 data schema
 * 단계에서부터 허용되지 않으므로(schemas.ts의 `.strict()`) 여기서는
 * 최소한의 식별 정보만 다룬다. 실제 문의 내용 확인은 GETI Server의
 * 관리자 화면에서 이뤄진다.
 */
export function renderInquiryCreated(data: InquiryCreatedData): RenderedDiscordMessage {
  const fields = [
    field('문의 ID', data.inquiryId),
    field('분류', data.category),
    field('접수자', data.requesterName),
    field('접수 시각', data.submittedAt),
  ].filter((value): value is RenderedEmbedField => value !== undefined);

  return {
    embeds: [
      {
        title: '📩 새 문의가 접수되었습니다',
        description: '자세한 내용은 관리자 페이지에서 확인해주세요.',
        color: EMBED_COLORS.INQUIRY,
        fields,
        timestamp: new Date().toISOString(),
      },
    ],
  };
}
