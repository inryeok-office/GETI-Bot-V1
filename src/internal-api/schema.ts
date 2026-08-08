import { z } from 'zod';
import { TARGET_TYPES, TEMPLATE_INFO, TEMPLATES } from './types.js';

const ID_MAX_LENGTH = 64;
const idSchema = z.string().trim().min(1).max(ID_MAX_LENGTH);

const ROLE_IDS_MAX = 10;

/**
 * targetType / action / template 세 값이 서로 모순되지 않는지 검증한다.
 * 예: template이 JOB_PUBLISHED인데 targetType이 PROGRAM이면 안 된다.
 */
function refineTemplateConsistency<
  T extends { targetType: string; action: string; template: string },
>(value: T, ctx: z.RefinementCtx): void {
  const info = TEMPLATE_INFO[value.template as keyof typeof TEMPLATE_INFO];
  if (!info) return;

  if (info.targetType !== value.targetType) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['targetType'],
      message: `template '${value.template}' requires targetType '${info.targetType}'`,
    });
  }

  if (info.action !== value.action) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['action'],
      message: `template '${value.template}' requires action '${info.action}'`,
    });
  }
}

export const createBodySchema = z
  .object({
    targetType: z.enum(TARGET_TYPES),
    action: z.literal('CREATE'),
    template: z.enum(TEMPLATES),
    channelId: idSchema,
    roleIds: z.array(idSchema).max(ROLE_IDS_MAX).default([]),
    data: z.record(z.string(), z.unknown()),
  })
  .strict()
  .superRefine(refineTemplateConsistency);

export type CreateBody = z.infer<typeof createBodySchema>;

const PATCH_ACTIONS = ['UPDATE', 'CLOSE_NOTICE', 'DELETE_NOTICE'] as const;

export const patchBodySchema = z
  .object({
    targetType: z.enum(TARGET_TYPES),
    action: z.enum(PATCH_ACTIONS),
    template: z.enum(TEMPLATES),
    channelId: idSchema,
    data: z.record(z.string(), z.unknown()),
  })
  .strict()
  .superRefine(refineTemplateConsistency);

export type PatchBody = z.infer<typeof patchBodySchema>;

export const patchParamsSchema = z.object({
  messageId: idSchema,
});

export type PatchParams = z.infer<typeof patchParamsSchema>;

const IDEMPOTENCY_KEY_MAX_LENGTH = 200;

export const createHeadersSchema = z
  .object({
    'x-idempotency-key': z.string().trim().min(1).max(IDEMPOTENCY_KEY_MAX_LENGTH),
  })
  .passthrough();

export type CreateHeaders = z.infer<typeof createHeadersSchema>;

/**
 * ZodError를 사람이 읽을 수 있는 한 줄 메시지로 변환한다.
 * Client에는 field 단위 세부 원인을 알려주되, 내부 구현 세부사항은
 * 노출하지 않는다.
 */
export function formatZodError(error: z.ZodError): string {
  return error.issues
    .map((issue) => `${issue.path.length > 0 ? issue.path.join('.') : '(root)'}: ${issue.message}`)
    .join('; ');
}
