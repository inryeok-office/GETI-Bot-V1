import type { z } from 'zod';
import type { DiscordMessageCommand, Template } from '../internal-api/types.js';
import { renderInquiryCreated } from './inquiry.js';
import { renderJobClosed, renderJobDeleted, renderJobPublished, renderJobUpdated } from './job.js';
import {
  renderProgramClosed,
  renderProgramDeleted,
  renderProgramPublished,
  renderProgramUpdated,
} from './program.js';
import {
  formatZodError,
  inquiryCreatedDataSchema,
  jobClosedDataSchema,
  jobDeletedDataSchema,
  jobPublishedDataSchema,
  jobUpdatedDataSchema,
  programClosedDataSchema,
  programDeletedDataSchema,
  programPublishedDataSchema,
  programUpdatedDataSchema,
} from './schemas.js';
import { RenderError, type RenderedDiscordMessage } from './types.js';

type Renderer = (data: unknown) => RenderedDiscordMessage;

/**
 * data를 주어진 Zod Schema로 검증한 뒤 Template 전용 Render 함수에 전달하는
 * Renderer를 만든다. 검증 실패 시 RenderError를 던진다.
 */
function withSchema<Data>(
  schema: z.ZodType<Data>,
  render: (data: Data) => RenderedDiscordMessage,
): Renderer {
  return (data: unknown) => {
    const result = schema.safeParse(data);
    if (!result.success) {
      throw new RenderError(`invalid template data: ${formatZodError(result.error)}`);
    }
    return render(result.data);
  };
}

/**
 * Template → Renderer 매핑.
 * 새 Template을 추가하려면 이 Registry와 schemas.ts에 항목을 더한다.
 */
const REGISTRY: Record<Template, Renderer> = {
  JOB_PUBLISHED: withSchema(jobPublishedDataSchema, renderJobPublished),
  JOB_UPDATED: withSchema(jobUpdatedDataSchema, renderJobUpdated),
  JOB_CLOSED: withSchema(jobClosedDataSchema, renderJobClosed),
  JOB_DELETED: withSchema(jobDeletedDataSchema, renderJobDeleted),
  PROGRAM_PUBLISHED: withSchema(programPublishedDataSchema, renderProgramPublished),
  PROGRAM_UPDATED: withSchema(programUpdatedDataSchema, renderProgramUpdated),
  PROGRAM_CLOSED: withSchema(programClosedDataSchema, renderProgramClosed),
  PROGRAM_DELETED: withSchema(programDeletedDataSchema, renderProgramDeleted),
  INQUIRY_CREATED: withSchema(inquiryCreatedDataSchema, renderInquiryCreated),
};

/**
 * DiscordMessageCommand를 Template에 맞는 Discord Embed 표현으로 변환한다.
 * Renderer가 아는 것은 이 Command 타입뿐이며, Fastify Request나 Zod Route
 * Schema를 알지 못한다.
 */
export function renderDiscordMessage(command: DiscordMessageCommand): RenderedDiscordMessage {
  const renderer = REGISTRY[command.template];
  return renderer(command.data);
}
