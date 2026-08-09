import { z } from 'zod';
import type { Template } from '../internal-api/types.js';

/**
 * Template별 data payload Zod Schema.
 *
 * 모두 `.strict()`로 선언되어 있어, 여기 명시되지 않은 필드(전화번호,
 * 이메일, Token, 파일 다운로드 URL, 문의 전문 등)가 포함된 요청은 애초에
 * Renderer에 도달하지 못하고 거부된다. INQUIRY_CREATED가 민감정보를
 * 렌더링하지 않도록 하는 1차 방어선이다.
 */

const idSchema = z.string().trim().min(1).max(64);
const titleSchema = z.string().trim().min(1).max(200);
const urlSchema = z.string().trim().url().max(500);
const shortTextSchema = z.string().trim().min(1).max(300);
const labelSchema = z.string().trim().min(1).max(100);

export const jobPublishedDataSchema = z
  .object({
    jobId: idSchema,
    title: titleSchema,
    companyName: labelSchema.optional(),
    location: labelSchema.optional(),
    employmentType: z.string().trim().min(1).max(50).optional(),
    deadline: z.string().trim().min(1).max(50).optional(),
    url: urlSchema.optional(),
  })
  .strict();
export type JobPublishedData = z.infer<typeof jobPublishedDataSchema>;

export const jobUpdatedDataSchema = z
  .object({
    jobId: idSchema,
    title: titleSchema,
    changes: shortTextSchema.optional(),
    url: urlSchema.optional(),
  })
  .strict();
export type JobUpdatedData = z.infer<typeof jobUpdatedDataSchema>;

export const jobClosedDataSchema = z
  .object({
    jobId: idSchema,
    title: titleSchema,
    reason: shortTextSchema.optional(),
    url: urlSchema.optional(),
  })
  .strict();
export type JobClosedData = z.infer<typeof jobClosedDataSchema>;

export const jobDeletedDataSchema = z
  .object({
    jobId: idSchema,
    title: titleSchema,
    reason: shortTextSchema.optional(),
  })
  .strict();
export type JobDeletedData = z.infer<typeof jobDeletedDataSchema>;

export const programPublishedDataSchema = z
  .object({
    programId: idSchema,
    title: titleSchema,
    description: z.string().trim().min(1).max(500).optional(),
    startAt: z.string().trim().min(1).max(50).optional(),
    endAt: z.string().trim().min(1).max(50).optional(),
    url: urlSchema.optional(),
  })
  .strict();
export type ProgramPublishedData = z.infer<typeof programPublishedDataSchema>;

export const programUpdatedDataSchema = z
  .object({
    programId: idSchema,
    title: titleSchema,
    changes: shortTextSchema.optional(),
    url: urlSchema.optional(),
  })
  .strict();
export type ProgramUpdatedData = z.infer<typeof programUpdatedDataSchema>;

export const programClosedDataSchema = z
  .object({
    programId: idSchema,
    title: titleSchema,
    reason: shortTextSchema.optional(),
    url: urlSchema.optional(),
  })
  .strict();
export type ProgramClosedData = z.infer<typeof programClosedDataSchema>;

export const programDeletedDataSchema = z
  .object({
    programId: idSchema,
    title: titleSchema,
    reason: shortTextSchema.optional(),
  })
  .strict();
export type ProgramDeletedData = z.infer<typeof programDeletedDataSchema>;

/**
 * INQUIRY_CREATED는 관리자 Alert 용도이며 민감정보를 최소화한다.
 * 전화번호/이메일/Token/파일 다운로드 URL/문의 전문은 필드로 선언하지
 * 않으므로 `.strict()`에 의해 요청 자체가 거부된다.
 */
export const inquiryCreatedDataSchema = z
  .object({
    inquiryId: idSchema,
    category: z.string().trim().min(1).max(50).optional(),
    requesterName: labelSchema.optional(),
    submittedAt: z.string().trim().min(1).max(50).optional(),
  })
  .strict();
export type InquiryCreatedData = z.infer<typeof inquiryCreatedDataSchema>;

export const TEMPLATE_DATA_SCHEMAS = {
  JOB_PUBLISHED: jobPublishedDataSchema,
  JOB_UPDATED: jobUpdatedDataSchema,
  JOB_CLOSED: jobClosedDataSchema,
  JOB_DELETED: jobDeletedDataSchema,
  PROGRAM_PUBLISHED: programPublishedDataSchema,
  PROGRAM_UPDATED: programUpdatedDataSchema,
  PROGRAM_CLOSED: programClosedDataSchema,
  PROGRAM_DELETED: programDeletedDataSchema,
  INQUIRY_CREATED: inquiryCreatedDataSchema,
} satisfies Record<Template, z.ZodTypeAny>;

/**
 * ZodError를 한 줄 메시지로 변환한다.
 * internal-api/schema.ts의 동일한 목적 함수와 별개로 유지한다: Renderer는
 * Transport(Fastify/HTTP) 계층을 알지 못해야 하므로 그쪽 모듈을 참조하지
 * 않는다.
 */
export function formatZodError(error: z.ZodError): string {
  return error.issues
    .map((issue) => `${issue.path.length > 0 ? issue.path.join('.') : '(root)'}: ${issue.message}`)
    .join('; ');
}
